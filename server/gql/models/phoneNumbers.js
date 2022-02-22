import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { createConnection } from 'graphql-sequelize';
import { timestamps } from './timestamps';
import { getNode } from '@gql/node';
import db from '@database/models';
import { addressQueries } from './addresses';
import { totalConnectionFields } from '@utils/index';
import { sequelizedWhere } from '@database/dbUtils';

const { nodeInterface } = getNode();

export const phoneNumberFields = {
  id: { type: GraphQLNonNull(GraphQLID) },
  number: { type: GraphQLString },
  addressId: { type: GraphQLInt }
};
const PhoneNumber = new GraphQLObjectType({
  name: 'PhoneNumber',
  interfaces: [nodeInterface],
  sqlPaginate: true,
  fields: () => ({
    ...phoneNumberFields,
    ...timestamps,
    addresses: {
      ...addressQueries.list,
      resolve: (source, args, context, info) =>
        addressQueries.list.resolve(source, args, { ...context, phoneNumber: source.dataValues }, info)
    }
  })
});

export const PhoneNumberConnection = createConnection({
  nodeType: PhoneNumber,
  name: 'phoneNumbers',
  target: db.phoneNumbers,
  before: (findOptions, args, context) => {
    findOptions.include = findOptions.include || [];
    if (context?.address?.id) {
      findOptions.include.push({
        model: db.addresses,
        where: {
          id: context.address.id
        }
      });
    }
    findOptions.where = sequelizedWhere(findOptions.where, args.where);
    return findOptions;
  },
  ...totalConnectionFields
});

export const phoneNumberQueries = {
  args: {
    id: {
      type: GraphQLNonNull(GraphQLInt)
    }
  },
  query: {
    type: PhoneNumber
  },
  list: {
    ...PhoneNumberConnection,
    type: PhoneNumberConnection.connectionType,
    args: PhoneNumberConnection.connectionArgs
  },
  model: db.phoneNumbers
};
export const phoneNumberMutations = {
  args: phoneNumberFields,
  type: PhoneNumber,
  model: db.phoneNumbers
};
