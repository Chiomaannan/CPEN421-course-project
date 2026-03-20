const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Hospital = sequelize.define('Hospital', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  totalBeds: { type: DataTypes.INTEGER, defaultValue: 0 },
  availableBeds: { type: DataTypes.INTEGER, defaultValue: 0 },
  phone: { type: DataTypes.STRING },
  adminUserId: { type: DataTypes.UUID },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'hospitals', timestamps: true });

const Ambulance = sequelize.define('Ambulance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vehicleNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  hospitalId: { type: DataTypes.UUID, allowNull: false },
  driverUserId: { type: DataTypes.UUID },
  latitude: { type: DataTypes.FLOAT, defaultValue: 5.6037 },
  longitude: { type: DataTypes.FLOAT, defaultValue: -0.1870 },
  status: {
    type: DataTypes.ENUM('available', 'dispatched', 'maintenance'),
    defaultValue: 'available',
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'ambulances', timestamps: true });

const PoliceStation = sequelize.define('PoliceStation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  phone: { type: DataTypes.STRING },
  adminUserId: { type: DataTypes.UUID },
  officerCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  availableUnits: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'police_stations', timestamps: true });

const FireStation = sequelize.define('FireStation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  phone: { type: DataTypes.STRING },
  adminUserId: { type: DataTypes.UUID },
  availableTrucks: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'fire_stations', timestamps: true });

Hospital.hasMany(Ambulance, { foreignKey: 'hospitalId', as: 'ambulances' });
Ambulance.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

module.exports = { Hospital, Ambulance, PoliceStation, FireStation, sequelize };
