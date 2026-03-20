const express = require('express');
const { Hospital, Ambulance } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /hospitals
router.get('/', authenticate, async (req, res) => {
  try {
    const hospitals = await Hospital.findAll({
      where: { isActive: true },
      include: [{ model: Ambulance, as: 'ambulances' }],
    });
    res.json({ hospitals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /hospitals
router.post('/', authenticate, authorize('system_admin', 'hospital_admin'), async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json({ hospital });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /hospitals/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const hospital = await Hospital.findByPk(req.params.id, {
      include: [{ model: Ambulance, as: 'ambulances' }],
    });
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json({ hospital });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /hospitals/:id
router.put('/:id', authenticate, authorize('system_admin', 'hospital_admin'), async (req, res) => {
  try {
    const hospital = await Hospital.findByPk(req.params.id);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    await hospital.update(req.body);
    res.json({ hospital });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /hospitals/:id/capacity
router.get('/:id/capacity', authenticate, async (req, res) => {
  try {
    const hospital = await Hospital.findByPk(req.params.id);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json({ availableBeds: hospital.availableBeds, totalBeds: hospital.totalBeds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /hospitals/nearest - find nearest hospital with capacity
router.post('/nearest', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const hospitals = await Hospital.findAll({
      where: { isActive: true },
      include: [{
        model: Ambulance,
        as: 'ambulances',
        where: { status: 'available', isActive: true },
        required: true,
      }],
    });

    if (hospitals.length === 0) {
      return res.status(404).json({ error: 'No hospitals with available ambulances found' });
    }

    const withDistance = hospitals.map(h => ({
      ...h.toJSON(),
      distance: haversine(latitude, longitude, h.latitude, h.longitude),
    }));
    withDistance.sort((a, b) => a.distance - b.distance);
    res.json({ hospital: withDistance[0] });
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
function toRad(deg) { return deg * Math.PI / 180; }

module.exports = router;
