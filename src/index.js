const ip = require('ip');
const envalid = require('envalid');
const { runHookApp } = require('@forrestjs/hooks');

const serviceFetchq = require('@forrestjs/service-fetchq');
const serviceFastify = require('@forrestjs/service-fastify');
const serviceFastifyHealthz = require('@forrestjs/service-fastify-healthz');

const serviceQuery = require('./service-query');
const serviceKafka = require('./service-kafka');
const servicePubSub = require('./service-pubsub');
const serviceTask = require('./service-task');

const featureUsers = require('./feature-users');
const featureInvoices = require('./feature-invoices');
const featureThresholds = require('./feature-thresholds');
const featureTotals = require('./feature-totals');
const featureKafkaLogger = require('./feature-kafka-logger');

// Check credentials from environment:
const host = process.env.HOST_IP || ip.address();
const env = envalid.cleanEnv(process.env, {
  PGSTRING: envalid.url(),
  KAFKA_BROKER: envalid.str({ default: `${host}:9092` }),
});

runHookApp({
  trace: 'compact',
  settings: {
    kafka: {
      clientId: 'c1',
      isRestoring: false,
      brokers: [env.KAFKA_BROKER],
    },
    fetchq: {
      connectionString: env.PGSTRING,
      autoStart: true,
    },
  },
  services: [
    serviceFetchq,
    serviceQuery,
    serviceKafka,
    servicePubSub,
    serviceTask,
    serviceFastify,
    serviceFastifyHealthz,
  ],
  features: [
    featureKafkaLogger,
    featureUsers,
    featureInvoices,
    featureThresholds,
    featureTotals,
  ],
});
