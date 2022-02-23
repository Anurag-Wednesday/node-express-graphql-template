import Bull from 'bull';
import moment from 'moment';
import { pubsub } from '@utils/pubsub';
import { SUBSCRIPTION_TOPICS } from '@utils/constants';

const queues = {};
// 1
export const QUEUE_NAMES = {
  MIDNIGHT_CRON: 'midnightCron',
  SCHEDULE_JOB: 'scheduleJob',
  EVERY_MINUTE_CRON: 'everyMinuteCron'
};
const CRON_EXPRESSIONS = {
  MIDNIGHT: '0 0 * * *',
  EVERY_MINUTE: '* * * * *'
};
// 2
export const QUEUE_PROCESSORS = {
  [QUEUE_NAMES.SCHEDULE_JOB]: (job, done) => {
    console.log(`${moment()}::Job with id: ${job.id} is being executed.\n`, {
      message: job.data.message
    });
    done();
  },
  [QUEUE_NAMES.MIDNIGHT_CRON]: (job, done) => {
    console.log({ job, done });
    console.log(`${moment()}::The MIDNIGHT_CRON is being executed at 12:00am`);
    done();
  },
  [QUEUE_NAMES.EVERY_MINUTE_CRON]: (job, done) => {
    console.log(`publishing to ${SUBSCRIPTION_TOPICS.NOTIFICATIONS}`);
    pubsub.publish(SUBSCRIPTION_TOPICS.NOTIFICATIONS, {
      notifications: {
        message: 'This message is from the CRON',
        scheduleIn: 0
      }
    });
    done();
  }
};

// 3
export const initQueues = () => {
  console.log(' init queues');
  Object.keys(QUEUE_PROCESSORS).forEach(queueName => {
    queues[queueName] = getQueue(queueName);
    queues[queueName].process(QUEUE_PROCESSORS[queueName]);
  });

  queues[QUEUE_NAMES.MIDNIGHT_CRON].add({}, { repeat: { cron: CRON_EXPRESSIONS.MIDNIGHT } });
  queues[QUEUE_NAMES.EVERY_MINUTE_CRON].add({}, { repeat: { cron: CRON_EXPRESSIONS.EVERY_MINUTE } });
};
export const getQueue = queueName => {
  if (!queues[queueName]) {
    queues[queueName] = new Bull(queueName, `redis://${process.env.REDIS_DOMAIN}:${process.env.REDIS_PORT}`);
    console.log('created queue: ', queueName, `redis://${process.env.REDIS_DOMAIN}:${process.env.REDIS_PORT}`);
  }
  return queues[queueName];
};
