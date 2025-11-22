import express from 'express';
import { query } from '../db/connection.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

const generateTransferNumber = async () => {
  const result = await query('SELECT COUNT(*) as count FROM transfers');
  const count = parseInt(result.rows[0].count) + 1;
  return `TRN-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM transfers';
    const params = [];

    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    const transfers = result.rows.map((t) => ({
      id: t.id,
      transferNumber: t.transfer_number,
      fromWarehouseId: t.from_warehouse_id,
      toWarehouseId: t.to_warehouse_id,
      status: t.status,
      createdAt: t.created_at,
    }));

    res.json(transfers);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, items } = req.body;

    if (!fromWarehouseId || !toWarehouseId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transferNumber = await generateTransferNumber();
    const transferResult = await query(
      'INSERT INTO transfers (transfer_number, from_warehouse_id, to_warehouse_id, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
      [transferNumber, fromWarehouseId, toWarehouseId, req.user.userId]
    );

    const transferId = transferResult.rows[0].id;

    for (const item of items) {
      await query('INSERT INTO transfer_items (transfer_id, product_id, quantity_expected) VALUES ($1, $2, $3)', [
        transferId,
        item.productId,
        item.quantity,
      ]);
    }

    res.status(201).json({
      id: transferId,
      transferNumber,
      fromWarehouseId,
      toWarehouseId,
      status: 'draft',
    });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

router.post('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const transferResult = await query('SELECT * FROM transfers WHERE id = $1', [id]);
    const transfer = transferResult.rows[0];
    const itemsResult = await query('SELECT * FROM transfer_items WHERE transfer_id = $1', [id]);

    for (const item of itemsResult.rows) {
      const currentStock = await query('SELECT quantity FROM stock_levels WHERE product_id = $1 AND warehouse_id = $2', [
        item.product_id,
        transfer.from_warehouse_id,
      ]);

      if (currentStock.rows.length === 0 || currentStock.rows[0].quantity < item.quantity_transferred) {
        return res.status(400).json({ error: 'Insufficient stock for transfer' });
      }

      await query('UPDATE stock_levels SET quantity = quantity - $1 WHERE product_id = $2 AND warehouse_id = $3', [
        item.quantity_transferred,
        item.product_id,
        transfer.from_warehouse_id,
      ]);

      const existingStock = await query('SELECT id FROM stock_levels WHERE product_id = $1 AND warehouse_id = $2', [
        item.product_id,
        transfer.to_warehouse_id,
      ]);

      if (existingStock.rows.length === 0) {
        await query('INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)', [
          item.product_id,
          transfer.to_warehouse_id,
          item.quantity_transferred,
        ]);
      } else {
        await query('UPDATE stock_levels SET quantity = quantity + $1 WHERE product_id = $2 AND warehouse_id = $3', [
          item.quantity_transferred,
          item.product_id,
          transfer.to_warehouse_id,
        ]);
      }

      await query(
        'INSERT INTO stock_ledger (product_id, warehouse_id, document_type, document_id, quantity_change, reference_number, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [item.product_id, transfer.from_warehouse_id, 'transfer_out', id, -item.quantity_transferred, `TRN-${id}`, req.user.userId]
      );

      await query(
        'INSERT INTO stock_ledger (product_id, warehouse_id, document_type, document_id, quantity_change, reference_number, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [item.product_id, transfer.to_warehouse_id, 'transfer_in', id, item.quantity_transferred, `TRN-${id}`, req.user.userId]
      );
    }

    await query('UPDATE transfers SET status = $1 WHERE id = $2', ['done', id]);

    res.json({ message: 'Transfer validated successfully' });
  } catch (error) {
    console.error('Validate transfer error:', error);
    res.status(500).json({ error: 'Failed to validate transfer' });
  }
});

export default router;
