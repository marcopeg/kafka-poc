const ip = require('ip');
const { Kafka } = require('kafkajs');

const host = process.env.HOST_IP || ip.address();
const client = new Kafka({
  clientId: 'consumer',
  brokers: [`${host}:9092`],
});

const topics = {
  default: 't1',
};

const makeConsumer = (name) => async () => {
  const consumer = client.consumer({ groupId: 'a1' });

  await consumer.connect();
  await consumer.subscribe({
    topic: topics.default,
    fromBeginning: true,
  });

  console.log(`Consumer ${name} ready to process.`);
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`${name}> ${message.value.toString()}`, {
        cosumer: name,
        topic,
        partition,
        offset: message.offset,
        timestamp: message.timestamp,
        key: message.key,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  });
};

const consumer1 = makeConsumer('#1');
// const consumer2 = makeConsumer("#2");

consumer1().catch((err) => console.log(err));
// consumer2().catch((err) => console.log(err));
