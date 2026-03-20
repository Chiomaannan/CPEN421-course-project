const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vehicleNumber: { type: DataTypes.STRING, allowNull: false },
  vehicleType: {
    type: DataTypes.ENUM('ambulance', 'police_car', 'fire_truck'),
    allowNull: false,
  },
  stationId: { type: DataTypes.UUID },
  stationType: {
    type: DataTypes.ENUM('hospital', 'police_station', 'fire_station'),
  },
  incidentId: { type: DataTypes.UUID },
  driverUserId: { type: DataTypes.UUID },
  latitude: { type: DataTypes.FLOAT, defaultValue: 5.6037 },
  longitude: { type: DataTypes.FLOAT, defaultValue: -0.1870 },
  status: {
    type: DataTypes.ENUM('idle', 'responding', 'on_scene', 'returning', 'maintenance'),
    defaultValue: 'idle',
  },
  lastUpdated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'vehicles', timestamps: true });

module.exports = Vehicle;
