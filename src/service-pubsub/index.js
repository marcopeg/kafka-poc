const { v4: uuid } = require('uuid');
const { SERVICE_NAME, hooks } = require('./hooks');

class JobTimeoutError extends Error {}
const noop = () => {};

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: SERVICE_NAME,
    trace: __filename,
    hook: '$FETCHQ_READY',
    handler: ({ fetchq }, { setContext }) => {
      const activeChannels = {};
      const timers = {};

      /**
       * PUBLIC API
       */

      const publish = (channel, payload) =>
        fetchq.emitter.publish(channel, payload);

      const subscribe = (channel, fn = null) => {
        const tuple = [channel, fn];
        clearTimeout(timers[tuple]);

        // Register channel:
        if (!activeChannels[tuple]) {
          fetchq.emitter.addChannel(channel, fn);
          activeChannels[tuple] = Date.now();
        }

        // Automatic channel cleanup:
        timers[tuple] = setTimeout(() => {
          fetchq.emitter.removeChannel(channel, fn);
          delete activeChannels[tuple];
          delete timers[tuple];
        }, 1000 * 60 * 5);
      };

      const subscribeOnce = (channel, fn) => {
        subscribe(channel);
        fetchq.emitter.once(channel, fn);
      };

      const createTask = (
        onComplete = noop,
        { id = null, timeout = 1000 * 20, onTimeout = noop } = {},
      ) => {
        const jobId = `${id || 'pubsub-job'}-${uuid()}`;
        const timer = setTimeout(() => {
          const error = new JobTimeoutError('Job timeout');
          onTimeout(error);
        }, timeout);

        subscribeOnce(jobId, (payload) => {
          clearTimeout(timer);
          onComplete(payload, jobId);
        });

        return { id: jobId };
      };

      setContext('pubsub', { publish, subscribe, subscribeOnce, createTask });

      /**
       * PROCESS CLEANUP
       */

      const errorTypes = ['unhandledRejection', 'uncaughtException'];
      const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

      const cleanup = async () => {
        console.log('[pubsub] cleaning up all listeners....');
        for (let tuple of Object.keys(activeChannels)) {
          const [channel, fn] = tuple;
          fetchq.emitter.removeChannel(channel, fn);
        }
        console.log('[pubsub] goodbye :-)');
      };

      errorTypes.map((type) => {
        process.on(type, async (err) => {
          console.log(`[pubsub on ${type}] ${err.message}`);
        });
      });

      signalTraps.map((type) => {
        process.once(type, () => {
          console.log(`[pubsub] ${type} termination detected.`);
          cleanup();
        });
      });
    },
  });
};
