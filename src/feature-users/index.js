const { FEATURE_NAME, hooks } = require('./hooks');

// Route Handlers
const makeUsersListHandler = require('./route.users-list');
const makeUserCreateHandler = require('./route.user-create');
const makeUserUpdateHandler = require('./route.user-update');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$FETCHQ_READY',
    handler: async ({ fetchq }) => {
      await fetchq.pool.query(`
        CREATE TABLE IF NOT EXISTS "public"."users_list" (
          "id" varchar(10),
          "name" text,
          "created_at" timestamp DEFAULT NOW(),
          PRIMARY KEY ("id")
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
      setContext('users.emit', (key, value) =>
        producer.send({
          topic: 'poc-users',
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

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$FASTIFY_ROUTE',
    handler: ({ registerRoute }, { getContext, getConfig }) => {
      const fetchq = getContext('fetchq');
      const emit = getContext('users.emit');

      const apis = {
        query: fetchq.pool.query.bind(fetchq.pool),
        emit,
      };
      const params = {};

      registerRoute({
        method: 'GET',
        url: '/api/v1/users',
        handler: makeUsersListHandler(apis, params),
      });

      registerRoute({
        method: 'POST',
        url: '/api/v1/users',
        handler: makeUserCreateHandler(apis, params),
      });

      registerRoute({
        method: 'PUT',
        url: '/api/v1/users/:id',
        handler: makeUserUpdateHandler(apis, params),
      });
    },
  });
};
