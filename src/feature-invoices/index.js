const { FEATURE_NAME, hooks } = require('./hooks');

// Route Handlers
const makeInvoiceCreateHandler = require('./route.invoice-create');
const makeInvoiceDeleteHandler = require('./route.invoice-delete');

// Event Handlers
const createUserCreatedHandler = require('./event.user-created');
const createUserUpdatedHandler = require('./event.user-updated');
const createThresholdReachedHandler = require('./event.threshold-reached');
const createThresholdRestoredHandler = require('./event.threshold-restored');

// Task Handlers
const createInvoiceCreateTask = require('./task.invoice-create');
const createInvoiceDeleteTask = require('./task.invoice-delete');

const sqlDrop = `
  DROP TABLE IF EXISTS "public"."invoices_list" CASCADE;
  DROP TABLE IF EXISTS "public"."invoices_cache_users" CASCADE;
`;
const sqlCreate = `
  CREATE TABLE IF NOT EXISTS "public"."invoices_list" (
    "id" serial,
    "user_id" varchar(10),
    "user_name" TEXT,
    "amount" integer,
    "created_at" timestamp DEFAULT now(),
    PRIMARY KEY ("id")
  );
  CREATE TABLE IF NOT EXISTS "public"."invoices_cache_users" (
    "id" varchar(10),
    "name" text,
    "can_invoice" BOOLEAN DEFAULT true,
    "created_at" timestamp DEFAULT NOW(),
    PRIMARY KEY ("id")
  );    
`;

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$FETCHQ_READY',
    handler: async ({ fetchq }) => fetchq.pool.query(sqlCreate),
  });

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$TDD_RESET_DB?',
    handler: async ({ query }) => {
      await query(sqlDrop);
      await query(sqlCreate);
    },
  });

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$START_FEATURE',
    handler: async ({ getContext }) => {
      const query = getContext('query');
      const createJSONConsumer = getContext('kafka.createJSONConsumer');
      const emitJSON = getContext('kafka.emitJSON');
      const publish = getContext('pubsub.publish');
      const consumeTask = getContext('task.consume');

      const apis = {
        query,
        emitJSON,
        publish,
        consumeTask,
      };

      const groupId = `invoices`;
      const topics = ['poc-users', 'poc-invoices', 'poc-thresholds'];
      const handlers = {
        'create@poc-invoices': consumeTask(createInvoiceCreateTask(apis)),
        'delete@poc-invoices': consumeTask(createInvoiceDeleteTask(apis)),
        'created@poc-users': createUserCreatedHandler(apis),
        'updated@poc-users': createUserUpdatedHandler(apis),
        'reached@poc-thresholds': createThresholdReachedHandler(apis),
        'restored@poc-thresholds': createThresholdRestoredHandler(apis),
      };

      await createJSONConsumer({ groupId, topics, handlers });
    },
  });

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$FASTIFY_ROUTE',
    handler: ({ registerRoute }, { getContext, getConfig }) => {
      const query = getContext('query');
      const createTask = getContext('task.createHttp');

      const apis = {
        query,
        createTask,
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
