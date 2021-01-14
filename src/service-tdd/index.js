const { SERVICE_NAME, ...hooks } = require('./hooks');

// Force to use the TDD service if the code is running into
// CodeSandbox or if in a development environment.
const useServiceTDD =
  ['development', 'test'].includes(process.env.NODE_ENV) ||
  Boolean(process.env.SANDBOX_URL);

const serviceTDD = ({ registerAction, createHook, registerHook }) => {
  registerHook(hooks);

  // Reset the test healthcheck flag on system stop:
  registerAction({
    hook: '$INIT_SERVICE',
    name: SERVICE_NAME,
    trace: __filename,
    handler: ({ setContext }) => {
      const errorTypes = ['unhandledRejection', 'uncaughtException'];
      const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

      errorTypes.map((type) => {
        process.on(type, async (err) => {
          setContext('tdd.ready', false);
        });
      });

      signalTraps.map((type) => {
        process.once(type, async () => {
          setContext('tdd.ready', false);
        });
      });
    },
  });

  // Exposes a hook that let register routes scoped under `/test`
  registerAction({
    hook: '$FASTIFY_ROUTE?',
    name: SERVICE_NAME,
    trace: __filename,
    handler: (ctx) => {
      const registerRoute = (config) => {
        ctx.registerRoute({
          ...config,
          url: `/test${config.url}`,
        });
      };

      // Let other features to integrate test routes:
      createHook.sync(hooks.TDD_FASTIFY_ROUTE, { registerRoute });
    },
  });

  // Exposes a hook that is intended to mocking stuff like with NOK
  registerAction({
    hook: '$FINISH',
    name: SERVICE_NAME,
    trace: __filename,
    handler: (ctx) => {
      createHook.sync(hooks.TDD_HTTP_MOCKS, ctx);
      ctx.setContext('tdd.ready', true);
    },
  });

  // Register all the `/test` prefixed routes
  registerAction({
    hook: '$TDD_FASTIFY_ROUTE?',
    name: SERVICE_NAME,
    trace: __filename,
    handler: ({ registerRoute }, { getContext, setContext, setConfig }) => {
      const fetchq = getContext('fetchq');
      const query = fetchq.pool.query.bind(fetchq.pool);

      // Provide a health-check route to the TDD environment:
      // NOTE: it checks a context variable that is set only after
      //       the complete initialization of the system, and that is
      //       set to "false" when detecting the KILL signal.
      //       This will let time for all the stuff that needs to
      //       unregister to be done.
      registerRoute({
        method: 'GET',
        url: '/status',
        handler: (request, reply) => {
          try {
            const isReady = getContext('tdd.ready');
            if (!isReady) throw new Error('not ready');
            reply.send({ message: '+ok' });
          } catch (err) {
            reply.code(500).send(err.message);
          }
        },
      });

      // Expose a query interface to interact with the database
      // POST://test/query
      // BODY: { query: 'SELECT NOW()' }
      registerRoute({
        method: 'POST',
        url: '/query',
        handler: async (request, reply) => {
          try {
            const result = await query(request.body.query);
            reply.send(result);
          } catch (err) {
            reply.status(500).send(err.message);
          }
        },
      });

      // Expose a way to dynamically access the App's configuration
      // GET://test/config?path=foo.aaa
      // (query param is optional)
      registerRoute({
        method: 'GET',
        url: '/config',
        handler: async (request) => request.getConfig(request.query.path),
      });

      // Expose a way to dynamically edit a piece of configuration
      // POST://test/config
      // BODY: { path: 'app.foo', value: 123 }
      // RETURN: { old: 'xxx', new: 123}
      registerRoute({
        method: 'POST',
        url: '/config',
        handler: async (request) => {
          const getConfig = (path) => {
            try {
              return request.getConfig(path);
            } catch (err) {
              return undefined;
            }
          };

          const old = getConfig(request.body.path);
          setConfig(request.body.path, request.body.value);

          return {
            old,
            new: getConfig(request.body.path),
          };
        },
      });

      // Run all the reset DB instructions:
      registerRoute({
        method: 'POST',
        url: '/db/reset',
        handler: async (request, reply) => {
          await createHook.serie(hooks.TDD_RESET_DB, { query });
          reply.send('+ok');
        },
      });
    },
  });
};

module.exports = useServiceTDD ? serviceTDD : () => {};
