import get from 'lodash/get';
import { phoneNumbersTable } from '@server/utils/testUtils/mockData';
import { getResponse } from '@utils/testUtils';

describe('PhoneNumbers graphQL-server-DB pagination tests', () => {
  const phoneNumbersQuery = `
  query {
    phoneNumbers (first: 1, limit: 1, offset: 0){
      edges {
        node {
          id
          number
          addressId
          addresses {
            edges {
              node {
                id
              }
            }
        }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      total
    }
  }
`;

  it('should have a query to get the storeProducts', async () => {
    await getResponse(phoneNumbersQuery).then(response => {
      const result = get(response, 'body.data.phoneNumbers.edges[0].node');
      expect(result).toEqual(
        expect.objectContaining({
          id: phoneNumbersTable[0].id,
          number: phoneNumbersTable[0].number,
          addressId: phoneNumbersTable[0].addressId
        })
      );
    });
  });

  it('should have the correct pageInfo', async () => {
    await getResponse(phoneNumbersQuery).then(response => {
      const result = get(response, 'body.data.phoneNumbers.pageInfo');
      expect(result).toEqual(
        expect.objectContaining({
          hasNextPage: true,
          hasPreviousPage: false
        })
      );
    });
  });
});
