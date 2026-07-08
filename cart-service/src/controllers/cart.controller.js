const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4002';

// Helper: fetch a product's current price from Catalog Service.
// This is a direct service-to-service call, a common microservices pattern.
async function getProductPrice(productId) {
  const response = await fetch(`${CATALOG_URL}/products/${productId}`);
  if (!response.ok) return null;
  const product = await response.json();
  return product.price;
}

// GET /cart/:userId - fetch (or lazily create) a user's cart with items
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    const total = cart.items.reduce(
      (sum, item) => sum + Number(item.priceSnapshot) * item.quantity,
      0
    );

    res.json({ ...cart, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /cart/:userId/items - add an item (or increment quantity if it already exists)
exports.addItem = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'productId and a positive quantity are required' });
    }

    const price = await getProductPrice(productId);
    if (price == null) {
      return res.status(404).json({ error: 'Product not found in Catalog Service' });
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    let item;
    if (existingItem) {
      item = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity, priceSnapshot: price },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity, priceSnapshot: price },
      });
    }

    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /cart/:userId/items/:productId - set an exact quantity
exports.updateItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    if (quantity == null || quantity < 1) {
      return res.status(400).json({ error: 'A positive quantity is required' });
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
    });

    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /cart/:userId/items/:productId - remove one item
exports.removeItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    await prisma.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /cart/:userId - clear the whole cart (called by Order Service after checkout)
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
