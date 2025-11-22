import express from 'express';
import { query } from '../db/connection.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

const generateDeliveryNumber = async () => {
  const result = await query('SELECT COUNT(*) as count FROM deliveries');
  const count = parseInt(result.rows[0].count) + 1;
  return `DEL-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, warehouse } = req.query;
    let sql = 'SELECT * FROM deliveries';
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
    const deliveries = result.rows.map((d) => ({
      id: d.id,
      deliveryNumber: d.delivery_number,
      customerName: d.customer_name,
      warehouseId: d.warehouse_id,
      status: d.status,
      createdAt: d.created_at,
    }));

    res.json(deliveries);
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryResult = await query('SELECT * FROM deliveries WHERE id = $1', [id]);

    if (deliveryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const delivery = deliveryResult.rows[0];
    const itemsResult = await query(
      'SELECT di.*, p.sku, p.name FROM delivery_items di JOIN products p ON di.product_id = p.id WHERE di.delivery_id = $1',
      [id]
    );

    res.json({
      id: delivery.id,
      deliveryNumber: delivery.delivery_number,
      customerName: delivery.customer_name,
      warehouseId: delivery.warehouse_id,
      status: delivery.status,
      items: itemsResult.rows.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productSku: item.sku,
        productName: item.name,
        quantityExpected: item.quantity_expected,
        quantityDelivered: item.quantity_delivered,
      })),
      createdAt: delivery.created_at,
    });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({ error: 'Failed to fetch delivery' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customerName, warehouseId, items } = req.body;

    if (!customerName || !warehouseId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const deliveryNumber = await generateDeliveryNumber();
    const deliveryResult = await query(
      'INSERT INTO deliveries (delivery_number, customer_name, warehouse_id, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
      [deliveryNumber, customerName, warehouseId, req.user.userId]
    );

    const deliveryId = deliveryResult.rows[0].id;

    for (const item of items) {
      await query('INSERT INTO delivery_items (delivery_id, product_id, quantity_expected) VALUES ($1, $2, $3)', [
        deliveryId,
        item.productId,
        item.quantityExpected,
      ]);
    }

    res.status(201).json({
      id: deliveryId,
      deliveryNumber,
      customerName,
      warehouseId,
      status: 'draft',
    });
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

router.post('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const itemsResult = await query('SELECT * FROM delivery_items WHERE delivery_id = $1', [id]);

    const warehouseResult = await query('SELECT warehouse_id FROM deliveries WHERE id = $1', [id]);
    const warehouseId = warehouseResult.rows[0].warehouse_id;

    for (const item of itemsResult.rows) {
      const currentStock = await query('SELECT quantity FROM stock_levels WHERE product_id = $1 AND warehouse_id = $2', [
        item.product_id,
        warehouseId,
      ]);

      if (currentStock.rows.length === 0 || currentStock.rows[0].quantity < item.quantity_delivered) {
        return res.status(400).json({ error: 'Insufficient stock for delivery' });
      }

      await query('UPDATE stock_levels SET quantity = quantity - $1 WHERE product_id = $2 AND warehouse_id = $3', [
        item.quantity_delivered,
        item.product_id,
        warehouseId,
      ]);

      await query(
        'INSERT INTO stock_ledger (product_id, warehouse_id, document_type, document_id, quantity_change, reference_number, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [item.product_id, warehouseId, 'delivery', id, -item.quantity_delivered, `DEL-${id}`, req.user.userId]
      );
    }

    await query('UPDATE deliveries SET status = $1 WHERE id = $2', ['done', id]);

    res.json({ message: 'Delivery validated successfully' });
  } catch (error) {
    console.error('Validate delivery error:', error);
    res.status(500).json({ error: 'Failed to validate delivery' });
  }
});

router.put('/:id/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantityDelivered } = req.body;

    await query('UPDATE delivery_items SET quantity_delivered = $1 WHERE id = $2', [quantityDelivered, itemId]);

    res.json({ message: 'Delivery item updated' });
  } catch (error) {
    console.error('Update delivery item error:', error);
    res.status(500).json({ error: 'Failed to update delivery item' });
  }
});

export default router;
