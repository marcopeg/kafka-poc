const { FEATURE_NAME, hooks } = require('./hooks');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$START_FEATURE',
    handler: async ({ getContext }) => {
      const createJSONConsumer = getContext('kafka.createJSONConsumer');

      const groupId = `kafka-logger`;
      const topics = [{ topic: /poc-.*/i, fromBeginning: true }];
      const handlers = (payload, { event }) =>
        console.log(`[kafka-logger] ${event}`, payload);

      await createJSONConsumer({ groupId, topics, handlers });
    },
  });
};
