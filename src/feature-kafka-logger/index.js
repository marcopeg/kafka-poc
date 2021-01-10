const { FEATURE_NAME, hooks } = require('./hooks');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: FEATURE_NAME,
    trace: __filename,
    hook: '$START_FEATURE',
    handler: async ({ getContext }) => {
      const kafka = getContext('kafka');

      const consumer = kafka.consumer({ groupId: `logger-${Date.now()}` });
      await consumer.connect();
      await consumer.subscribe({
        topic: /poc-.*/i,
        fromBeginning: false,
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
