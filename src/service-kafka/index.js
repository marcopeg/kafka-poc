const { Kafka } = require('kafkajs');
const { SERVICE_NAME, hooks } = require('./hooks');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: SERVICE_NAME,
    trace: __filename,
    hook: '$INIT_SERVICE',
    handler: ({ getConfig, setContext }) => {
      const clientId = getConfig('kafka.clientId');
      const brokers = getConfig('kafka.brokers');
      const client = new Kafka({ clientId, brokers });
      setContext('kafka', client);
    },
  });
};
