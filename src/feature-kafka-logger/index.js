const { FEATURE_NAME, hooks } = require('./hooks');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$START_FEATURE',
    handler: async ({ getContext }) => {
      const createConsumer = getContext('kafka.createConsumer');

      const consumer = await createConsumer({ groupId: `logger` });
      await consumer.subscribe({
        topic: /poc-.*/i,
        fromBeginning: true,
      });

      await consumer.run({
        eachMessage: ({ topic, partition, message }) => {
          console.log({
            topic,
            partition,
            offset: message.offset,
            timestamp: message.timestamp,
            key: message.key ? message.key.toString() : null,
            message: message.value.toString(),
          });
        },
      });
    },
  });
};
