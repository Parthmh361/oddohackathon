import express from 'express';
import { query } from '../db/connection.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

const generateReceiptNumber = async () => {
  const result = await query('SELECT COUNT(*) as count FROM receipts');
  const count = parseInt(result.rows[0].count) + 1;
  return `RCP-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, warehouse } = req.query;
    let sql = 'SELECT * FROM receipts';
    const params = [];

    if (status) {
      sql += ' WHERE status = $' + (params.length + 1);
      params.push(status);
    }

    if (warehouse) {
      if (params.length === 0) sql += ' WHERE';
      else sql += ' AND';
      sql += ' warehouse_id = $' + (params.length + 1);
      params.push(warehouse);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    const receipts = result.rows.map((r) => ({
      id: r.id,
      receiptNumber: r.receipt_number,
      supplierName: r.supplier_name,
      warehouseId: r.warehouse_id,
      status: r.status,
      createdAt: r.created_at,
    }));

    res.json(receipts);
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const receiptResult = await query('SELECT * FROM receipts WHERE id = $1', [id]);

    if (receiptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const receipt = receiptResult.rows[0];
    const itemsResult = await query(
      'SELECT ri.*, p.sku, p.name FROM receipt_items ri JOIN products p ON ri.product_id = p.id WHERE ri.receipt_id = $1',
      [id]
    );

    res.json({
      id: receipt.id,
      receiptNumber: receipt.receipt_number,
      supplierName: receipt.supplier_name,
      warehouseId: receipt.warehouse_id,
      status: receipt.status,
      items: itemsResult.rows.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productSku: item.sku,
        productName: item.name,
        quantityExpected: item.quantity_expected,
        quantityReceived: item.quantity_received,
        unitPrice: item.unit_price,
      })),
      createdAt: receipt.created_at,
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { supplierName, warehouseId, items } = req.body;

    if (!supplierName || !warehouseId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const receiptNumber = await generateReceiptNumber();
    const receiptResult = await query(
      'INSERT INTO receipts (receipt_number, supplier_name, warehouse_id, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
      [receiptNumber, supplierName, warehouseId, req.user.userId]
    );

    const receiptId = receiptResult.rows[0].id;

    for (const item of items) {
      await query(
        'INSERT INTO receipt_items (receipt_id, product_id, quantity_expected, unit_price) VALUES ($1, $2, $3, $4)',
        [receiptId, item.productId, item.quantityExpected, item.unitPrice || 0]
      );
    }

    res.status(201).json({
      id: receiptId,
      receiptNumber,
      supplierName,
      warehouseId,
      status: 'draft',
    });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ error: 'Failed to create receipt' });
  }
});

router.post('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const itemsResult = await query('SELECT * FROM receipt_items WHERE receipt_id = $1', [id]);

    for (const item of itemsResult.rows) {
      const warehouseResult = await query('SELECT * FROM receipts WHERE id = $1', [id]);
      const warehouseId = warehouseResult.rows[0].warehouse_id;

      const existingStock = await query('SELECT id FROM stock_levels WHERE product_id = $1 AND warehouse_id = $2', [
        item.product_id,
        warehouseId,
      ]);

      if (existingStock.rows.length === 0) {
        await query('INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)', [
          item.product_id,
          warehouseId,
          item.quantity_received,
        ]);
      } else {
        await query('UPDATE stock_levels SET quantity = quantity + $1 WHERE product_id = $2 AND warehouse_id = $3', [
          item.quantity_received,
          item.product_id,
          warehouseId,
        ]);
      }

      await query(
        'INSERT INTO stock_ledger (product_id, warehouse_id, document_type, document_id, quantity_change, reference_number, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [item.product_id, warehouseId, 'receipt', id, item.quantity_received, `RCP-${id}`, req.user.userId]
      );
    }

    await query('UPDATE receipts SET status = $1 WHERE id = $2', ['done', id]);

    res.json({ message: 'Receipt validated successfully' });
  } catch (error) {
    console.error('Validate receipt error:', error);
    res.status(500).json({ error: 'Failed to validate receipt' });
  }
});

router.put('/:id/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantityReceived } = req.body;

    await query('UPDATE receipt_items SET quantity_received = $1 WHERE id = $2', [quantityReceived, itemId]);

    res.json({ message: 'Receipt item updated' });
  } catch (error) {
    console.error('Update receipt item error:', error);
    res.status(500).json({ error: 'Failed to update receipt item' });
  }
});

export default router;
