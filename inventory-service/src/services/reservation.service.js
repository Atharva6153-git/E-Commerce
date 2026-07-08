const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * RESERVE STOCK
 * Called by Order Service when a checkout starts.
 * Locks stock for every item in the order in ONE atomic transaction.
 * If even one item doesn't have enough stock, the WHOLE transaction is
 * rolled back — no partial reservations ever happen.
 */
async function reserveStock(orderId, items) {
  return prisma.$transaction(async (tx) => {
    const reservations = [];

    for (const item of items) {
      const stock = await tx.stock.findUnique({ where: { productId: item.productId } });

      if (!stock) {
        throw new Error(`No stock record found for product ${item.productId}`);
      }

      const available = stock.totalStock - stock.reservedStock;
      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock for product ${item.productId}. Available: ${available}, Requested: ${item.quantity}`
        );
      }

      await tx.stock.update({
        where: { productId: item.productId },
        data: { reservedStock: { increment: item.quantity } },
      });

      const reservation = await tx.reservation.create({
        data: {
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          status: 'PENDING',
        },
      });

      reservations.push(reservation);
    }

    return reservations;
  });
}

/**
 * CONFIRM RESERVATION
 * Called by Order Service AFTER payment succeeds.
 * Moves stock from "reserved" to "actually deducted" and marks reservations CONFIRMED.
 */
async function confirmReservation(orderId) {
  return prisma.$transaction(async (tx) => {
    const pending = await tx.reservation.findMany({
      where: { orderId, status: 'PENDING' },
    });

    if (pending.length === 0) {
      throw new Error(`No PENDING reservations found for order ${orderId}`);
    }

    for (const res of pending) {
      await tx.stock.update({
        where: { productId: res.productId },
        data: {
          totalStock: { decrement: res.quantity },
          reservedStock: { decrement: res.quantity },
        },
      });

      await tx.reservation.update({
        where: { id: res.id },
        data: { status: 'CONFIRMED' },
      });
    }

    return pending.length;
  });
}

/**
 * RELEASE RESERVATION (the compensating transaction)
 * Called by Order Service if payment FAILS or times out.
 * Frees up the reserved stock so other customers can buy it again.
 */
async function releaseReservation(orderId) {
  return prisma.$transaction(async (tx) => {
    const pending = await tx.reservation.findMany({
      where: { orderId, status: 'PENDING' },
    });

    if (pending.length === 0) {
      throw new Error(`No PENDING reservations found for order ${orderId}`);
    }

    for (const res of pending) {
      await tx.stock.update({
        where: { productId: res.productId },
        data: { reservedStock: { decrement: res.quantity } },
      });

      await tx.reservation.update({
        where: { id: res.id },
        data: { status: 'RELEASED' },
      });
    }

    return pending.length;
  });
}

module.exports = { reserveStock, confirmReservation, releaseReservation };
