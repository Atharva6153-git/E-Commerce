const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllProducts = async (req, res) => {
  const { category, search } = req.query;
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(category && { category: { slug: category } }),
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, imageUrl, categoryId } = req.body;
    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({ error: 'name, description, price, categoryId are required' });
    }
    const product = await prisma.product.create({
      data: { name, description, price, imageUrl, categoryId },
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
