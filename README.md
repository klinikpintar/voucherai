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
- GitHub Actions workflow for automated Docker image builds
- Container Registry integration for Docker image distribution

#### Changed
- Enhanced API error responses to include more detailed information
- Updated Swagger documentation with new delete endpoint

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and delivery:

### Docker Image Publishing
- Images are automatically built and published to GitHub Container Registry
- Tags are created for:
  - Branch names (e.g., `develop`, `main`)
  - Git SHA (for precise version tracking)
  - Latest tag (only for main branch)

### Pull Images
```bash
# Pull latest main branch image
docker pull ghcr.io/[username]/voucher-management:latest

# Pull specific branch
docker pull ghcr.io/[username]/voucher-management:develop
```

Replace `[username]` with your GitHub username.
