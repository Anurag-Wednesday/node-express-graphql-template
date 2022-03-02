import moment from 'moment';
import { QueryTypes } from 'sequelize';
import JSONCache from 'redis-json';
import Redis from 'ioredis';
import { addWhereClause } from '@utils';
import { TIMESTAMP } from '@utils/constants';
import { getEarliestDate } from '@utils/rawQueries';

export const handleAggregateQueries = (args, tableName) => {
  let where = ``;
  let join = ``;
  const addQuery = suffix => (tableName ? `${tableName}.` : '') + suffix;
  if (args?.startDate) {
    where = addWhereClause(where, `${addQuery(`created_at`)} > :startDate`);
  }
  if (args?.endDate) {
    where = addWhereClause(where, `${addQuery(`created_at`)} < :endDate`);
  }
  if (args?.category) {
    join = `LEFT JOIN products on products.id=purchased_products.product_id`;
    where = addWhereClause(where, `products.category = :category`);
  }
  return { where, join };
};
export const queryOptions = args => ({
  replacements: {
    type: QueryTypes.SELECT,
    startDate: moment(args?.startDate).format(TIMESTAMP),
    endDate: moment(args?.endDate).format(TIMESTAMP),
    category: args?.category
  },
  type: QueryTypes.SELECT
});

export const queryRedis = async (type, args) => {
  const redis = new Redis();
  const jsonCache = new JSONCache(redis);
  let startDate;
  let endDate;
  let count = 0;
  if (!args?.startDate) {
    const createdAtDates = await getEarliestDate();
    const earliestCreatedAt = createdAtDates[0][0].created_at;
    startDate = earliestCreatedAt.toISOString().split('T')[0];
  } else {
    startDate = args.startDate.toISOString().split('T')[0];
  }
  if (!args?.endDate) {
    endDate = moment()
      .subtract(1, 'day')
      .format('YYYY-MM-DD');
  } else {
    endDate = args.endDate.toISOString().split('T')[0];
  }
  if (args?.category) {
    do {
      const totalForCategory = await jsonCache.get(`${startDate}_${args.category}`);
      if (totalForCategory === undefined) {
        console.log(`No data defined for ${args.category} on ${startDate}`);
      } else if (totalForCategory[type] !== null) {
        count += Number(totalForCategory[type]);
      }
      startDate = moment(startDate)
        .add(1, 'day')
        .format('YYYY-MM-DD');
    } while (startDate <= endDate);
    return count;
  } else {
    do {
      const totalForDate = await jsonCache.get(`${startDate}_total`);

      if (totalForDate[type] !== null) {
        count += Number(totalForDate[type]);
      }
      startDate = moment(startDate)
        .add(1, 'day')
        .format('YYYY-MM-DD');
    } while (startDate <= endDate);
    return count;
  }
};
