import get from 'lodash/get';
import { addressesTable } from '@server/utils/testUtils/mockData';
import { getResponse, mockDBClient, resetAndMockDB } from '@utils/testUtils';

describe('phoneNumbers graphQL-server-DB query tests', () => {
  const id = 1;
  const phoneNumber = `
  query {
    phoneNumber (id: ${id}) {
      id
      number
      addresses {
        edges {
          node {
            id
          }
        }
      }
    }
  }
  `;
  it('should request for products and addresses related to the suppliers', async () => {
    const dbClient = mockDBClient();
    resetAndMockDB(null, {}, dbClient);
    jest.spyOn(dbClient.models.addresses, 'findAll').mockImplementation(() => [addressesTable[0]]);
    await getResponse(phoneNumber).then(response => {
      expect(get(response, 'body.data.phoneNumber')).toBeTruthy();
      expect(dbClient.models.addresses.findAll.mock.calls.length).toBe(1);
    });
  });
});
