import express from 'express';
import { query } from '../db/connection.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

const generateAdjustmentNumber = async () => {
  const result = await query('SELECT COUNT(*) as count FROM adjustments');
  const count = parseInt(result.rows[0].count) + 1;
  return `ADJ-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, warehouse } = req.query;
    let sql = 'SELECT * FROM adjustments';
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
    const adjustments = result.rows.map((a) => ({
      id: a.id,
      adjustmentNumber: a.adjustment_number,
      warehouseId: a.warehouse_id,
      reason: a.reason,
      status: a.status,
      createdAt: a.created_at,
    }));

    res.json(adjustments);
  } catch (error) {
    console.error('Get adjustments error:', error);
    res.status(500).json({ error: 'Failed to fetch adjustments' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { warehouseId, reason, items } = req.body;

    if (!warehouseId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const adjustmentNumber = await generateAdjustmentNumber();
    const adjustmentResult = await query(
      'INSERT INTO adjustments (adjustment_number, warehouse_id, reason, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
      [adjustmentNumber, warehouseId, reason || '', req.user.userId]
    );

    const adjustmentId = adjustmentResult.rows[0].id;

    for (const item of items) {
      await query(
        'INSERT INTO adjustment_items (adjustment_id, product_id, counted_quantity, expected_quantity) VALUES ($1, $2, $3, $4)',
        [adjustmentId, item.productId, item.countedQuantity, item.expectedQuantity]
      );
    }

    res.status(201).json({
      id: adjustmentId,
      adjustmentNumber,
      warehouseId,
      status: 'draft',
    });
  } catch (error) {
    console.error('Create adjustment error:', error);
    res.status(500).json({ error: 'Failed to create adjustment' });
  }
});

router.post('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const adjustmentResult = await query('SELECT warehouse_id FROM adjustments WHERE id = $1', [id]);
    const warehouseId = adjustmentResult.rows[0].warehouse_id;

    const itemsResult = await query('SELECT * FROM adjustment_items WHERE adjustment_id = $1', [id]);

    for (const item of itemsResult.rows) {
      const adjustmentQuantity = item.counted_quantity - item.expected_quantity;

      await query('UPDATE adjustment_items SET adjustment_quantity = $1 WHERE id = $2', [adjustmentQuantity, item.id]);

      if (adjustmentQuantity !== 0) {
        await query(
          'UPDATE stock_levels SET quantity = quantity + $1 WHERE product_id = $2 AND warehouse_id = $3',
          [adjustmentQuantity, item.product_id, warehouseId]
        );

        await query(
          'INSERT INTO stock_ledger (product_id, warehouse_id, document_type, document_id, quantity_change, reference_number, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [item.product_id, warehouseId, 'adjustment', id, adjustmentQuantity, `ADJ-${id}`, req.user.userId]
        );
      }
    }

    await query('UPDATE adjustments SET status = $1 WHERE id = $2', ['done', id]);

    res.json({ message: 'Adjustment validated successfully' });
  } catch (error) {
    console.error('Validate adjustment error:', error);
    res.status(500).json({ error: 'Failed to validate adjustment' });
  }
});

export default router;
