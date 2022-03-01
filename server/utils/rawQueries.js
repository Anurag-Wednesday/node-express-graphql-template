import { client } from '@database';

export const getSingleCategory = async args =>
  client.query(`SELECT category from products where products.id = ${args.productId}`);

export const getTotalByDate = async previousDate =>
  client.query(
    `SELECT SUM(price) from purchased_products WHERE(purchased_products.created_at >'${previousDate} 00:00:00' )AND(purchased_products.created_at < '${previousDate} 23:59:59')`
  );

export const getTotalByDateForCategory = async (previousDate, category) =>
  client.query(
    `SELECT SUM(price) from purchased_products LEFT JOIN products on products.id=purchased_products.product_id WHERE ( purchased_products.created_at > '${previousDate} 00:00:00' )AND( purchased_products.created_at < '${previousDate} 23:59:59' ) AND(products.category = '${category}' )`
  );

export const getAllCategories = async () =>
  client.query(
    `SELECT products.category FROM products JOIN purchased_products ON products.id = purchased_products.product_id`
  );
