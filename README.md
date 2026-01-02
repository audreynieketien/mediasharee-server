# CloudNative MediaShare Backend

A production-ready, type-safe Node.js/Express backend built with TypeScript, integrating Azure PaaS services for a photo and video sharing application.

## Architecture

- **Runtime**: Node.js (LTS) with TypeScript
- **Framework**: Express.js
- **Database**: Azure Cosmos DB (MongoDB API)
- **Storage**: Azure Blob Storage
- **AI**: Azure AI Vision (Computer Vision API)
- **Authentication**: Custom JWT with bcryptjs
- **Validation**: Zod (runtime type checking)
- **Caching**: node-cache (in-memory)

## Prerequisites

Before running this application, ensure you have:

1. **Node.js** (LTS version 18+)
2. **Azure Resources**:
   - Azure Cosmos DB (MongoDB API) instance
   - Azure Blob Storage account
   - Azure AI Vision (Computer Vision) resource

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your Azure credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Azure service credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Authentication (REQUIRED - minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# Azure Cosmos DB (MongoDB API)
COSMOS_DB_CONNECTION_STRING=mongodb://your-cosmosdb-account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
AZURE_STORAGE_CONTAINER_NAME=media

# Azure AI Vision (Computer Vision)
AZURE_VISION_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
AZURE_VISION_API_KEY=your-vision-api-key

# Cache Configuration (TTL in seconds)
CACHE_FEED_TTL=30
CACHE_SUGGESTIONS_TTL=300
```

### 3. Development

Run the development server with hot-reloading:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Build for Production

Compile TypeScript to JavaScript:

```bash
npm run build
```

This creates a `dist/` folder with compiled JavaScript files.

### 5. Start Production Server

```bash
npm start
```

## API Endpoints

### Authentication

- **POST** `/api/auth/register` - Create new user account
  - Body: `{ username, email, password, role }`
  - Returns: `{ token, user }`
- **POST** `/api/auth/login` - Authenticate with email/password
  - Body: `{ email, password }`
  - Returns: `{ token, user }`
- **GET** `/api/auth/me` - Get current user profile
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ user }`

### Media Upload

- **POST** `/api/media/upload` - Upload image/video (Creator only)
  - Headers: `Authorization: Bearer <token>`
  - Body: `multipart/form-data` with `file` and metadata

### Feed & Discovery

- **GET** `/api/feed?page=1&limit=20` - Get paginated feed (cached)
- **GET** `/api/feed/search/suggestions` - Get unique tags and locations (cached)

### Posts & Interactions

- **GET** `/api/posts/:id` - Get single post
- **POST** `/api/posts/:id/like` - Like a post
  - Headers: `Authorization: Bearer <token>`
- **POST** `/api/posts/:id/comment` - Add comment
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ text }`

### Health Check

- **GET** `/health` - Server health status

## Authentication Flow

1. **Frontend** sends registration request to `/api/auth/register`
2. **Backend** hashes password with bcrypt (10 rounds)
3. **Backend** creates user in Cosmos DB
4. **Backend** generates JWT token (7-day expiry) signed with `JWT_SECRET`
5. **Frontend** stores token and uses it in `Authorization: Bearer <token>` header
6. **Backend** verifies JWT on all protected routes
7. **Backend** uses `req.user` for user-specific operations

## Type Safety

All API responses strictly adhere to TypeScript interfaces defined in `src/types/shared.ts`:

- `IUser` - User object
- `IPost` - Post object with populated creator
- `IComment` - Comment object

Zod schemas validate all incoming requests at runtime to prevent type mismatches.

## Project Structure

```
src/
├── config/
│   ├── index.ts          # Centralized configuration
│   └── database.ts       # Cosmos DB connection
├── middleware/
│   ├── auth.ts           # JWT verification & RBAC
│   ├── validate.ts       # Zod validation middleware
│   └── errorHandler.ts   # Global error handler
├── models/
│   ├── User.ts           # User schema
│   └── Post.ts           # Post schema with comments
├── routes/
│   ├── auth.ts           # Authentication routes
│   ├── media.ts          # Media upload routes
│   ├── feed.ts           # Feed & search routes
│   └── posts.ts          # Post interaction routes
├── services/
│   ├── azureStorage.ts   # Azure Blob Storage client
│   ├── azureVision.ts    # Azure AI Vision client
│   └── cache.ts          # Cache service
├── types/
│   ├── shared.ts         # Shared interfaces
│   └── express.d.ts      # Express type augmentation
├── validators/
│   └── schemas.ts        # Zod validation schemas
└── server.ts             # Main application entry point
```

## Type Checking

Run TypeScript type checking without compiling:

```bash
npm run type-check
```

## Deployment to Azure App Service

### Option 1: Manual Deployment

```bash
# Build the application
npm run build

# Create deployment package (include dist/, node_modules/, package.json, .env)
# Upload to Azure App Service via Zip Deploy

# Configure start command in Azure Portal:
node dist/server.js
```

### Option 2: CI/CD Pipeline

Use Azure DevOps or GitHub Actions to automate:
1. Install dependencies
2. Build TypeScript (`npm run build`)
3. Deploy to Azure App Service

## Performance Optimizations

- **Feed Caching**: 30-second TTL reduces Cosmos DB RU consumption
- **Suggestions Caching**: 5-minute TTL for slowly-changing data
- **Atomic Operations**: MongoDB `$inc` and `$addToSet` for likes/comments
- **Indexed Queries**: Database indexes on `creator`, `createdAt`, `tags`, `location`

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **JWT Verification**: Azure AD B2C token validation
- **Role-Based Access**: Creator-only endpoints
- **Input Validation**: Zod runtime validation
- **File Type Validation**: MIME type checking
- **File Size Limits**: 10MB maximum

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment | No (default: development) |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `COSMOS_DB_CONNECTION_STRING` | Cosmos DB connection string | Yes |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name | Yes |
| `AZURE_STORAGE_ACCOUNT_KEY` | Storage account key | Yes |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container name | No (default: media) |
| `AZURE_VISION_ENDPOINT` | AI Vision endpoint | Yes |
| `AZURE_VISION_API_KEY` | AI Vision API key | Yes |
| `CACHE_FEED_TTL` | Feed cache TTL (seconds) | No (default: 30) |
| `CACHE_SUGGESTIONS_TTL` | Suggestions cache TTL (seconds) | No (default: 300) |

## Troubleshooting

### "Cannot find module" errors
- Run `npm install` to install dependencies
- Ensure `node_modules` exists

### TypeScript compilation errors
- Run `npm run type-check` to see detailed errors
- Ensure all dependencies are installed

### Azure connection errors
- Verify all Azure credentials in `.env`
- Check Azure resource firewall rules
- Ensure Cosmos DB allows connections from your IP

### Authentication errors
- Verify JWT_SECRET is set and at least 32 characters
- Check JWT token format and expiration
- Ensure password meets minimum 8 character requirement

## License

ISC


