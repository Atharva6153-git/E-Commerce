const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4002';

async function main() {
  console.log(`Fetching products from Catalog Service at ${CATALOG_URL}...`);

  const response = await fetch(`${CATALOG_URL}/products`);
  if (!response.ok) {
    throw new Error(
      `Could not reach Catalog Service at ${CATALOG_URL}. Make sure it's running on port 4002 first.`
    );
  }

  const products = await response.json();

  if (products.length === 0) {
    throw new Error('Catalog Service returned 0 products. Run "npm run seed" in catalog-service first.');
  }

  for (const product of products) {
    await prisma.stock.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        totalStock: 50, // starting stock for every seeded product
      },
    });
    console.log(`Stock initialized: ${product.name} -> 50 units (productId: ${product.id})`);
  }

  console.log(`Seed complete. ${products.length} products now have stock records.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
