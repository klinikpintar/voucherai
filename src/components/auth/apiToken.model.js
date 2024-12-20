import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';
import crypto from 'crypto';

const ApiToken = sequelize.define('ApiToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    defaultValue: () => {
      return crypto.randomBytes(32).toString('hex');
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isAfterNow(value) {
        if (value && new Date(value) <= new Date()) {
          throw new Error('Expiration date must be in the future');
        }
      }
    }
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (apiToken) => {
      if (!apiToken.token) {
        apiToken.token = crypto.randomBytes(32).toString('hex');
      }
    }
  }
});

export default ApiToken;
