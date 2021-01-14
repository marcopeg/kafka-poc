const axios = require('axios');
const env = require('./jest.env')();

const pause = (delay = 0) => new Promise((r) => setTimeout(r, delay));

const statusCheck = async (endpoint, test) => {
  try {
    const res = await axios.get(endpoint);
    console.log(res.data);
    return test(res);
  } catch (err) {
    return false;
  }
};

const serverIsUp = async (prefix) => {
  console.info(`[${prefix}] await for server's health check...`);
  console.info(`[${prefix}] ${env.TEST_STATUS_CHECK_URL}`);

  let isup = false;
  while (isup === false) {
    await pause(env.TEST_STATUS_CHECK_INTERVAL);
    isup = await statusCheck(
      env.TEST_STATUS_CHECK_URL,
      (res) => res.status === 200,
    );
  }

  console.info(`[${prefix}] server is up...`);
};

const getAppConfig = async (path) =>
  (await axios.get(`${env.TEST_SERVER_ROOT}/test/config?path=${path}`)).data;

const setAppConfig = async (path, value) =>
  (await axios.post(`${env.TEST_SERVER_ROOT}/test/config`, { path, value }))
    .data;

const info = (data) => console.info(JSON.stringify(data, null, 2));

const query = async (query) => {
  try {
    return (await axios.post(`${env.TEST_SERVER_ROOT}/test/query`, { query }))
      .data;
  } catch (err) {
    throw new Error(`${err.response.status} - ${err.response.data}`);
  }
};

const resetSchema = async () =>
  (await axios.post(`${env.TEST_SERVER_ROOT}/test/db/reset`, { query })).data;

const http = {
  get: async (uri) => (await axios.get(`${env.TEST_SERVER_ROOT}${uri}`)).data,
  delete: async (uri) =>
    (await axios.delete(`${env.TEST_SERVER_ROOT}${uri}`)).data,
  post: async (uri, data = {}) =>
    (await axios.post(`${env.TEST_SERVER_ROOT}${uri}`, data)).data,
  put: async (uri, data = {}) =>
    (await axios.put(`${env.TEST_SERVER_ROOT}${uri}`, data)).data,
};

const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const randomItem = (items) => items[random(0, items.length - 1)];

module.exports = () => ({
  env,
  axios,
  pause,
  statusCheck,
  serverIsUp,
  getAppConfig,
  setAppConfig,
  info,
  query,
  resetSchema,
  random,
  randomItem,
  ...http,
});
