const express = require('express');
const { Op } = require('sequelize');
const Incident = require('../models/Incident');
const { authenticate, authorize } = require('../middleware/auth');
const { findNearestResponder } = require('../services/dispatchService');
const { publish, QUEUES } = require('../messaging/publisher');

const router = express.Router();

// POST /incidents
router.post('/', authenticate, authorize('system_admin'), async (req, res) => {
  try {
    const { citizenName, citizenPhone, incidentType, latitude, longitude, address, notes } = req.body;
    if (!citizenName || !incidentType || !latitude || !longitude) {
      return res.status(400).json({ error: 'citizenName, incidentType, latitude, longitude are required' });
    }

    const incident = await Incident.create({
      citizenName,
      citizenPhone,
      incidentType,
      latitude,
      longitude,
      address,
      notes,
      createdBy: req.user.id,
      status: 'created',
    });

    // Auto-assign nearest responder
    const responder = await findNearestResponder(incidentType, latitude, longitude);
    if (responder) {
      await incident.update({
        assignedUnitId: responder.unitId,
        assignedUnitType: responder.unitType,
        assignedHospitalId: responder.hospitalId || null,
        status: 'dispatched',
        dispatchedAt: new Date(),
      });

      await publish(QUEUES.INCIDENT_DISPATCHED, {
        incidentId: incident.id,
        incidentType,
        latitude,
        longitude,
        assignedUnitId: responder.unitId,
        assignedUnitType: responder.unitType,
        assignedHospitalId: responder.hospitalId,
        dispatchedAt: new Date(),
      });
    }

    await publish(QUEUES.INCIDENT_CREATED, {
      incidentId: incident.id,
      incidentType,
      latitude,
      longitude,
      createdBy: req.user.id,
      createdAt: incident.createdAt,
    });

    res.status(201).json({ incident: await Incident.findByPk(incident.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /incidents/open
router.get('/open', authenticate, async (req, res) => {
  try {
    const incidents = await Incident.findAll({
      where: { status: { [Op.in]: ['created', 'dispatched', 'in_progress'] } },
      order: [['createdAt', 'DESC']],
    });
    res.json({ incidents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /incidents
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.incidentType) where.incidentType = req.query.incidentType;
    const incidents = await Incident.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ incidents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /incidents/analytics/summary (for analytics service)
router.get('/analytics/summary', async (req, res) => {
  try {
    const { Op, fn, col, literal } = require('sequelize');
    const sequelize = require('../config/database');
    const total = await Incident.count();
    const byStatus = await Incident.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const byType = await Incident.findAll({
      attributes: ['incidentType', [fn('COUNT', col('id')), 'count']],
      group: ['incidentType'],
      raw: true,
    });
    const avgResponse = await Incident.findAll({
      attributes: [[fn('AVG', col('responseTimeMinutes')), 'avgResponseTime']],
      where: { responseTimeMinutes: { [Op.not]: null } },
      raw: true,
    });
    res.json({ total, byStatus, byType, avgResponseTimeMinutes: avgResponse[0]?.avgResponseTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /incidents/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /incidents/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    const { status } = req.body;
    const updates = { status };
    if (status === 'resolved') {
      updates.resolvedAt = new Date();
      if (incident.dispatchedAt) {
        updates.responseTimeMinutes = (new Date() - new Date(incident.dispatchedAt)) / 60000;
      }
      await publish(QUEUES.INCIDENT_RESOLVED, {
        incidentId: incident.id,
        resolvedAt: updates.resolvedAt,
        responseTimeMinutes: updates.responseTimeMinutes,
      });
    }
    await incident.update(updates);
    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /incidents/:id/assign
router.put('/:id/assign', authenticate, authorize('system_admin'), async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    const { assignedUnitId, assignedUnitType, assignedHospitalId } = req.body;
    await incident.update({
      assignedUnitId,
      assignedUnitType,
      assignedHospitalId,
      status: 'dispatched',
      dispatchedAt: new Date(),
    });
    await publish(QUEUES.INCIDENT_DISPATCHED, {
      incidentId: incident.id,
      assignedUnitId,
      assignedUnitType,
      assignedHospitalId,
      dispatchedAt: new Date(),
    });
    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
