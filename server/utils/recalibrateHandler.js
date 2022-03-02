import JSONCache from 'redis-json';
import Redis from 'ioredis';
import moment from 'moment';
import {
  getAllCategories,
  getCountByDate,
  getCountByDateForCategory,
  getTotalByDate,
  getTotalByDateForCategory
} from './rawQueries';

export const recalibrateRedis = async (startDate, endDate) => {
  const redis = new Redis();
  const jsonCache = new JSONCache(redis);
  do {
    const totalForDate = await getTotalByDate(startDate);
    const countForDate = await getCountByDate(startDate);
    const allCategories = await getAllCategories();
    const categories = new Set(allCategories[1].rows.map(item => item.category));
    categories.forEach(async category => {
      const categoryTotal = await getTotalByDateForCategory(startDate, category);
      const categoryCount = await getCountByDateForCategory(startDate, category);
      await jsonCache.set(`${startDate}_${category}`, {
        total: categoryTotal[0][0].sum,
        count: categoryCount[0][0].count
      });
    });
    await jsonCache.set(`${startDate}_total`, {
      total: totalForDate[0][0].sum,
      count: countForDate[0][0].count
    });
    await redis.set('lastRunOn', startDate);
    startDate = moment(startDate)
      .add(1, 'day')
      .format('YYYY-MM-DD');
  } while (startDate <= endDate);
  const message = 'Upated the redis Store with recalculated values';
  return message;
};
