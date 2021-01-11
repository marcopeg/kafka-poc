const { Kafka } = require('kafkajs');
const { SERVICE_NAME, hooks } = require('./hooks');

const isFunction = (obj) => !!(obj && obj.constructor && obj.call && obj.apply);

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: SERVICE_NAME,
    trace: __filename,
    hook: '$INIT_SERVICE',
    handler: ({ getConfig, setContext }) => {
      const clientId = getConfig('kafka.clientId');
      const brokers = getConfig('kafka.brokers');
      const isRestoring = getConfig('kafka.isRestoring');
      const client = new Kafka({ clientId, brokers });

      const consumers = [];
      const producers = [];

      const createConsumer = async (parameters) => {
        const consumer = client.consumer(parameters);
        await consumer.connect();
        consumers.push(consumer);
        return consumer;
      };

      const createProducer = async (parameters) => {
        const producer = client.producer(parameters);
        await producer.connect();
        producers.push(producer);
        return producer;
      };

      // event: 'key@topic'
      // payload: { json: 'value' }
      const emitJSON = async (event, payload) => {
        // Skip side effects while restoring:
        // !!! THIS IS LIKELY THE WORST WAY TO DO IT !!!
        if (isRestoring) {
          return;
        }

        // Upsert and momoize the producer:
        if (!emitJSON.producer) {
          emitJSON.producer = await createProducer();
        }

        // Append the message:
        const [key, topic] = event.split('@');
        emitJSON.producer.send({
          topic,
          messages: [
            {
              key,
              value: JSON.stringify(payload),
              partition: 0,
            },
          ],
        });
      };

      // topics: [{ topic: /.*/i, fromBeginning: true }]
      // handlers: { 'event@key': handler(messagesAsJSON)}
      const createJSONConsumer = async ({ groupId, topics, handlers }) => {
        const consumer = await createConsumer({
          groupId: `${groupId}@${clientId}`,
        });

        // Subscribe to all topics:
        const topicsList =
          typeof topics === 'string' ? topics.split(',') : topics;

        await Promise.all(
          topicsList.map((item) => {
            if (typeof item === 'string') {
              return consumer.subscribe({
                topic: item,
                fromBeginning: true,
              });
            } else {
              return consumer.subscribe(item);
            }
          }),
        );

        // Run the handler that maps to specific event handlers
        await consumer.run({
          eachMessage: ({ topic, partition, message }) => {
            const key = message.key ? message.key.toString() : '';
            const event = `${key}@${topic}`;
            const payload = message.value
              ? JSON.parse(message.value.toString())
              : {};

            // Single handler for all the events:
            if (isFunction(handlers)) {
              handlers(payload, {
                topic,
                key,
                event,
                partition,
              });

              // Map of handlers for a specific event:
            } else {
              const handler = handlers[event];
              if (handler) {
                handler(payload, {
                  topic,
                  key,
                  event,
                  partition,
                });
              } else {
                console.log(`[kafka] handler not found for: ${event}`);
              }
            }
          },
        });
      };

      setContext('kafka', {
        createConsumer,
        createProducer,
        emitJSON,
        createJSONConsumer,
      });

      const errorTypes = ['unhandledRejection', 'uncaughtException'];
      const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

      errorTypes.map((type) => {
        process.on(type, async (err) => {
          try {
            console.log(`[kafka on ${type}] ${err.message}`);
            console.log('[kafka] disconnecting all clients....');
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
