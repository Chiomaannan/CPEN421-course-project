const axios = require('axios');

const RESOURCE_URL = process.env.RESOURCE_SERVICE_URL || 'http://localhost:3002';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findNearestResponder(incidentType, latitude, longitude) {
  try {
    if (incidentType === 'medical') {
      const res = await axios.post(`${RESOURCE_URL}/ambulances/nearest`, { latitude, longitude });
      return {
        unitId: res.data.ambulance.id,
        unitType: 'ambulance',
        hospitalId: res.data.ambulance.hospitalId,
        distance: res.data.ambulance.distance,
        details: res.data.ambulance,
      };
    } else if (incidentType === 'crime') {
      const res = await axios.post(`${RESOURCE_URL}/police-stations/nearest`, { latitude, longitude });
      return {
        unitId: res.data.station.id,
        unitType: 'police_station',
        distance: res.data.station.distance,
        details: res.data.station,
      };
    } else if (incidentType === 'fire') {
      const res = await axios.post(`${RESOURCE_URL}/fire-stations/nearest`, { latitude, longitude });
      return {
        unitId: res.data.station.id,
        unitType: 'fire_station',
        distance: res.data.station.distance,
        details: res.data.station,
      };
    } else if (incidentType === 'accident') {
      // Accidents may need both ambulance and police
      const res = await axios.post(`${RESOURCE_URL}/ambulances/nearest`, { latitude, longitude });
      return {
        unitId: res.data.ambulance.id,
        unitType: 'ambulance',
        hospitalId: res.data.ambulance.hospitalId,
        distance: res.data.ambulance.distance,
        details: res.data.ambulance,
      };
    } else {
      // Default to police for 'other'
      const res = await axios.post(`${RESOURCE_URL}/police-stations/nearest`, { latitude, longitude });
      return {
        unitId: res.data.station.id,
        unitType: 'police_station',
        distance: res.data.station.distance,
        details: res.data.station,
      };
    }
  } catch (err) {
    console.error('Error finding nearest responder:', err.message);
    return null;
  }
}

module.exports = { findNearestResponder };
