import express from 'express';
import { query } from '../db/connection.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, name, location FROM warehouses ORDER BY created_at DESC');
    const warehouses = result.rows.map((w) => ({
      id: w.id,
      name: w.name,
      location: w.location,
    }));

    res.json(warehouses);
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Warehouse name is required' });
    }

    const result = await query(
      'INSERT INTO warehouses (name, location, created_by) VALUES ($1, $2, $3) RETURNING id, name, location',
      [name, location || '', req.user.userId]
    );

    const warehouse = result.rows[0];

    res.status(201).json({
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

export default router;
