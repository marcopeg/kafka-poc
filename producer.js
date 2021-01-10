const ip = require('ip');
const { Kafka } = require('kafkajs');

// Create Kafka client:
const host = process.env.HOST_IP || ip.address();
const client = new Kafka({
  clientId: 'producer',
  brokers: [`${host}:9092`],
});

const topics = {
  default: 't1',
};

const makeProducer = async () => {
  const producer = client.producer();
  await producer.connect();

  return {
    send: async (payload) => {
      console.log('sending...');
      await producer.send({
        topic: topics.default,
        messages: [
          {
            value: payload,
            partition: 0,
          },
        ],
      });
      console.log('ok!');
    },
    disconnect: () => producer.disconnect(),
  };
};

const boot = async () => {
  const producer1 = await makeProducer();
  await producer1.send('msg2');
  await producer1.disconnect();
};

console.log('BOOOOO');
boot().catch((err) => console.log(err));
