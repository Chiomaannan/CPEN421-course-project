const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Incident = sequelize.define('Incident', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  citizenName: { type: DataTypes.STRING, allowNull: false },
  citizenPhone: { type: DataTypes.STRING },
  incidentType: {
    type: DataTypes.ENUM('medical', 'fire', 'crime', 'accident', 'other'),
    allowNull: false,
  },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  address: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  createdBy: { type: DataTypes.UUID, allowNull: false },
  assignedUnitId: { type: DataTypes.UUID },
  assignedUnitType: {
    type: DataTypes.ENUM('ambulance', 'police_station', 'fire_station'),
    allowNull: true,
  },
  assignedHospitalId: { type: DataTypes.UUID },
  status: {
    type: DataTypes.ENUM('created', 'dispatched', 'in_progress', 'resolved'),
    defaultValue: 'created',
  },
  dispatchedAt: { type: DataTypes.DATE },
  resolvedAt: { type: DataTypes.DATE },
  responseTimeMinutes: { type: DataTypes.FLOAT },
}, { tableName: 'incidents', timestamps: true });

module.exports = Incident;
