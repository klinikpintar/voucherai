require('dotenv').config();
const path = require('path');

const usePostgres = process.env.POSTGRES_HOST && 
                   process.env.POSTGRES_DB && 
                   process.env.POSTGRES_USER && 
                   process.env.POSTGRES_PASSWORD;

const config = {
  development: usePostgres ? {
    dialect: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  } : {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database/database.sqlite')
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:'
  },
  production: {
    dialect: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

module.exports = config;
