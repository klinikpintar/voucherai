require('dotenv').config();
const path = require('path');

const usePostgres = process.env.POSTGRES_HOST && 
                   process.env.POSTGRES_DB && 
                   process.env.POSTGRES_USER && 
                   process.env.POSTGRES_PASSWORD;
const db = usePostgres ? {
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
} : {
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/database.sqlite')
}

const config = {
  development: db,
  test: {
    dialect: 'sqlite',
    storage: ':memory:'
  },
  production: db
};

module.exports = config;
