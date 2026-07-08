const express = require('express');
const cors = require('cors');
const cartRoutes = require('./routes/cart.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'cart' }));
app.use('/cart', cartRoutes);

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => console.log(`Cart Service running on port ${PORT}`));
