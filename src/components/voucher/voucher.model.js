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
  customerId: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  discount: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidDiscount(value) {
        if (!value.type || !['AMOUNT', 'PERCENTAGE'].includes(value.type)) {
          throw new Error('Invalid discount type');
        }
        if (value.type === 'AMOUNT' && (!value.amountOff || value.amountOff <= 0)) {
          throw new Error('Invalid amount off value');
        }
        if (value.type === 'PERCENTAGE' && (!value.percentOff || value.percentOff <= 0 || value.percentOff > 100)) {
          throw new Error('Invalid percentage off value');
        }
      }
    }
  },
  redemption: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidRedemption(value) {
        if (!value.quantity || value.quantity <= 0) {
          throw new Error('Invalid redemption quantity');
        }
        if (!value.dailyQuota || value.dailyQuota <= 0) {
          throw new Error('Invalid daily quota');
        }
        if (value.dailyQuota > value.quantity) {
          throw new Error('Daily quota cannot be greater than total quantity');
        }
      }
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfterNow(value) {
        if (value && new Date(value) < new Date()) {
          throw new Error('Start date must be in the future');
        }
      }
    }
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfterStartDate(value) {
        if (value && new Date(value) <= new Date(this.startDate)) {
          throw new Error('Expiration date must be after start date');
        }
      }
    }
  },
  redeemedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dailyRedemptions: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['code']
    }
  ]
});

export default Voucher;
