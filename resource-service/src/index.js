require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use('/hospitals', require('./routes/hospitals'));
app.use('/ambulances', require('./routes/ambulances'));
app.use('/police-stations', require('./routes/police'));
app.use('/fire-stations', require('./routes/fire'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'resource-service' }));

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Resource DB connected');
    await sequelize.sync({ alter: true });
    console.log('Resource DB synced');
    app.listen(PORT, () => console.log(`Resource Service running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start resource service:', err);
    process.exit(1);
  }
};

startServer();
