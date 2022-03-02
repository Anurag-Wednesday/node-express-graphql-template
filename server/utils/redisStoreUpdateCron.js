import JSONCache from 'redis-json';
import Redis from 'ioredis';
import moment from 'moment';
import { QUEUE_NAMES } from './queue';
import {
  getAllCategories,
  getCountByDate,
  getCountByDateForCategory,
  getEarliestDate,
  getTotalByDate,
  getTotalByDateForCategory
} from './rawQueries';

export const redisStoreConst = {
  [QUEUE_NAMES.CHECK_REDIS_CRON]: async (job, done) => {
    const redis = new Redis();
    const jsonCache = new JSONCache(redis);
    const previousDate = moment()
      .subtract(1, 'day')
      .format('YYYY-MM-DD');
    const lastRunOn = await redis.get('lastRunOn');
    let date;
    if (lastRunOn !== previousDate) {
      if (lastRunOn === null) {
        const createdAt = await getEarliestDate();
        const earliestCreatedAt = createdAt[0][0].created_at;
        const earliestCreatedDate = earliestCreatedAt.toISOString().split('T')[0];
        date = earliestCreatedDate;
      } else {
        date = lastRunOn;
      }
      do {
        const totalForDate = await getTotalByDate(date);
        const countForDate = await getCountByDate(date);
        const allCategories = await getAllCategories();
        const categories = new Set(allCategories[1].rows.map(item => item.category));
        categories.forEach(async category => {
          const categoryTotal = await getTotalByDateForCategory(date, category);
          const categoryCount = await getCountByDateForCategory(date, category);
          await jsonCache.set(`${date}_${category}`, {
            total: categoryTotal[0][0].sum,
            count: categoryCount[0][0].count
          });
        });
        await jsonCache.set(`${date}_total`, {
          total: totalForDate[0][0].sum,
          count: countForDate[0][0].count
        });
        await redis.set('lastRunOn', date);
        date = moment(date)
          .add(1, 'day')
          .format('YYYY-MM-DD');
      } while (date <= previousDate);
      console.log('updated the store');
    } else {
      console.log('The redis store is updated');
    }
    done();
  }
};
