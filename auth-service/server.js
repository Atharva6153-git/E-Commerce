require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check -- useful for confirming the service is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Auth Service running on http://localhost:${PORT}`);
});
