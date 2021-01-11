const { FEATURE_NAME, hooks } = require('./hooks');

// Route Handlers
const makeInvoiceCreateHandler = require('./route.invoice-create');
const makeInvoiceDeleteHandler = require('./route.invoice-delete');

// Event Handlers
const createUserCreatedHandler = require('./event.user-created');
const createUserUpdatedHandler = require('./event.user-updated');
const createThresholdReachedHandler = require('./event.threshold-reached');
const createThresholdRestoredHandler = require('./event.threshold-restored');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$FETCHQ_READY',
    handler: async ({ fetchq }) => {
      await fetchq.pool.query(`
        CREATE TABLE IF NOT EXISTS "public"."invoices_list" (
          "id" serial,
          "user_id" varchar(10),
          "user_name" TEXT,
          "amount" integer,
          "created_at" timestamp DEFAULT now(),
          PRIMARY KEY ("id")
        );    
      `);

      await fetchq.pool.query(`
        CREATE TABLE IF NOT EXISTS "public"."invoices_cache_users" (
          "id" varchar(10),
          "name" text,
          "can_invoice" BOOLEAN DEFAULT true,
          "created_at" timestamp DEFAULT NOW(),
          PRIMARY KEY ("id")
        );    
      `);
    },
  });

  // Register to Kafka streams that are relevant to this service
  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$START_FEATURE',
    handler: async ({ getContext }) => {
      const fetchq = getContext('fetchq');
      const createConsumer = getContext('kafka.createConsumer');

      const apis = {
        query: fetchq.pool.query.bind(fetchq.pool),
      };

      const userEvents = {
        'poc-users@created': createUserCreatedHandler(apis),
        'poc-users@updated': createUserUpdatedHandler(apis),
        'poc-thresholds@reached': createThresholdReachedHandler(apis),
        'poc-thresholds@restored': createThresholdRestoredHandler(apis),
      };

      const consumer = await createConsumer({ groupId: `invoices` });
      await consumer.subscribe({
        topic: 'poc-users',
        fromBeginning: true,
      });
      await consumer.subscribe({
        topic: 'poc-thresholds',
        fromBeginning: true,
      });

      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          const key = `${topic}@${message.key.toString()}`;
          const handler = userEvents[key];
          if (handler) {
            await handler(JSON.parse(message.value.toString()));
          } else {
            console.log(`>>> Handler not found for "${key}"`);
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
      const emitJSON = getContext('kafka.emitJSON');

      const apis = {
        query: fetchq.pool.query.bind(fetchq.pool),
        emitJSON,
      };
      const params = {};

      registerRoute({
        method: 'POST',
        url: '/api/v1/invoices',
        handler: makeInvoiceCreateHandler(apis, params),
      });

      registerRoute({
        method: 'DELETE',
        url: '/api/v1/invoices/:invoiceId',
        handler: makeInvoiceDeleteHandler(apis, params),
      });
    },
  });
};
