const { FEATURE_NAME, hooks } = require('./hooks');

// Route Handlers
const makeGetUserTotalHandler = require('./route.get-user-total');

// Event Handlers
const createInvoiceCreatedHandler = require('./event.invoice-created');
const createInvoiceDeletedEvent = require('./event.invoice-deleted');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$FETCHQ_READY',
    handler: async ({ fetchq }) => {
      await fetchq.pool.query(`
          CREATE TABLE IF NOT EXISTS "public"."thresholds" (
            "user_id" varchar(10),
            "total" integer,
            PRIMARY KEY ("user_id")
          );
        `);
    },
  });

  // Create a producer for the feature:
  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$INIT_FEATURE',
    handler: async ({ getContext, setContext }) => {
      const kafka = getContext('kafka');
      const producer = kafka.producer();
      await producer.connect();
      setContext('thresholds.emit', (key, value) =>
        producer.send({
          topic: 'poc-thresholds',
          messages: [
            {
              key,
              value: JSON.stringify(value),
              partition: 0,
            },
          ],
        }),
      );
    },
  });

  // Register to Kafka streams that are relevant to this service
  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$START_FEATURE',
    handler: async ({ getContext }) => {
      const fetchq = getContext('fetchq');
      const kafka = getContext('kafka');
      const emit = getContext('thresholds.emit');

      const apis = {
        query: fetchq.pool.query.bind(fetchq.pool),
        emit,
      };

      const thresholdEvents = {
        created: createInvoiceCreatedHandler(apis),
        deleted: createInvoiceDeletedEvent(apis),
      };

      const consumer = kafka.consumer({ groupId: `thresholds` });
      await consumer.connect();
      await consumer.subscribe({
        topic: 'poc-invoices',
        fromBeginning: true,
      });

      await consumer.run({
        eachMessage: async ({ message }) => {
          const key = message.key.toString();
          const handler = thresholdEvents[key];
          if (handler) {
            await handler(JSON.parse(message.value.toString()));
          } else {
            console.log(`>>> Handler not found for "poc-invoices::${key}"`);
          }
        },
      });
    },
  });

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$FASTIFY_ROUTE',
    handler: ({ registerRoute }, { getContext, getConfig }) => {
      const fetchq = getContext('fetchq');

      const apis = {
        query: fetchq.pool.query.bind(fetchq.pool),
      };
      const params = {};

      registerRoute({
        method: 'GET',
        url: '/api/v1/thresholds/:user_id',
        handler: makeGetUserTotalHandler(apis, params),
      });
    },
  });
};
