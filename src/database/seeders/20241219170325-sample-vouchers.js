'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);

    await queryInterface.bulkInsert('Vouchers', [
      {
        id: uuidv4(),
        name: 'Welcome Discount',
        code: 'WELCOME2024',
        isActive: true,
        discountType: 'PERCENTAGE',
        discountAmount: 20,
        maxRedemptions: 100,
        dailyQuota: 10,
        startDate: now,
        expirationDate: futureDate,
        redeemedCount: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Fixed Discount',
        code: 'FIXED50',
        isActive: true,
        discountType: 'AMOUNT',
        discountAmount: 50000,
        maxRedemptions: 50,
        dailyQuota: 5,
        startDate: now,
        expirationDate: futureDate,
        redeemedCount: 0,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Vouchers', null, {});
  }
};
