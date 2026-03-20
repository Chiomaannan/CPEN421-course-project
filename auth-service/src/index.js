require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use('/auth', authRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Auth DB connected');
    await sequelize.sync({ alter: true });
    console.log('Auth DB synced');
    app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start auth service:', err);
    process.exit(1);
  }
};

startServer();
