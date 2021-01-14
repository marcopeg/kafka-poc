const { FEATURE_NAME, hooks } = require('./hooks');

// Route Handlers
const makeGetUserTotalHandler = require('./route.get-user-total');

// Event Handlers
const createInvoiceCreatedHandler = require('./event.invoice-created');
const createInvoiceDeletedEvent = require('./event.invoice-deleted');

const sqlDrop = `
  DROP TABLE IF EXISTS "public"."thresholds" CASCADE;
`;
const sqlCreate = `
  CREATE TABLE IF NOT EXISTS "public"."thresholds" (
    "user_id" varchar(10),
    "total" integer,
    PRIMARY KEY ("user_id")
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

  // Register to Kafka streams that are relevant to this service
  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$START_FEATURE',
    handler: async ({ getContext }) => {
      const fetchq = getContext('fetchq');
      const createJSONConsumer = getContext('kafka.createJSONConsumer');
      const emitJSON = getContext('kafka.emitJSON');

      const apis = {
        query: fetchq.pool.query.bind(fetchq.pool),
        emitJSON,
      };

      const groupId = `thresholds`;
      const topics = ['poc-invoices'];
      const handlers = {
        'created@poc-invoices': createInvoiceCreatedHandler(apis),
        'deleted@poc-invoices': createInvoiceDeletedEvent(apis),
      };

      await createJSONConsumer({ groupId, topics, handlers });
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
