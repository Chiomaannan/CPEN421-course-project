const amqplib = require('amqplib');
const IncidentSnapshot = require('../models/IncidentSnapshot');

const QUEUES = {
  INCIDENT_CREATED: 'incident.created',
  INCIDENT_DISPATCHED: 'incident.dispatched',
  INCIDENT_RESOLVED: 'incident.resolved',
};

function getRegion(lat, lon) {
  // Simplified region detection for Ghana
  if (lat > 6.5) return 'Northern';
  if (lat > 5.8) return 'Ashanti';
  if (lat > 5.4) return 'Greater Accra';
  return 'Southern';
}

async function connect() {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await conn.createChannel();

    for (const queue of Object.values(QUEUES)) {
      await channel.assertQueue(queue, { durable: true });
    }

    // Listen to incident.created
    channel.consume(QUEUES.INCIDENT_CREATED, async (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      await IncidentSnapshot.upsert({
        incidentId: data.incidentId,
        incidentType: data.incidentType,
        latitude: data.latitude,
        longitude: data.longitude,
        status: 'created',
        region: getRegion(data.latitude, data.longitude),
        createdAt_: data.createdAt,
      });
      channel.ack(msg);
    });

    // Listen to incident.dispatched
    channel.consume(QUEUES.INCIDENT_DISPATCHED, async (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      await IncidentSnapshot.update(
        { status: 'dispatched', assignedUnitType: data.assignedUnitType },
        { where: { incidentId: data.incidentId } }
      );
      channel.ack(msg);
    });

    // Listen to incident.resolved
    channel.consume(QUEUES.INCIDENT_RESOLVED, async (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      await IncidentSnapshot.update(
        { status: 'resolved', resolvedAt: data.resolvedAt, responseTimeMinutes: data.responseTimeMinutes },
        { where: { incidentId: data.incidentId } }
      );
      channel.ack(msg);
    });

    console.log('Analytics consumer connected to RabbitMQ');
  } catch (err) {
    console.error('Analytics RabbitMQ failed, retrying in 5s...', err.message);
    setTimeout(connect, 5000);
  }
}

module.exports = { connect };
