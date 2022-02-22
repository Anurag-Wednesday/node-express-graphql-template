module.exports = {
  up: queryInterface => {
    const faker = require('faker');
    const range = require('lodash/range');
    const arr = range(1, 100).map((value, index) => ({
      number: faker.phone.phoneNumber(),
      address_id: 1 + parseInt(Math.random() * 1999)
    }));
    return queryInterface.bulkInsert('phone_numbers', arr, {});
  },
  down: queryInterface => queryInterface.bulkDelete('phone_numbers', null, {})
};
