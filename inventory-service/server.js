/**
 * Inventory Service
 *
 * YOU MUST IMPLEMENT the TODO sections below.
 *
 * This service handles stock reservation and release.
 * It is called by your Node-RED orchestration flow after payment succeeds.
 *
 * Behaviour is controlled by INVENTORY_FAIL_MODE environment variable:
 *   never  — always reserve successfully
 *   always — always report unavailable (useful for testing compensation logic)
 *   random — 10% unavailability rate
 *
 * The /admin endpoints are used by the instructor's grading session.
 * Do not remove them, but you do not need to document them in your README.
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// ─────────────────────────────────────────────
// Configuration — loaded from environment
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3003;

// Controls whether inventory reservations succeed:
//   'never'  — always reserved
//   'always' — always unavailable (useful for compensation testing)
//   'random' — 10% unavailability
const INVENTORY_FAIL_MODE = process.env.INVENTORY_FAIL_MODE || 'never';

// ─────────────────────────────────────────────
// In-memory call log (used by /admin/logs)
// Tracks every reserve and release call made to this service.
// ─────────────────────────────────────────────
const callLog = [];

// ─────────────────────────────────────────────
// Health check — provided, do not change
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inventory-service' });
});

// ─────────────────────────────────────────────
// POST /inventory/reserve
// ─────────────────────────────────────────────
app.post('/inventory/reserve', (req, res) => {
  const correlationId =
    req.body.correlationId ||
    req.get('X-Correlation-Id') ||
    uuidv4();

  const { orderId } = req.body;

  callLog.push({
    endpoint: '/inventory/reserve',
    correlationId,
    orderId,
    timestamp: new Date().toISOString()
  });

  let shouldFail = false;

  if (INVENTORY_FAIL_MODE === 'always') {
    shouldFail = true;
  } else if (INVENTORY_FAIL_MODE === 'random') {
    shouldFail = Math.random() < 0.1;
  }

  if (shouldFail) {
    return res.status(422).json({
      status: 'unavailable',
      reason: 'Insufficient stock',
      correlationId
    });
  }

  res.status(200).json({
    status: 'reserved',
    reservationId: uuidv4(),
    correlationId
  });
});

// ─────────────────────────────────────────────
// POST /inventory/release
// ─────────────────────────────────────────────
app.post('/inventory/release', (req, res) => {
  const correlationId =
    req.body.correlationId ||
    req.get('X-Correlation-Id') ||
    uuidv4();

  const { orderId } = req.body;

  callLog.push({
    endpoint: '/inventory/release',
    correlationId,
    orderId,
    timestamp: new Date().toISOString()
  });

  res.status(200).json({
    status: 'released',
    correlationId
  });
});

// ─────────────────────────────────────────────
// Admin endpoints — used by instructor grading session
// Do not remove. Do not document in your student README.
// ─────────────────────────────────────────────

app.get('/admin/logs', (req, res) => {
  res.json(callLog);
});

app.post('/admin/reset', (req, res) => {
  callLog.length = 0;
  console.log('[inventory-service] Call log cleared');
  res.json({ status: 'ok', message: 'Call log cleared' });
});

app.listen(PORT, () => {
  console.log(`[inventory-service] Running on port ${PORT} | INVENTORY_FAIL_MODE=${INVENTORY_FAIL_MODE}`);
});
