const ip = require('ip');
const envalid = require('envalid');
const { runHookApp } = require('@forrestjs/hooks');

const serviceFetchq = require('@forrestjs/service-fetchq');
const serviceFastify = require('@forrestjs/service-fastify');
const serviceFastifyHealthz = require('@forrestjs/service-fastify-healthz');

const serviceKafka = require('./service-kafka');
const featureUsers = require('./feature-users');
const featureInvoices = require('./feature-invoices');
const featureThresholds = require('./feature-thresholds');
const featureKafkaLogger = require('./feature-kafka-logger');

// Check credentials from environment:
const env = envalid.cleanEnv(process.env, {
  PGSTRING: envalid.url(),
});

const host = process.env.HOST_IP || ip.address();

runHookApp({
  trace: 'compact',
  settings: {
    kafka: {
      clientId: 'c1',
      isRestoring: false,
      brokers: [`${host}:9092`],
    },
    fetchq: {
      connectionString: env.PGSTRING,
      autoStart: true,
    },
  },
  services: [
    serviceFetchq,
    serviceKafka,
    serviceFastify,
    serviceFastifyHealthz,
  ],
  features: [
    featureKafkaLogger,
    featureUsers,
    featureInvoices,
    featureThresholds,
  ],
});
