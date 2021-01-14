const { FEATURE_NAME, hooks } = require('./hooks');

// Event Handlers
const createInvoiceCreatedHandler = require('./event.invoice-created');
const createInvoiceDeletedEvent = require('./event.invoice-deleted');

const sqlDrop = `
  DROP TABLE IF EXISTS "public"."totals" CASCADE;
`;
const sqlCreate = `
  CREATE TABLE IF NOT EXISTS "public"."totals" (
    "user_id" varchar(10),
    "year" smallint,
    "month" smallint,
    "total" integer DEFAULT 0,
    PRIMARY KEY ("user_id", "year", "month")
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
      const query = getContext('query');
      const emitJSON = getContext('kafka.emitJSON');
      const createJSONConsumer = getContext('kafka.createJSONConsumer');

      const apis = {
        query,
        emitJSON,
      };

      const groupId = `totals`;
      const topics = ['poc-invoices'];
      const handlers = {
        'created@poc-invoices': createInvoiceCreatedHandler(apis),
        'deleted@poc-invoices': createInvoiceDeletedEvent(apis),
      };

      const consumer = await createJSONConsumer({ groupId, topics, handlers });

      // Force reflow of events from the beginning:
      // await query(`TRUNCATE "totals";`);
      // consumer.seek({ topic: topics[0], partition: 0, offset: 0 });
    },
  });
};
