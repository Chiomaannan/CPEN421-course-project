const express = require('express');
const { fn, col, Op } = require('sequelize');
const axios = require('axios');
const IncidentSnapshot = require('../models/IncidentSnapshot');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /analytics/response-times
router.get('/response-times', authenticate, async (req, res) => {
  try {
    const overall = await IncidentSnapshot.findAll({
      attributes: [
        [fn('AVG', col('responseTimeMinutes')), 'avgResponseTime'],
        [fn('MIN', col('responseTimeMinutes')), 'minResponseTime'],
        [fn('MAX', col('responseTimeMinutes')), 'maxResponseTime'],
        [fn('COUNT', col('id')), 'resolvedCount'],
      ],
      where: { responseTimeMinutes: { [Op.not]: null } },
      raw: true,
    });

    const byType = await IncidentSnapshot.findAll({
      attributes: [
        'incidentType',
        [fn('AVG', col('responseTimeMinutes')), 'avgResponseTime'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { responseTimeMinutes: { [Op.not]: null } },
      group: ['incidentType'],
      raw: true,
    });

    res.json({ overall: overall[0], byType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analytics/incidents-by-region
router.get('/incidents-by-region', authenticate, async (req, res) => {
  try {
    const byRegion = await IncidentSnapshot.findAll({
      attributes: [
        'region',
        'incidentType',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['region', 'incidentType'],
      order: [['region', 'ASC']],
      raw: true,
    });

    const byType = await IncidentSnapshot.findAll({
      attributes: [
        'incidentType',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['incidentType'],
      raw: true,
    });

    const byStatus = await IncidentSnapshot.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    res.json({ byRegion, byType, byStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analytics/resource-utilization
router.get('/resource-utilization', authenticate, async (req, res) => {
  try {
    const byUnit = await IncidentSnapshot.findAll({
      attributes: [
        'assignedUnitType',
        [fn('COUNT', col('id')), 'totalDispatches'],
      ],
      where: { assignedUnitType: { [Op.not]: null } },
      group: ['assignedUnitType'],
      raw: true,
    });

    // Fetch live resource data from resource service
    let resourceData = {};
    try {
      const [hospitals, police, fire] = await Promise.all([
        axios.get(`${process.env.RESOURCE_SERVICE_URL}/hospitals`, {
          headers: { Authorization: req.headers.authorization }
        }),
        axios.get(`${process.env.RESOURCE_SERVICE_URL}/police-stations`, {
          headers: { Authorization: req.headers.authorization }
        }),
        axios.get(`${process.env.RESOURCE_SERVICE_URL}/fire-stations`, {
          headers: { Authorization: req.headers.authorization }
        }),
      ]);
      resourceData = {
        hospitals: hospitals.data.hospitals?.length || 0,
        policeStations: police.data.stations?.length || 0,
        fireStations: fire.data.stations?.length || 0,
      };
    } catch (e) {
      console.error('Could not fetch resource data:', e.message);
    }

    res.json({ dispatchesByUnitType: byUnit, resourceCounts: resourceData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analytics/dashboard - aggregate summary
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const total = await IncidentSnapshot.count();
    const resolved = await IncidentSnapshot.count({ where: { status: 'resolved' } });
    const active = await IncidentSnapshot.count({
      where: { status: { [Op.in]: ['created', 'dispatched', 'in_progress'] } }
    });
    const avgResponse = await IncidentSnapshot.findAll({
      attributes: [[fn('AVG', col('responseTimeMinutes')), 'avg']],
      where: { responseTimeMinutes: { [Op.not]: null } },
      raw: true,
    });

    res.json({
      totalIncidents: total,
      resolvedIncidents: resolved,
      activeIncidents: active,
      avgResponseTimeMinutes: parseFloat(avgResponse[0]?.avg || 0).toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
