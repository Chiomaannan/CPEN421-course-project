const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationHistory = sequelize.define('LocationHistory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vehicleId: { type: DataTypes.UUID, allowNull: false },
  incidentId: { type: DataTypes.UUID },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  recordedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'location_history', timestamps: false });

module.exports = LocationHistory;
