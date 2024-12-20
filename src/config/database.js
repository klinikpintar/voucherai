import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../database/database.sqlite');

// Check if PostgreSQL credentials are provided
const usePostgres = process.env.POSTGRES_HOST && 
                   process.env.POSTGRES_DB && 
                   process.env.POSTGRES_USER && 
                   process.env.POSTGRES_PASSWORD;

// Create Sequelize instance for the application
const sequelize = usePostgres ? new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
}) : new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

export default sequelize;
