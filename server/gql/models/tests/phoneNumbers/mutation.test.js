import get from 'lodash/get';
import { getResponse } from '@utils/testUtils';

describe('phoneNumber graphQL-server-DB mutation tests', () => {
  const createPhoneNumberMut = `
    mutation {
      createPhoneNumber (
        number: "009 1722 2343"
        addressId: 1
      ) {
        id
        number
        addressId
        createdAt
        updatedAt
        deletedAt
      }
    }
  `;

  it('should have a mutation to create a new phoneNumber', async () => {
    await getResponse(createPhoneNumberMut).then(response => {
      const result = get(response, 'body.data.createPhoneNumber');
      expect(result).toMatchObject({
        id: '1',
        number: '009 1722 2343',
        addressId: 1
      });
    });
  });

  const deletePhoneNumberMut = `
  mutation {
    deletePhoneNumber (
        id: 1
    ) {
      id
    }
  }
`;

  it('should have a mutation to delete a phoneNumber', async () => {
    await getResponse(deletePhoneNumberMut).then(response => {
      const result = get(response, 'body.data.deletePhoneNumber');
      expect(result).toEqual(
        expect.objectContaining({
          id: 1
        })
      );
    });
  });
});
