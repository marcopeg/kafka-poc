const { SERVICE_NAME, hooks } = require('./hooks');

module.exports = ({ registerHook, registerAction }) => {
  registerHook(hooks);

  registerAction({
    name: SERVICE_NAME,
    trace: __filename,
    hook: '$START_FEATURE',
    handler: ({ getContext, setContext }) => {
      console.log('@@@@@@@@@@@@task');
    },
  });
};
