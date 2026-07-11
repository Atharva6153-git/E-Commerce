const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: { name: 'Electronics', slug: 'electronics' },
    }),
    prisma.category.upsert({
      where: { slug: 'fashion' },
      update: {},
      create: { name: 'Fashion', slug: 'fashion' },
    }),
    prisma.category.upsert({
      where: { slug: 'home-kitchen' },
      update: {},
      create: { name: 'Home & Kitchen', slug: 'home-kitchen' },
    }),
  ]);

  const [electronics, fashion, home] = categories;

  await prisma.product.createMany({
    data: [
      {
        name: 'Wireless Earbuds',
        description: 'Bluetooth 5.0 earbuds with noise cancellation',
        price: 1999.0,
        imageUrl: '/products/wireless-earbuds.jpg',
        categoryId: electronics.id,
      },
      {
        name: 'Smartwatch',
        description: 'Fitness tracking smartwatch with heart rate monitor',
        price: 3499.0,
        imageUrl: '/products/smartwatch.jpg',
        categoryId: electronics.id,
      },
      {
        name: 'Cotton T-Shirt',
        description: 'Plain cotton round-neck t-shirt',
        price: 499.0,
        imageUrl: '/products/cotton-tshirt.jpg',
        categoryId: fashion.id,
      },
      {
        name: 'Denim Jacket',
        description: 'Classic blue denim jacket',
        price: 1799.0,
        imageUrl: '/products/denim-jacket.jpg',
        categoryId: fashion.id,
      },
      {
        name: 'Non-Stick Pan',
        description: '24cm non-stick frying pan',
        price: 899.0,
        imageUrl: '/products/non-stick-pan.jpg',
        categoryId: home.id,
      },
    ],
  });

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
