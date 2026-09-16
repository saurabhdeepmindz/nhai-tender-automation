# 🚀 NHAI Backend Setup Guide - Complete Configuration

**NHAI Tender Query Automation System**  
**Backend (NestJS) Complete Setup Instructions**

---

## 📦 **Files Provided**

You now have **4 essential backend configuration files**:

1. **app.module.ts** - Main application module with all imports
2. **main.ts** - Bootstrap file that starts the application
3. **backend-env-example.txt** - Environment configuration template
4. **package.json** - Dependencies and scripts

---

## 📂 **File Placement**

Copy files to your NestJS backend project:

```
backend/
├── src/
│   ├── app.module.ts                    ← Copy here (MAIN FILE)
│   ├── main.ts                          ← Copy here
│   │
│   ├── admin/
│   │   ├── admin.module.ts
│   │   └── controllers/
│   │       └── admin-vectorization.controller.ts
│   │
│   ├── vectorization/
│   │   ├── vectorization.module.ts
│   │   ├── vectorization.service.ts
│   │   ├── vectorization.controller.ts
│   │   └── entities/
│   │       └── vectorization-log.entity.ts
│   │
│   ├── jobs/
│   │   └── query-vectorization.job.ts
│   │
│   ├── auth/
│   ├── users/
│   ├── rfps/
│   ├── queries/
│   ├── categories/
│   ├── historical-data/
│   ├── prebid-query/
│   └── ai-responses/
│
├── .env                                 ← Create from backend-env-example.txt
├── package.json                         ← Copy here (or merge)
└── uploads/                             ← Create this folder
```

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Copy Configuration Files**

```bash
cd backend

# Copy app.module.ts
cp app.module.ts src/app.module.ts

# Copy main.ts
cp main.ts src/main.ts

# Create .env from example
cp backend-env-example.txt .env

# Edit .env with your actual values
notepad .env  # Windows
nano .env     # Linux/Mac
```

### **Step 2: Install Dependencies**

```bash
# Install all NestJS packages
npm install

# Install additional required packages
npm install @nestjs/schedule
npm install @nestjs/axios
npm install @nestjs/throttler
npm install @nestjs/serve-static
npm install compression
npm install helmet
```

### **Step 3: Configure Environment Variables**

Edit `.env` file and update these critical values:

```bash
# Database (Required)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_actual_password
DB_DATABASE=nhai_tender_db

# JWT Secret (Required - Change this!)
JWT_SECRET=your_super_secret_key_minimum_32_characters_long

# Python Services (Required)
SCREEN7_URL=http://localhost:8000
SCREEN8_URL=http://localhost:8001

# Vectorization (Optional - defaults work)
VECTORIZATION_ENABLED=true
VECTORIZATION_BATCH_SIZE=10
```

### **Step 4: Create Upload Directory**

```bash
# Windows
mkdir uploads

# Linux/Mac
mkdir -p uploads
chmod 755 uploads
```

### **Step 5: Run Database Migrations**

```bash
# Generate migration (if needed)
npm run migration:generate -- AddVectorizationSupport

# Run migrations
npm run migration:run
```

### **Step 6: Start the Backend**

```bash
# Development mode (with hot reload)
npm run start:dev
```

**Expected output:**
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] VectorizationModule dependencies initialized
[Nest] LOG [InstanceLoader] AdminModule dependencies initialized
[Nest] LOG [SchedulerRegistry] Registering cron job: query-vectorization
[Nest] LOG [Bootstrap] ============================================
[Nest] LOG [Bootstrap] NHAI Tender Query Automation System
[Nest] LOG [Bootstrap] ============================================
[Nest] LOG [Bootstrap] Environment: development
[Nest] LOG [Bootstrap] Server running on: http://localhost:3000
[Nest] LOG [Bootstrap] API endpoints: http://localhost:3000/api
[Nest] LOG [Bootstrap] API documentation: http://localhost:3000/api/docs
[Nest] LOG [Bootstrap] ============================================
```

---

## ✅ **Verification**

### **Test 1: Health Check**

```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T10:30:00.000Z"
}
```

### **Test 2: Swagger Documentation**

Open in browser:
```
http://localhost:3000/api/docs
```

Should see Swagger UI with all API endpoints.

### **Test 3: Vectorization Job Running**

Check logs for:
```
[Nest] LOG [QueryVectorizationJob] Query Vectorization Job initialized
[Nest] LOG [QueryVectorizationJob] Batch size: 10
[Nest] LOG [QueryVectorizationJob] Schedule: Every 5 minutes
```

### **Test 4: Admin Endpoints**

```bash
# Get vectorization stats (requires JWT token)
curl -X GET http://localhost:3000/api/admin/vectorization/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 **Module Structure**

### **Modules Included in app.module.ts:**

| Module | Purpose | Location |
|--------|---------|----------|
| **ConfigModule** | Environment configuration | Global |
| **ScheduleModule** | Cron jobs for background tasks | Global |
| **TypeOrmModule** | PostgreSQL database | Global |
| **ThrottlerModule** | Rate limiting | Global |
| **ServeStaticModule** | File uploads | Global |
| **AuthModule** | Authentication & JWT | `/auth` |
| **UsersModule** | User management | `/users` |
| **RfpsModule** | RFP management | `/rfps` |
| **QueriesModule** | Query management | `/queries` |
| **CategoriesModule** | Category management | `/categories` |
| **HistoricalDataModule** | Historical data (Screen 7) | `/historical-data` |
| **PrebidQueryModule** | Pre-bid queries (Screen 8) | `/prebid-query` |
| **AiResponsesModule** | AI response storage | `/ai-responses` |
| **VectorizationModule** | Query vectorization | `/vectorization` |
| **AdminModule** | Admin control panel | `/admin` |

### **Background Jobs:**

| Job | Schedule | Purpose |
|-----|----------|---------|
| **QueryVectorizationJob** | Every 5 minutes | Auto-vectorize queries |

---

## 🔧 **Configuration Options**

### **Database Configuration:**

```typescript
// In app.module.ts, TypeOrmModule.forRootAsync()
{
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'password',
  database: 'nhai_tender_db',
  entities: [/* All entities */],
  synchronize: false,  // NEVER true in production!
  logging: false,
  ssl: false,
}
```

### **CORS Configuration:**

```typescript
// In main.ts
app.enableCors({
  origin: 'http://localhost:3001',  // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
```

### **Rate Limiting:**

```typescript
// In app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60000,    // 60 seconds
  limit: 100,    // 100 requests per minute
}])
```

---

## 🐛 **Troubleshooting**

### **Issue 1: "Cannot find module"**

```bash
# Install missing dependencies
npm install

# Check if all modules are imported correctly in app.module.ts
```

### **Issue 2: "ScheduleModule is not a module"**

```bash
# Install @nestjs/schedule
npm install @nestjs/schedule

# Verify import in app.module.ts:
import { ScheduleModule } from '@nestjs/schedule';
```

### **Issue 3: "Database connection failed"**

```bash
# Check PostgreSQL is running
# Windows: Check Services
# Linux: sudo systemctl status postgresql

# Verify .env database credentials
# Test connection:
psql -h localhost -U postgres -d nhai_tender_db
```

### **Issue 4: "VectorizationModule not found"**

```bash
# Make sure vectorization files are in place:
backend/src/vectorization/
  ├── vectorization.module.ts
  ├── vectorization.service.ts
  ├── vectorization.controller.ts
  └── entities/
      └── vectorization-log.entity.ts

# Also check:
backend/src/jobs/query-vectorization.job.ts
```

### **Issue 5: "AdminModule not found"**

```bash
# Make sure admin files are in place:
backend/src/admin/
  ├── admin.module.ts
  └── controllers/
      └── admin-vectorization.controller.ts
```

### **Issue 6: Port already in use**

```bash
# Windows: Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill
```

---

## 📝 **Environment Variables Reference**

### **Required Variables:**

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nhai_tender_db

# JWT
JWT_SECRET=your_secret_minimum_32_chars

# Python Services
SCREEN7_URL=http://localhost:8000
SCREEN8_URL=http://localhost:8001
```

### **Optional Variables (with defaults):**

```bash
# Application
NODE_ENV=development
PORT=3000

# Vectorization
VECTORIZATION_ENABLED=true
VECTORIZATION_BATCH_SIZE=10
VECTORIZATION_TIMEOUT=30000

# CORS
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3001

# Uploads
MAX_FILE_SIZE=52428800  # 50MB
```

---

## 🚀 **Production Deployment**

### **Before deploying to production:**

1. **Update .env for production:**
```bash
NODE_ENV=production
DB_SYNCHRONIZE=false
DB_SSL=true
JWT_SECRET=<generate-strong-secret>
CORS_ORIGIN=https://your-domain.com
```

2. **Build the application:**
```bash
npm run build
```

3. **Run migrations:**
```bash
npm run migration:run
```

4. **Start production server:**
```bash
npm run start:prod
```

5. **Use process manager (PM2):**
```bash
npm install -g pm2
pm2 start dist/main.js --name nhai-backend
pm2 save
pm2 startup
```

---

## 📊 **API Endpoints**

### **Core Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/queries` | GET/POST | Query management |
| `/api/rfps` | GET/POST | RFP management |

### **Vectorization Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vectorization/query/:id` | POST | Vectorize single query |
| `/api/vectorization/batch` | POST | Batch vectorize |
| `/api/vectorization/failures` | GET | Get failed vectorizations |

### **Admin Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/vectorization/stats` | GET | Vectorization statistics |
| `/api/admin/vectorization/queries` | GET | All queries with status |
| `/api/admin/vectorization/job/pause` | POST | Pause background job |
| `/api/admin/vectorization/job/resume` | POST | Resume background job |

**View all endpoints:** http://localhost:3000/api/docs

---

## ✅ **Complete Setup Checklist**

### **Files:**
- [x] app.module.ts copied to src/
- [x] main.ts copied to src/
- [x] .env created and configured
- [x] package.json dependencies installed
- [x] uploads/ directory created

### **Modules:**
- [x] VectorizationModule files in place
- [x] AdminModule files in place
- [x] QueryVectorizationJob file in place
- [x] All entity files exist

### **Configuration:**
- [x] Database credentials in .env
- [x] JWT secret configured
- [x] Python service URLs configured
- [x] CORS origin set correctly

### **Services:**
- [x] PostgreSQL running
- [x] Database created
- [x] Migrations run
- [x] Backend starts without errors
- [x] Swagger docs accessible
- [x] Vectorization job initialized

---

## 🎉 **Success!**

When everything is set up correctly, you should see:

```
✓ Backend running on http://localhost:3000
✓ API docs at http://localhost:3000/api/docs
✓ Database connected
✓ Vectorization job running every 5 minutes
✓ Admin endpoints available
✓ All modules loaded successfully
```

---

**Status:** Backend Configuration Complete ✅  
**Files:** 4 essential files provided  
**Modules:** 11 feature modules + 2 vectorization modules  
**Endpoints:** 50+ REST API endpoints  
**Background Jobs:** Automatic query vectorization
