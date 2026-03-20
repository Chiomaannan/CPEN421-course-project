const express = require('express');
const Vehicle = require('../models/Vehicle');
const LocationHistory = require('../models/LocationHistory');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

let io = null;
const setIO = (socketIO) => { io = socketIO; };

// POST /vehicles/register
router.post('/register', authenticate, authorize('system_admin', 'hospital_admin', 'police_admin', 'fire_admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ vehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vehicles
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.incidentId) where.incidentId = req.query.incidentId;
    const vehicles = await Vehicle.findAll({ where });
    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vehicles/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vehicles/:id/location
router.get('/:id/location', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({
      vehicleId: vehicle.id,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      status: vehicle.status,
      lastUpdated: vehicle.lastUpdated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vehicles/:id/location/history
router.get('/:id/location/history', authenticate, async (req, res) => {
  try {
    const history = await LocationHistory.findAll({
      where: { vehicleId: req.params.id },
      order: [['recordedAt', 'DESC']],
      limit: 100,
    });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /vehicles/:id/location - update vehicle location (called by driver's device)
router.put('/:id/location', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    const { latitude, longitude } = req.body;
    await vehicle.update({ latitude, longitude, lastUpdated: new Date() });

    // Save location history
    await LocationHistory.create({
      vehicleId: vehicle.id,
      incidentId: vehicle.incidentId,
      latitude,
      longitude,
      recordedAt: new Date(),
    });

    // Broadcast via WebSocket
    if (io) {
      io.emit('location_update', {
        vehicleId: vehicle.id,
        latitude,
        longitude,
        status: vehicle.status,
        incidentId: vehicle.incidentId,
        timestamp: new Date(),
      });
    }

    res.json({ message: 'Location updated', vehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /vehicles/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    await vehicle.update({ status: req.body.status });
    if (io) {
      io.emit('vehicle_status_update', { vehicleId: vehicle.id, status: req.body.status });
    }
    res.json({ vehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, setIO };
