require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const sequelize = require('./config/database');
const { router: vehicleRoutes, setIO } = require('./routes/vehicles');
const { connect: connectConsumer } = require('./messaging/consumer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use('/vehicles', vehicleRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'dispatch-service' }));

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}, user: ${socket.user?.email}`);

  socket.on('subscribe_incident', (incidentId) => {
    socket.join(`incident_${incidentId}`);
    console.log(`${socket.user?.email} subscribed to incident ${incidentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

setIO(io);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Dispatch DB connected');
    await sequelize.sync({ alter: true });
    console.log('Dispatch DB synced');
    await connectConsumer(io);
    server.listen(PORT, () => console.log(`Dispatch Service running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start dispatch service:', err);
    process.exit(1);
  }
};

startServer();
