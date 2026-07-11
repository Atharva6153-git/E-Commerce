const express = require('express');
const cors = require('cors');
const inventoryRoutes = require('./routes/inventory.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'inventory' }));
app.use('/', inventoryRoutes);

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => console.log(`Inventory Service running on port ${PORT}`));
