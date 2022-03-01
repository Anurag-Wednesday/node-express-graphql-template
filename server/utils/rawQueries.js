export const getSingleCategory = (client, args) =>
  client.query(`SELECT category from products where products.id = ${args.productId}`);
