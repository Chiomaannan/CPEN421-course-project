const express = require('express');
const { Ambulance, Hospital } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /ambulances
router.get('/', authenticate, async (req, res) => {
  try {
    const where = { isActive: true };
    if (req.query.status) where.status = req.query.status;
    const ambulances = await Ambulance.findAll({ where, include: [{ model: Hospital, as: 'hospital' }] });
    res.json({ ambulances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ambulances
router.post('/', authenticate, authorize('system_admin', 'hospital_admin'), async (req, res) => {
  try {
    const ambulance = await Ambulance.create(req.body);
    res.status(201).json({ ambulance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ambulances/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ambulance = await Ambulance.findByPk(req.params.id, {
      include: [{ model: Hospital, as: 'hospital' }],
    });
    if (!ambulance) return res.status(404).json({ error: 'Ambulance not found' });
    res.json({ ambulance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /ambulances/:id
router.put('/:id', authenticate, authorize('system_admin', 'hospital_admin', 'ambulance_driver'), async (req, res) => {
  try {
    const ambulance = await Ambulance.findByPk(req.params.id);
    if (!ambulance) return res.status(404).json({ error: 'Ambulance not found' });
    await ambulance.update(req.body);
    res.json({ ambulance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ambulances/nearest - find nearest available ambulance
router.post('/nearest', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const ambulances = await Ambulance.findAll({
      where: { status: 'available', isActive: true },
      include: [{ model: Hospital, as: 'hospital' }],
    });
    if (ambulances.length === 0) {
      return res.status(404).json({ error: 'No available ambulances' });
    }
    const withDist = ambulances.map(a => ({
      ...a.toJSON(),
      distance: haversine(latitude, longitude, a.latitude, a.longitude),
    }));
    withDist.sort((a, b) => a.distance - b.distance);
    res.json({ ambulance: withDist[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;
