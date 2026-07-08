const express = require('express');
const inventoryRoutes = require('./routes/inventory.routes');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'inventory' }));
app.use('/', inventoryRoutes);

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => console.log(`Inventory Service running on port ${PORT}`));
