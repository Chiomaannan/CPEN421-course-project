const amqplib = require('amqplib');
const Vehicle = require('../models/Vehicle');

const QUEUES = {
  INCIDENT_DISPATCHED: 'incident.dispatched',
};

async function connect(io) {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await conn.createChannel();
    await channel.assertQueue(QUEUES.INCIDENT_DISPATCHED, { durable: true });

    channel.consume(QUEUES.INCIDENT_DISPATCHED, async (msg) => {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      console.log('Incident dispatched event received:', data);

      // Update vehicle status
      if (data.assignedUnitType === 'ambulance') {
        await Vehicle.update(
          { incidentId: data.incidentId, status: 'responding' },
          { where: { id: data.assignedUnitId } }
        );
        io.emit('vehicle_dispatched', {
          vehicleId: data.assignedUnitId,
          incidentId: data.incidentId,
          status: 'responding',
        });
      }
      channel.ack(msg);
    });

    console.log('Dispatch consumer connected to RabbitMQ');
  } catch (err) {
    console.error('RabbitMQ consumer failed, retrying in 5s...', err.message);
    setTimeout(() => connect(io), 5000);
  }
}

module.exports = { connect };
