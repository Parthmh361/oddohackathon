import express from 'express';
import { query } from '../db/connection.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, search, warehouse } = req.query;
    let sql =
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id';
    const params = [];

    if (category) {
      sql += ' WHERE p.category_id = $' + (params.length + 1);
      params.push(category);
    }

    if (search) {
      if (params.length === 0) sql += ' WHERE';
      else sql += ' AND';
      sql += ' (p.name ILIKE $' + (params.length + 1) + ' OR p.sku ILIKE $' + (params.length + 2) + ')';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.created_at DESC';

    const result = await query(sql, params);
    const products = result.rows.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category_name,
      unitOfMeasure: p.unit_of_measure,
      reorderLevel: p.reorder_level,
      reorderQuantity: p.reorder_quantity,
    }));

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const p = result.rows[0];
    const stockResult = await query('SELECT warehouse_id, quantity FROM stock_levels WHERE product_id = $1', [
      id,
    ]);

    res.json({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category_name,
      unitOfMeasure: p.unit_of_measure,
      reorderLevel: p.reorder_level,
      reorderQuantity: p.reorder_quantity,
      stock: stockResult.rows.map((s) => ({
        warehouseId: s.warehouse_id,
        quantity: s.quantity,
      })),
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { sku, name, categoryId, unitOfMeasure, initialStock, warehouseId } = req.body;

    if (!sku || !name) {
      return res.status(400).json({ error: 'SKU and name are required' });
    }

    const existingSku = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existingSku.rows.length > 0) {
      return res.status(400).json({ error: 'SKU already exists' });
    }

    const result = await query(
      'INSERT INTO products (sku, name, category_id, unit_of_measure, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, sku, name',
      [sku, name, categoryId || null, unitOfMeasure || 'unit', req.user.userId]
    );

    const product = result.rows[0];

    if (initialStock && warehouseId) {
      await query(
        'INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)',
        [product.id, warehouseId, initialStock]
      );

      await query(
        'INSERT INTO stock_ledger (product_id, warehouse_id, document_type, quantity_change, reference_number, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
        [product.id, warehouseId, 'initial', initialStock, `PRODUCT_CREATE_${product.id}`, req.user.userId]
      );
    }

    res.status(201).json({
      id: product.id,
      sku: product.sku,
      name: product.name,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, unitOfMeasure, reorderLevel, reorderQuantity } = req.body;

    await query(
      'UPDATE products SET name = COALESCE($1, name), category_id = COALESCE($2, category_id), unit_of_measure = COALESCE($3, unit_of_measure), reorder_level = COALESCE($4, reorder_level), reorder_quantity = COALESCE($5, reorder_quantity), updated_at = CURRENT_TIMESTAMP WHERE id = $6',
      [name, categoryId, unitOfMeasure, reorderLevel, reorderQuantity, id]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

export default router;
