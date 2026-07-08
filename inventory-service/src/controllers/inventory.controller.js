const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { reserveStock, confirmReservation, releaseReservation } = require('../services/reservation.service');

// --- Admin/setup endpoints ---

exports.initStock = async (req, res) => {
  try {
    const { productId, totalStock } = req.body;
    if (!productId || totalStock == null) {
      return res.status(400).json({ error: 'productId and totalStock are required' });
    }
    const stock = await prisma.stock.upsert({
      where: { productId },
      update: { totalStock },
      create: { productId, totalStock },
    });
    res.status(201).json(stock);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getStock = async (req, res) => {
  try {
    const stock = await prisma.stock.findUnique({ where: { productId: req.params.productId } });
    if (!stock) return res.status(404).json({ error: 'No stock record for this product' });
    res.json({
      productId: stock.productId,
      totalStock: stock.totalStock,
      reservedStock: stock.reservedStock,
      available: stock.totalStock - stock.reservedStock,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Saga endpoints, called by Order Service ---

exports.reserve = async (req, res) => {
  try {
    const { orderId, items } = req.body;
    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'orderId and a non-empty items array are required' });
    }
    const reservations = await reserveStock(orderId, items);
    res.status(201).json({ message: 'Stock reserved', orderId, reservations });
  } catch (err) {
    // Insufficient stock or missing product -> whole transaction already rolled back
    res.status(409).json({ error: err.message });
  }
};

exports.confirm = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });
    const count = await confirmReservation(orderId);
    res.json({ message: 'Reservation confirmed, stock deducted', orderId, itemsConfirmed: count });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
};

exports.release = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });
    const count = await releaseReservation(orderId);
    res.json({ message: 'Reservation released, stock restored', orderId, itemsReleased: count });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
};
