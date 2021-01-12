const { SERVICE_NAME, hooks } = require('./hooks');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: SERVICE_NAME,
    trace: __filename,
    hook: '$START_FEATURE',
    handler: ({ getContext, setContext }) => {
      const createPubsubTask = getContext('pubsub.createTask');
      const publish = getContext('pubsub.publish');
      const emitJSON = getContext('kafka.emitJSON');

      const createTaks = async ({ event, payload, onComplete }) => {
        const request = createPubsubTask(onComplete);
        emitJSON(event, { request, payload });
        return request;
      };

      const consumeTask = (handler) => async ({ request, payload }) => {
        const result = await handler(payload, request);
        publish(request.id, result);
      };

      setContext('task.create', createTaks);
      setContext('task.consume', consumeTask);
    },
  });
};
