require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/database');
const incidentRoutes = require('./routes/incidents');
const { connect: connectMQ } = require('./messaging/publisher');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use('/incidents', incidentRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'incident-service' }));

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Incident DB connected');
    await sequelize.sync({ alter: true });
    console.log('Incident DB synced');
    await connectMQ();
    app.listen(PORT, () => console.log(`Incident Service running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start incident service:', err);
    process.exit(1);
  }
};

startServer();
