const { Kafka } = require('kafkajs');
const { SERVICE_NAME, hooks } = require('./hooks');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: SERVICE_NAME,
    trace: __filename,
    hook: '$INIT_SERVICE',
    handler: ({ getConfig, setContext }) => {
      const clientId = getConfig('kafka.clientId');
      const brokers = getConfig('kafka.brokers');
      const client = new Kafka({ clientId, brokers });

      const consumers = [];
      const producers = [];

      setContext('kafka', {
        createConsumer: async (parameters) => {
          const consumer = client.consumer(parameters);
          await consumer.connect();
          consumers.push(consumer);
          return consumer;
        },
        createProducer: async (parameters) => {
          const producer = client.producer(parameters);
          await producer.connect();
          producers.push(producer);
          return producer;
        },
      });

      const errorTypes = ['unhandledRejection', 'uncaughtException'];
      const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

      errorTypes.map((type) => {
        process.on(type, async () => {
          try {
            console.log('[kafka] disconnecting all clients....');
            console.log(`(process.on ${type})`);
            for (let consumer of consumers) {
              await consumer.disconnect();
            }
            for (let producer of producers) {
              await producer.disconnect();
            }
            console.log('[kafka] goodbye :-)');
            process.exit(0);
          } catch (_) {
            process.exit(1);
          }
        });
      });

      signalTraps.map((type) => {
        process.once(type, async () => {
          console.log('[kafka] disconnecting all clients....');
          try {
            for (let consumer of consumers) {
              await consumer.disconnect();
            }
            for (let producer of producers) {
              await producer.disconnect();
            }
            console.log('[kafka] goodbye :-)');
          } catch (err) {
            console.log('NOOOOOO');
          } finally {
            process.kill(process.pid, type);
          }
        });
      });
    },
  });
};
