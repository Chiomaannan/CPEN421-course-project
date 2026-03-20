const express = require('express');
const { PoliceStation } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const stations = await PoliceStation.findAll({ where: { isActive: true } });
    res.json({ stations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, authorize('system_admin', 'police_admin'), async (req, res) => {
  try {
    const station = await PoliceStation.create(req.body);
    res.status(201).json({ station });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const station = await PoliceStation.findByPk(req.params.id);
    if (!station) return res.status(404).json({ error: 'Station not found' });
    res.json({ station });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, authorize('system_admin', 'police_admin'), async (req, res) => {
  try {
    const station = await PoliceStation.findByPk(req.params.id);
    if (!station) return res.status(404).json({ error: 'Station not found' });
    await station.update(req.body);
    res.json({ station });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /police-stations/nearest
router.post('/nearest', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const stations = await PoliceStation.findAll({
      where: { isActive: true },
    });
    const available = stations.filter(s => s.availableUnits > 0);
    if (available.length === 0) return res.status(404).json({ error: 'No available police stations' });
    const withDist = available.map(s => ({
      ...s.toJSON(),
      distance: haversine(latitude, longitude, s.latitude, s.longitude),
    }));
    withDist.sort((a, b) => a.distance - b.distance);
    res.json({ station: withDist[0] });
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
