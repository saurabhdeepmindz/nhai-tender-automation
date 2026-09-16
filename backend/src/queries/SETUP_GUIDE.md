# 🚀 Queries Module - Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 15+ installed
- NestJS project initialized

---

## Step-by-Step Setup (5 minutes)

### 1. Copy Files to Your Project

```bash
# Navigate to your NestJS project root
cd your-nestjs-project

# Create queries module directory structure
mkdir -p src/queries/{dtos,entities,controllers,services,database}

# Copy all files (adjust paths as needed)
# Or manually copy from the provided files
```

### 2. Install Required Dependencies

```bash
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/swagger class-validator class-transformer
npm install --save-dev @types/node
```

### 3. Update Your Database Configuration

Edit `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueriesModule } from './queries/queries.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'nhai_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Never use true in production!
    }),
    QueriesModule,
  ],
})
export class AppModule {}
```

### 4. Create Environment File

Create `.env` in project root:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=nhai_db

# Application
PORT=3000
NODE_ENV=development
```

### 5. Run Database Migration

```bash
# Connect to PostgreSQL
psql -U postgres -d nhai_db

# Run the migration script
\i src/queries/database/001_queries_migration.sql

# Verify table creation
\dt queries
\d queries
```

Alternatively, use a migration tool:

```bash
# If using TypeORM CLI
npx typeorm migration:run
```

### 6. Enable Swagger (Optional but Recommended)

Edit `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('NHAI Tender Query System')
    .setDescription('API documentation for Queries Module')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
```

### 7. Start the Application

```bash
npm run start:dev
```

### 8. Test the API

Open your browser and visit:
- **API**: http://localhost:3000/queries
- **Swagger UI**: http://localhost:3000/api/docs

---

## ✅ Verification Checklist

Run these commands to verify everything is working:

```bash
# 1. Check if server is running
curl http://localhost:3000/queries/statistics

# 2. Create a test query
curl -X POST http://localhost:3000/queries \
  -H "Content-Type: application/json" \
  -d '{
    "rfpId": "123e4567-e89b-12d3-a456-426614174000",
    "category": "technical",
    "queryText": "What is the minimum experience required?"
  }'

# 3. Get all queries
curl http://localhost:3000/queries?page=1&pageSize=10

# 4. Get statistics
curl http://localhost:3000/queries/statistics
```

Expected responses:
- ✅ All endpoints return JSON
- ✅ Statistics show counts
- ✅ Create returns 201 with query object
- ✅ No 500 errors

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot connect to database"
**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify connection
psql -U postgres -c "SELECT version();"
```

### Issue 2: "Module not found: @nestjs/typeorm"
**Solution:**
```bash
npm install @nestjs/typeorm typeorm pg --save
```

### Issue 3: "Validation failed"
**Solution:**
```bash
npm install class-validator class-transformer --save
```

### Issue 4: Table doesn't exist
**Solution:**
```bash
# Run the migration again
psql -U postgres -d nhai_db -f src/queries/database/001_queries_migration.sql
```

### Issue 5: Port already in use
**Solution:**
```bash
# Change port in .env
PORT=3001

# Or kill the process using the port
lsof -ti:3000 | xargs kill -9
```

---

## 🎯 Next Steps

1. **Add Authentication**
   - Implement JWT auth guard
   - Uncomment `@UseGuards(JwtAuthGuard)` in controller

2. **Test Endpoints**
   - Use Swagger UI for manual testing
   - Write unit tests for service
   - Write e2e tests for controller

3. **Connect to Frontend**
   - Use the API endpoints from Next.js
   - Handle responses and errors

4. **Integrate with RAG Service**
   - Set up Python FastAPI service
   - Configure webhook callbacks

5. **Add File Upload**
   - Implement file upload endpoint
   - Store files in configured directory
   - Update attachment URLs

---

## 📞 Need Help?

- Check the main **README.md** for detailed documentation
- Review **Swagger UI** for API specifications
- Check NestJS logs for error details
- Verify database connection and migrations

---

## 🎉 Setup Complete!

You now have a fully functional Queries module with:
- ✅ CRUD operations
- ✅ Filtering and pagination
- ✅ Statistics endpoint
- ✅ AI response integration
- ✅ Database with indexes
- ✅ Swagger documentation
- ✅ Type safety with TypeScript
- ✅ Validation with class-validator

**Time to test**: Visit http://localhost:3000/api/docs and start making requests! 🚀
