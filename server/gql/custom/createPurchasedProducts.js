import Redis from 'ioredis';
import moment from 'moment';
import { client } from '@database';
import JSONCache from 'redis-json';
import { insertPurchasedProducts } from '@server/daos/purchasedProducts';
import { getSingleCategory } from '@server/utils/rawQueries';

const redis = new Redis();
const jsonCache = new JSONCache(redis);

export const customPurchaseProductsResolver = () => ({
  createResolver: async (parent, args, context, resolveInfo) => {
    const currentDate = moment().format('YYYY-MM-DD');
    const response = await getSingleCategory(client, args);
    const category = response[0][0].category;
    const createdPurchasedProduct = await insertPurchasedProducts(args);
    const redisCategoryValue = await jsonCache.get(`${currentDate}_${category}`);
    const redisTotalValue = await jsonCache.get(`${currentDate}_total`);
    jsonCache.set(`${currentDate}_${category}`, {
      total: redisCategoryValue ? redisCategoryValue.total + args.price : args.price,
      count: redisCategoryValue ? redisCategoryValue.count + 1 : 1
    });
    jsonCache.set(`${currentDate}_total`, {
      total: redisTotalValue ? redisTotalValue.total + args.price : args.price,
      count: redisTotalValue ? redisTotalValue.count + 1 : 1
    });
    return createdPurchasedProduct;
  }
});
