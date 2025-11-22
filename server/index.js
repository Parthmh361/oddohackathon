import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import receiptsRoutes from './routes/receipts.js';
import deliveriesRoutes from './routes/deliveries.js';
import transfersRoutes from './routes/transfers.js';
import adjustmentsRoutes from './routes/adjustments.js';
import dashboardRoutes from './routes/dashboard.js';
import warehouseRoutes from './routes/warehouse.js';
import { initializeDatabase } from './db/init.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initializeDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/adjustments', adjustmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/warehouse', warehouseRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
