const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'catalog' }));
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`Catalog Service running on port ${PORT}`));
