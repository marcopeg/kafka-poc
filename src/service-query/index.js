const { SERVICE_NAME, hooks } = require('./hooks');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: SERVICE_NAME,
    trace: __filename,
    hook: '$FETCHQ_READY',
    handler: ({ fetchq }, { setContext }) => {
      const query = fetchq.pool.query.bind(fetchq.pool);
      setContext('query', query);
    },
  });
};
