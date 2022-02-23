import get from 'lodash/get';
import { graphqlSync, GraphQLSchema } from 'graphql';
import { createFieldsWithType, expectSameTypeNameOrKind } from '@utils/testUtils';
import { QueryRoot } from '../../../queries';
import { MutationRoot } from '../../../mutations';
import { timestamps } from '@gql/models/timestamps';
import { phoneNumberFields } from '@gql/models/phoneNumbers';

const schema = new GraphQLSchema({ query: QueryRoot, mutation: MutationRoot });

let fields = [];

fields = createFieldsWithType({ ...phoneNumberFields, ...timestamps });

const query = `
  {
    __type(name: "PhoneNumber") {
        name
        kind
        fields {
          name
          type {
            name
            kind
          }
        }
      }    
  }
`;
describe('PhoneNumber introspection tests', () => {
  it('should have the correct fields and types', async () => {
    const result = await graphqlSync({ schema, source: query });
    const phoneNumberFieldTypes = get(result, 'data.__type.fields');
    const hasCorrectFieldTypes = expectSameTypeNameOrKind(phoneNumberFieldTypes, fields);
    expect(hasCorrectFieldTypes).toBeTruthy();
  });
});
