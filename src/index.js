import express from 'express';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import pkg from '@adminjs/sequelize';
const { Database, Resource } = pkg;
import session from 'express-session';
import SequelizeStore from 'connect-session-sequelize';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Database
import sequelize from './config/database.js';

// Models
import Admin from './components/auth/admin.model.js';

// Routes
import voucherRoutes from './components/voucher/voucher.routes.js';

// Admin Configuration
import adminJsConfig from './components/admin/admin.config.js';

// Utils
import './utils/cronJobs.js';

dotenv.config();

// Register AdminJS adapter
AdminJS.registerAdapter({ Database, Resource });

const app = express();
const PORT = process.env.PORT || 3000;

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms`);
  });
  next();
});

// Session store setup
const SessionStore = SequelizeStore(session.Store);
const sessionStore = new SessionStore({
  db: sequelize,
});

// AdminJS setup
const adminJs = new AdminJS({
  ...adminJsConfig,
  databases: [sequelize]
});

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  {
    authenticate: async (email, password) => {
      const admin = await Admin.findOne({ where: { email } });
      if (admin && await admin.validatePassword(password)) {
        return admin;
      }
      return false;
    },
    cookieName: 'adminjs',
    cookiePassword: process.env.SESSION_SECRET || 'session-secret',
  },
  null,
  {
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'session-secret',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
    name: 'adminjs',
  }
);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Voucher Management API',
      version: '1.0.0',
      description: 'API documentation for Voucher Management System',
    },
    servers: [
      {
        url: '/',
        description: 'Current Server'
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your API token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Validation error message'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./src/components/**/voucher.routes.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(express.json());
// Enable trust proxy
app.enable("trust proxy");
app.use(adminJs.options.rootPath, adminRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/v1/vouchers', voucherRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database sync and server start
const startServer = async () => {
  try {
    await sequelize.sync();
    
    // Create default admin if not exists
    const adminExists = await Admin.findOne({
      where: { email: process.env.ADMIN_EMAIL }
    });
    
    if (!adminExists) {
      await Admin.create({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      console.log('Default admin user created');
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`AdminJS started on http://localhost:${PORT}${adminJs.options.rootPath}`);
      console.log(`API Documentation available on http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
