import { query } from './connection.js';

export const initializeDatabase = async () => {
  try {
    await createTables();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

const createTables = async () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'warehouse_staff',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS warehouses (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      sku VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      unit_of_measure VARCHAR(50),
      reorder_level INTEGER DEFAULT 0,
      reorder_quantity INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS stock_levels (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 0,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, warehouse_id)
    )`,

    `CREATE TABLE IF NOT EXISTS receipts (
      id SERIAL PRIMARY KEY,
      receipt_number VARCHAR(255) UNIQUE NOT NULL,
      supplier_name VARCHAR(255) NOT NULL,
      warehouse_id INTEGER REFERENCES warehouses(id),
      status VARCHAR(50) DEFAULT 'draft',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS receipt_items (
      id SERIAL PRIMARY KEY,
      receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity_expected INTEGER NOT NULL,
      quantity_received INTEGER DEFAULT 0,
      unit_price DECIMAL(10, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS deliveries (
      id SERIAL PRIMARY KEY,
      delivery_number VARCHAR(255) UNIQUE NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      warehouse_id INTEGER REFERENCES warehouses(id),
      status VARCHAR(50) DEFAULT 'draft',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS delivery_items (
      id SERIAL PRIMARY KEY,
      delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity_expected INTEGER NOT NULL,
      quantity_delivered INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS transfers (
      id SERIAL PRIMARY KEY,
      transfer_number VARCHAR(255) UNIQUE NOT NULL,
      from_warehouse_id INTEGER REFERENCES warehouses(id),
      to_warehouse_id INTEGER REFERENCES warehouses(id),
      status VARCHAR(50) DEFAULT 'draft',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS transfer_items (
      id SERIAL PRIMARY KEY,
      transfer_id INTEGER REFERENCES transfers(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity_expected INTEGER NOT NULL,
      quantity_transferred INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS adjustments (
      id SERIAL PRIMARY KEY,
      adjustment_number VARCHAR(255) UNIQUE NOT NULL,
      warehouse_id INTEGER REFERENCES warehouses(id),
      reason VARCHAR(255),
      status VARCHAR(50) DEFAULT 'draft',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS adjustment_items (
      id SERIAL PRIMARY KEY,
      adjustment_id INTEGER REFERENCES adjustments(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      counted_quantity INTEGER NOT NULL,
      expected_quantity INTEGER NOT NULL,
      adjustment_quantity INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS stock_ledger (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id),
      warehouse_id INTEGER REFERENCES warehouses(id),
      document_type VARCHAR(50),
      document_id INTEGER,
      quantity_change INTEGER NOT NULL,
      reference_number VARCHAR(255),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE INDEX IF NOT EXISTS idx_stock_levels_product_warehouse
     ON stock_levels(product_id, warehouse_id)`,

    `CREATE INDEX IF NOT EXISTS idx_stock_ledger_product_warehouse
     ON stock_ledger(product_id, warehouse_id)`,

    `CREATE INDEX IF NOT EXISTS idx_stock_ledger_created_at
     ON stock_ledger(created_at)`,

    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,

    `CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`,

    `CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status)`,

    `CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status)`,

    `CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status)`,

    `CREATE INDEX IF NOT EXISTS idx_adjustments_status ON adjustments(status)`,
  ];

  for (const sql of tables) {
    try {
      await query(sql);
    } catch (error) {
      console.error('Error creating table:', error);
    }
  }
};
