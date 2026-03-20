const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Local snapshot of incident data for analytics
const IncidentSnapshot = sequelize.define('IncidentSnapshot', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  incidentId: { type: DataTypes.UUID, allowNull: false, unique: true },
  incidentType: { type: DataTypes.STRING },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  status: { type: DataTypes.STRING },
  assignedUnitType: { type: DataTypes.STRING },
  responseTimeMinutes: { type: DataTypes.FLOAT },
  createdAt_: { type: DataTypes.DATE, field: 'incident_created_at' },
  resolvedAt: { type: DataTypes.DATE },
  region: { type: DataTypes.STRING },
}, { tableName: 'incident_snapshots', timestamps: true });

module.exports = IncidentSnapshot;
