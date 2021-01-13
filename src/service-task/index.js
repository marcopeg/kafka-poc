const { serializeError, deserializeError } = require('serialize-error');
const { SERVICE_NAME, hooks } = require('./hooks');

const noop = () => {};

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

      const createTaks = async ({
        event,
        payload,
        onComplete = noop,
        onError = noop,
      }) => {
        const handler = ({ success, data, error }) => {
          if (success) {
            onComplete(data);
          } else {
            onError(deserializeError(error));
          }
        };
        const request = createPubsubTask(handler, { onTimeout: onError });
        emitJSON(event, { request, payload });
        return request;
      };

      const createHttpTask = (reply, config) =>
        createTaks({
          onComplete: (data) => reply.send(data),
          onError: (error) => reply.status(500).send(error),
          ...config,
        });

      const consumeTask = (handler) => async ({ request, payload }) => {
        try {
          const data = await handler(payload, request);
          publish(request.id, { success: true, data });
        } catch (error) {
          publish(request.id, { success: false, error: serializeError(error) });
        }
      };

      setContext('task.create', createTaks);
      setContext('task.createHttpTask', createHttpTask);
      setContext('task.consume', consumeTask);
    },
  });
};
