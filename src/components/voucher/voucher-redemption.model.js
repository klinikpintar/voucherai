import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';
import Voucher from './voucher.model.js';

const VoucherRedemption = sequelize.define('VoucherRedemption', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  voucherId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Vouchers',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  redeemedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

// Set up associations
VoucherRedemption.belongsTo(Voucher, { foreignKey: 'voucherId' });
Voucher.hasMany(VoucherRedemption, { foreignKey: 'voucherId' });

export default VoucherRedemption;
