export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Vouchers', 'customerId', {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Vouchers', 'customerId');
}
