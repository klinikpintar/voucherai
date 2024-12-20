export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('VoucherRedemptions', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    voucherId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Vouchers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    customerId: {
      type: Sequelize.STRING,
      allowNull: true
    },
    redeemedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: true
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  });

  // Add indexes for better query performance
  await queryInterface.addIndex('VoucherRedemptions', ['voucherId']);
  await queryInterface.addIndex('VoucherRedemptions', ['customerId']);
  await queryInterface.addIndex('VoucherRedemptions', ['redeemedAt']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('VoucherRedemptions');
}
