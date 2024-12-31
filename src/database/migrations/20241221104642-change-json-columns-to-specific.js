'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Add new specific columns
    await queryInterface.addColumn('Vouchers', 'discountType', {
      type: Sequelize.ENUM('PERCENTAGE', 'AMOUNT'),
      allowNull: false,
      defaultValue: 'PERCENTAGE'
    });

    await queryInterface.addColumn('Vouchers', 'discountAmount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('Vouchers', 'maxRedemptions', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    await queryInterface.addColumn('Vouchers', 'dailyQuota', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    // Step 2: Migrate data from JSON columns to specific columns
    const vouchers = await queryInterface.sequelize.query(
      'SELECT id, discount, redemption FROM "Vouchers"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const voucher of vouchers) {
      const discount = JSON.parse(voucher.discount);
      const redemption = JSON.parse(voucher.redemption);

      await queryInterface.sequelize.query(
        `UPDATE "Vouchers" SET 
         "discountType" = ?, 
         "discountAmount" = ?, 
         "maxRedemptions" = ?, 
         "dailyQuota" = ? 
         WHERE id = ?`,
        {
          replacements: [
            discount.type,
            discount.type === 'PERCENTAGE' ? discount.percentOff : discount.amountOff,
            redemption.quantity,
            redemption.dailyQuota,
            voucher.id
          ]
        }
      );
    }

    // Step 3: Remove old JSON columns
    await queryInterface.removeColumn('Vouchers', 'discount');
    await queryInterface.removeColumn('Vouchers', 'redemption');
    await queryInterface.removeColumn('Vouchers', 'dailyRedemptions');
  },

  async down(queryInterface, Sequelize) {
    // Step 1: Add back JSON columns
    await queryInterface.addColumn('Vouchers', 'discount', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    });

    await queryInterface.addColumn('Vouchers', 'redemption', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    });

    await queryInterface.addColumn('Vouchers', 'dailyRedemptions', {
      type: Sequelize.JSON,
      defaultValue: {}
    });

    // Step 2: Migrate data back to JSON columns
    const vouchers = await queryInterface.sequelize.query(
      'SELECT id, "discountType", "discountAmount", "maxRedemptions", "dailyQuota" FROM "Vouchers"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const voucher of vouchers) {
      const discount = {
        type: voucher.discountType,
        [voucher.discountType === 'PERCENTAGE' ? 'percentOff' : 'amountOff']: parseFloat(voucher.discountAmount)
      };

      const redemption = {
        quantity: voucher.maxRedemptions,
        dailyQuota: voucher.dailyQuota
      };

      await queryInterface.sequelize.query(
        `UPDATE "Vouchers" SET 
         discount = ?, 
         redemption = ?,
         "dailyRedemptions" = ?
         WHERE id = ?`,
        {
          replacements: [
            JSON.stringify(discount),
            JSON.stringify(redemption),
            JSON.stringify({}),
            voucher.id
          ]
        }
      );
    }

    // Step 3: Remove specific columns
    await queryInterface.removeColumn('Vouchers', 'discountType');
    await queryInterface.removeColumn('Vouchers', 'discountAmount');
    await queryInterface.removeColumn('Vouchers', 'maxRedemptions');
    await queryInterface.removeColumn('Vouchers', 'dailyQuota');
  }
};
