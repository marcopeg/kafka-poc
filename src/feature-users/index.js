const { FEATURE_NAME, hooks } = require('./hooks');

// Route Handlers
const makeUsersListHandler = require('./route.users-list');
const makeUserCreateHandler = require('./route.user-create');
const makeUserUpdateHandler = require('./route.user-update');

const sqlDrop = `
  DROP TABLE IF EXISTS "public"."users_list" CASCADE
`;
const sqlCreate = `
  CREATE TABLE IF NOT EXISTS "public"."users_list" (
    "id" varchar(10),
    "name" text,
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
