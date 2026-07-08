const express = require('express');
const path = require('path');
const paymentRoutes = require('./routes/payment.routes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payment' }));
app.use('/payment', paymentRoutes);

const PORT = process.env.PORT || 4006;
app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`));
