require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/database');
const analyticsRoutes = require('./routes/analytics');
const { connect: connectConsumer } = require('./messaging/consumer');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use('/analytics', analyticsRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'analytics-service' }));

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Analytics DB connected');
    await sequelize.sync({ alter: true });
    console.log('Analytics DB synced');
    await connectConsumer();
    app.listen(PORT, () => console.log(`Analytics Service running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start analytics service:', err);
    process.exit(1);
  }
};

startServer();
