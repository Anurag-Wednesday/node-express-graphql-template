import Redis from 'ioredis';
import moment from 'moment';
import { client } from '@database';
import JSONCache from 'redis-json';

const redis = new Redis();
const jsonCache = new JSONCache(redis);

export const customPurchaseProductsResolver = model => ({
  createResolver: async (parent, args, context, resolveInfo) => {
    const currentDate = moment().format('YYYY-MM-DD');
    const response = await client.query(`SELECT category from products where products.id = ${args.productId}`);
    const category = response[0][0].category;
    const createdPurchasedProduct = await model.create(args);
    const redisCategoryValue = await jsonCache.get(`${currentDate}:${category}`);
    const redisTotalValue = await jsonCache.get(`${currentDate}:total`);
    jsonCache.set(`${currentDate}:${category}`, {
      total: redisCategoryValue ? redisCategoryValue.total + args.price : args.price,
      count: redisCategoryValue ? redisCategoryValue.count + 1 : 1
    });
    jsonCache.set(`${currentDate}:total`, {
      total: redisTotalValue ? redisTotalValue.total + args.price : args.price,
      count: redisTotalValue ? redisTotalValue.count + 1 : 1
    });
    return createdPurchasedProduct;
  }
});
