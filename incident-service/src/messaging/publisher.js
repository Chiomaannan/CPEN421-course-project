const amqplib = require('amqplib');

let channel = null;

const QUEUES = {
  INCIDENT_CREATED: 'incident.created',
  INCIDENT_DISPATCHED: 'incident.dispatched',
  INCIDENT_RESOLVED: 'incident.resolved',
};

async function connect() {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await conn.createChannel();
    for (const queue of Object.values(QUEUES)) {
      await channel.assertQueue(queue, { durable: true });
    }
    console.log('Incident service connected to RabbitMQ');
  } catch (err) {
    console.error('RabbitMQ connection failed, retrying in 5s...', err.message);
    setTimeout(connect, 5000);
  }
}

async function publish(queue, data) {
  if (!channel) return;
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), { persistent: true });
}

module.exports = { connect, publish, QUEUES };
