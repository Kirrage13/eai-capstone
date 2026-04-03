const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// ─────────────────────────────────────────────
// Configuration — loaded from environment
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

const NODERED_URL = process.env.NODERED_URL;
const PAYMENT_URL = process.env.PAYMENT_URL;
const INVENTORY_URL = process.env.INVENTORY_URL;
const NOTIFICATION_URL = process.env.NOTIFICATION_URL;

// ─────────────────────────────────────────────
// In-memory order store
// ─────────────────────────────────────────────
const orders = new Map();

// ─────────────────────────────────────────────
// Health check — provided, do not change
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

// ─────────────────────────────────────────────
// POST /orders
// ─────────────────────────────────────────────
app.post('/orders', (req, res) => {
  const orderId = `ord-${uuidv4().slice(0, 8)}`;
  const correlationId = req.body.correlationId || uuidv4(); // Correlation Identifier Pattern

  const order = {
    orderId,
    correlationId,
    ...req.body,
    receivedAt: new Date().toISOString(),
    status: 'received'
  };

  orders.set(orderId, order);

  res.status(201).json({
    orderId,
    correlationId,
    status: 'received'
  });
});

// ─────────────────────────────────────────────
// GET /orders/:id
// ─────────────────────────────────────────────
app.get('/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

app.listen(PORT, () => {
  console.log(`[order-service] Running on port ${PORT}`);
});
