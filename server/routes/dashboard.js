import express from 'express';
import { query } from '../db/connection.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

router.get('/kpis', authenticateToken, async (req, res) => {
  try {
    const totalProductsResult = await query(
      'SELECT COUNT(DISTINCT product_id) as count FROM stock_levels WHERE quantity > 0'
    );
    const totalProducts = totalProductsResult.rows[0].count;

    const lowStockResult = await query(
      'SELECT COUNT(*) as count FROM stock_levels sl JOIN products p ON sl.product_id = p.id WHERE sl.quantity > 0 AND sl.quantity <= p.reorder_level'
    );
    const lowStock = lowStockResult.rows[0].count;

    const outOfStockResult = await query('SELECT COUNT(*) as count FROM stock_levels WHERE quantity = 0');
    const outOfStock = outOfStockResult.rows[0].count;

    const pendingReceiptsResult = await query("SELECT COUNT(*) as count FROM receipts WHERE status != 'done'");
    const pendingReceipts = pendingReceiptsResult.rows[0].count;

    const pendingDeliveriesResult = await query("SELECT COUNT(*) as count FROM deliveries WHERE status != 'done'");
    const pendingDeliveries = pendingDeliveriesResult.rows[0].count;

    const pendingTransfersResult = await query("SELECT COUNT(*) as count FROM transfers WHERE status != 'done'");
    const pendingTransfers = pendingTransfersResult.rows[0].count;

    res.json({
      totalProducts: parseInt(totalProducts),
      lowStock: parseInt(lowStock),
      outOfStock: parseInt(outOfStock),
      pendingReceipts: parseInt(pendingReceipts),
      pendingDeliveries: parseInt(pendingDeliveries),
      pendingTransfers: parseInt(pendingTransfers),
    });
  } catch (error) {
    console.error('Get KPIs error:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

router.get('/recent-operations', authenticateToken, async (req, res) => {
  try {
    const receiptsResult = await query(
      'SELECT id, receipt_number, supplier_name, status, created_at FROM receipts ORDER BY created_at DESC LIMIT 5'
    );

    const deliveriesResult = await query(
      'SELECT id, delivery_number, customer_name, status, created_at FROM deliveries ORDER BY created_at DESC LIMIT 5'
    );

    const transfersResult = await query(
      'SELECT id, transfer_number, status, created_at FROM transfers ORDER BY created_at DESC LIMIT 5'
    );

    const adjustmentsResult = await query(
      'SELECT id, adjustment_number, status, created_at FROM adjustments ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      receipts: receiptsResult.rows.map((r) => ({
        id: r.id,
        type: 'receipt',
        number: r.receipt_number,
        description: r.supplier_name,
        status: r.status,
        createdAt: r.created_at,
      })),
      deliveries: deliveriesResult.rows.map((d) => ({
        id: d.id,
        type: 'delivery',
        number: d.delivery_number,
        description: d.customer_name,
        status: d.status,
        createdAt: d.created_at,
      })),
      transfers: transfersResult.rows.map((t) => ({
        id: t.id,
        type: 'transfer',
        number: t.transfer_number,
        status: t.status,
        createdAt: t.created_at,
      })),
      adjustments: adjustmentsResult.rows.map((a) => ({
        id: a.id,
        type: 'adjustment',
        number: a.adjustment_number,
        status: a.status,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    console.error('Get recent operations error:', error);
    res.status(500).json({ error: 'Failed to fetch recent operations' });
  }
});

router.get('/stock-by-warehouse', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT w.id, w.name, COUNT(DISTINCT sl.product_id) as product_count, COALESCE(SUM(sl.quantity), 0) as total_quantity FROM warehouses w LEFT JOIN stock_levels sl ON w.id = sl.warehouse_id GROUP BY w.id, w.name'
    );

    res.json(
      result.rows.map((r) => ({
        warehouseId: r.id,
        warehouseName: r.name,
        productCount: parseInt(r.product_count),
        totalQuantity: parseInt(r.total_quantity),
      }))
    );
  } catch (error) {
    console.error('Get stock by warehouse error:', error);
    res.status(500).json({ error: 'Failed to fetch stock by warehouse' });
  }
});

export default router;
