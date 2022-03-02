import Bull from 'bull';
import moment from 'moment';
import JSONCache from 'redis-json';
import Redis from 'ioredis';
import { pubsub } from '@utils/pubsub';
import { SUBSCRIPTION_TOPICS } from '@utils/constants';
import { sendMessage } from '@server/services/slack';
import {
  getAllCategories,
  getCountByDate,
  getCountByDateForCategory,
  getTotalByDate,
  getTotalByDateForCategory
} from './rawQueries';

const queues = {};

export const QUEUE_NAMES = {
  MIDNIGHT_CRON: 'midnightCron',
  SCHEDULE_JOB: 'scheduleJob',
  EVERY_MINUTE_CRON: 'everyMinuteCron',
  CHECK_SUM_CRON: 'checkSumCron'
};
const CRON_EXPRESSIONS = {
  MIDNIGHT: '0 0 * * *',
  EVERY_MINUTE: '* * * * *'
};

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
  },
  [QUEUE_NAMES.CHECK_SUM_CRON]: async (job, done) => {
    const redis = new Redis();
    const jsonCache = new JSONCache(redis);
    const allCategories = getAllCategories();
    const categories = new Set(allCategories[1].rows.map(item => item.category));
    const previousDate = moment()
      .subtract(1, 'day')
      .format('YYYY-MM-DD');
    const redisTotal = await jsonCache.get(`${previousDate}_total`);
    const databaseTotal = await getTotalByDate(previousDate);
    const databaseCount = await getCountByDate(previousDate);
    if (!redisTotal) {
      sendMessage(`No total found for purchasedProducts for ${previousDate}`);
      await jsonCache.set(`${previousDate}_total`, {
        total: databaseTotal[0][0].sum,
        count: databaseCount[0][0].count
      });
    } else if (redisTotal?.total !== databaseTotal[0][0].sum && redisTotal?.count !== databaseCount[0][0].count) {
      sendMessage(
        `Incorrect sum or count for purchasedProducts as redis value is ${redisTotal} and database value is ${
          databaseTotal[0][0].sum
        } and ${databaseCount[0][0].count}`
      );
      await jsonCache.set(`${previousDate}_total`, {
        total: databaseTotal[0][0].sum,
        count: databaseCount[0][0].count
      });
    }
    categories.forEach(async category => {
      const storedCategoryTotal = await jsonCache.get(`${previousDate}_${category}`);
      const databaseCategoryTotal = await getTotalByDateForCategory(previousDate, category);
      const databaseCategoryCount = await getCountByDateForCategory(previousDate, category);
      if (
        storedCategoryTotal?.total !== databaseCategoryTotal[0][0].sum &&
        storedCategoryTotal?.count !== databaseCategoryCount[0][0].count
      ) {
        sendMessage(
          `The total for ${category} is incorrect as database total is ${
            databaseCategoryTotal[0][0].sum
          } and total stored in redis is ${storedCategoryTotal?.total} for date ${previousDate}`
        );
        await jsonCache.set(`${previousDate}_${category}`, {
          total: databaseCategoryTotal[0][0].sum,
          count: databaseCategoryCount[0][0].count
        });
      }
    });
    redis.set('lastRunFor', previousDate);
    done();
  }
};

export const initQueues = () => {
  console.log(' init queues');
  Object.keys(QUEUE_PROCESSORS).forEach(queueName => {
    queues[queueName] = getQueue(queueName);
    queues[queueName].process(QUEUE_PROCESSORS[queueName]);
  });
  queues[QUEUE_NAMES.CHECK_SUM_CRON].add({}, { repeat: { cron: CRON_EXPRESSIONS.MIDNIGHT } });
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
