const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/order.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'order' }));
app.use('/orders', orderRoutes);

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
