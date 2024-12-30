# Voucher Management System

A comprehensive voucher management system with AdminJS panel and REST API.

## Features

- Admin Panel for CRUD Operations
- Voucher Expiry Check (Automated)
- REST API with Swagger Documentation
- Token-based API Authentication
- SQLite Database (Sequelize ORM)

## Setup

### Local Development
1. Install dependencies:
```bash
npm install
```

2. Create .env file:
```bash
cp .env.example .env
```

3. Run migrations:
```bash
npx sequelize-cli db:migrate
```

4. Start the server:
```bash
npm start
```

### Docker Setup
1. Build the Docker image:
```bash
docker build -t voucher-management .
```

2. Run the container:
```bash
docker run -d -p 3000:3000 --name voucher-app voucher-management
```

## Access Points

- Admin Panel: http://localhost:3000/admin
- API Documentation: http://localhost:3000/api-docs
- API Base URL: http://localhost:3000/api/v1

## Default Admin Credentials

- Username: admin@example.com
- Password: adminpassword

## API Authentication

All API endpoints require a Bearer token which can be generated from the admin panel.

## Changelog

### [2024-12-30]
#### Added
- DELETE endpoint `/api/v1/vouchers/{code}` to remove vouchers
- Request logging middleware to track API requests with timing information
- Improved error handling for voucher creation with detailed error messages

#### Changed
- Enhanced API error responses to include more detailed information
- Updated Swagger documentation with new delete endpoint
