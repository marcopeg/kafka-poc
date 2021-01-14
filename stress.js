const axios = require('axios');
const envalid = require('envalid');

const SERVER_ROOT = process.env.SERVER_ROOT || 'http://localhost:8080';

const env = envalid.cleanEnv(process.env, {
  TEST_SERVER_ROOT: envalid.url({
    default: SERVER_ROOT,
  }),
  TEST_STATUS_CHECK_URL: envalid.url({
    default: `${SERVER_ROOT}/test/status`,
  }),
  TEST_STATUS_CHECK_INTERVAL: envalid.num({ default: 250 }),
});

const pause = (delay = 0) => new Promise((r) => setTimeout(r, delay));
const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomItem = (items) => items[random(0, items.length - 1)];

const http = {
  get: async (uri) => (await axios.get(`${env.TEST_SERVER_ROOT}${uri}`)).data,
  delete: async (uri) =>
    (await axios.delete(`${env.TEST_SERVER_ROOT}${uri}`)).data,
  post: async (uri, data = {}) =>
    (await axios.post(`${env.TEST_SERVER_ROOT}${uri}`, data)).data,
  put: async (uri, data = {}) =>
    (await axios.put(`${env.TEST_SERVER_ROOT}${uri}`, data)).data,
};

const statusCheck = async (endpoint, test) => {
  try {
    const res = await axios.get(endpoint);
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

const query = async (query) => {
  try {
    return (await axios.post(`${env.TEST_SERVER_ROOT}/test/query`, { query }))
      .data;
  } catch (err) {
    throw new Error(`${err.response.status} - ${err.response.data}`);
  }
};

const makeRandomUsers = async (limit) => {
  for (let i = 0; i < limit; i++) {
    try {
      await http.post('/api/v1/users', {
        id: `urs-${random(1, 99999)}`,
        name: 'Marco',
      });
    } catch (err) {}
  }
};

const getRandomUsers = async (limit) => {
  const result = await query(
    `select "id" from "users_list" order by random() limit ${limit};`,
  );
  return result.rows;
};

const makeRandomInvoices = async (user_id, limit) => {
  for (let i = 0; i < limit; i++) {
    try {
      const payload = {
        user_id,
        amount: random(100, 9999),
      };
      await http.post('/api/v1/invoices', payload);
    } catch (err) {
      console.log('Err invoice:', err.response.data.message);
    }
  }
};

const boot = async (limit) => {
  await serverIsUp('stress');

  for (let i = 0; i < limit; i++) {
    console.log(`loop ${i + 1}/${limit}`);
    await makeRandomUsers(1000);
    const users = await getRandomUsers(250);
    let usrCount = 1;
    for (const { id } of users) {
      console.log(`user ${usrCount}/${users.length}`);
      await makeRandomInvoices(id, 100);
      usrCount++;
    }
  }
};

boot(1000)
  .then(() => console.log('Stress is over :-)'))
  .catch((err) => console.log(err.message));
