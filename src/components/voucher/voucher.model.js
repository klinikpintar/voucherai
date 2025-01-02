import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Voucher = sequelize.define('Voucher', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  discountType: {
    type: DataTypes.ENUM('PERCENTAGE', 'AMOUNT'),
    allowNull: false,
    defaultValue: 'PERCENTAGE'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  maxDiscountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  maxRedemptions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  dailyQuota: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  redeemedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'Vouchers',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['code']
    }
  ]
});

export default Voucher;
