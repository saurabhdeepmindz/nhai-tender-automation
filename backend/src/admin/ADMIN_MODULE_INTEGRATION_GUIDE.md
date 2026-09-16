# 🎯 Admin Module - Quick Integration Guide

**NHAI Tender Query Automation System**  
**Admin Module Files for Backend**

---

## 📦 **Files Provided**

You have **2 admin module files** ready to use:

1. **admin.module.ts** - Admin module configuration
2. **admin-vectorization.controller.ts** - Admin API controller

---

## 📂 **File Structure & Placement**

```
backend/
└── src/
    ├── app.module.ts                        ← Already configured (imports AdminModule)
    │
    └── admin/
        ├── admin.module.ts                  ← Copy here
        └── controllers/
            └── admin-vectorization.controller.ts  ← Copy here
```

---

## 🚀 **Quick Setup (3 Steps)**

### **Step 1: Create Directory Structure**

```bash
cd backend/src

# Create admin directory structure
mkdir -p admin/controllers
```

### **Step 2: Copy Files**

```bash
# Copy admin.module.ts
cp admin.module.ts src/admin/admin.module.ts

# Copy admin-vectorization.controller.ts
cp admin-vectorization.controller.ts src/admin/controllers/admin-vectorization.controller.ts
```

### **Step 3: Verify Import in app.module.ts**

The `app.module.ts` already includes the AdminModule import:

```typescript
// In app.module.ts
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // ... other imports
    AdminModule,  // ← This should be present
  ],
})
export class AppModule {}
```

---

## ✅ **Verification**

After copying files, verify the structure:

```bash
# Check files exist
ls -la src/admin/
ls -la src/admin/controllers/
```

**Expected output:**
```
src/admin/
  admin.module.ts
  controllers/
    admin-vectorization.controller.ts
```

---

## 📊 **Admin Module Overview**

### **admin.module.ts**

**Purpose:** Configures the admin functionality module

**Imports:**
- TypeOrmModule (Query, VectorizationLog entities)
- HttpModule (for Python service calls)
- ConfigModule (environment variables)

**Controllers:**
- AdminVectorizationController

**Providers:**
- QueryVectorizationJob
- VectorizationService

**Code Structure:**
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Query, VectorizationLog]),
    HttpModule.register({ timeout: 30000 }),
    ConfigModule,
  ],
  controllers: [AdminVectorizationController],
  providers: [QueryVectorizationJob, VectorizationService],
})
export class AdminModule {}
```

---

### **admin-vectorization.controller.ts**

**Purpose:** Provides admin REST API endpoints for vectorization control

**Endpoints (11 total):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/vectorization/stats` | GET | Vectorization statistics |
| `/api/admin/vectorization/queries` | GET | All queries with status |
| `/api/admin/vectorization/queries/pending` | GET | Pending queries only |
| `/api/admin/vectorization/logs` | GET | Vectorization logs |
| `/api/admin/vectorization/metrics` | GET | Performance metrics |
| `/api/admin/vectorization/job/config` | GET | Job configuration |
| `/api/admin/vectorization/job/pause` | POST | Pause background job |
| `/api/admin/vectorization/job/resume` | POST | Resume background job |
| `/api/admin/vectorization/job/run-now` | POST | Trigger job manually |
| `/api/admin/vectorization/job/revectorize-all` | POST | Re-vectorize all queries |
| `/api/admin/vectorization/dashboard` | GET | Complete dashboard data |

**Security:**
- JWT authentication required
- Role-based access (ADMIN, CHIEF_ENGINEER only)
- Protected with guards

**Code Structure:**
```typescript
@ApiTags('Admin - Vectorization')
@ApiBearerAuth()
@Controller('api/admin/vectorization')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CHIEF_ENGINEER)
export class AdminVectorizationController {
  // 11 endpoint methods
}
```

---

## 🔗 **Dependencies**

### **Required Modules (Must Exist):**

✅ **Vectorization Module:**
```
src/vectorization/
  ├── vectorization.module.ts
  ├── vectorization.service.ts
  └── entities/
      └── vectorization-log.entity.ts
```

✅ **Background Job:**
```
src/jobs/
  └── query-vectorization.job.ts
```

✅ **Query Module:**
```
src/queries/
  └── entities/
      └── query.entity.ts
```

✅ **Auth Module:**
```
src/auth/
  ├── guards/
  │   ├── jwt-auth.guard.ts
  │   └── roles.guard.ts
  └── decorators/
      └── roles.decorator.ts
```

✅ **Users Module:**
```
src/users/
  └── enums/
      └── user-role.enum.ts
```

---

## 🧪 **Testing Admin Endpoints**

### **1. Get Vectorization Stats**

```bash
curl -X GET http://localhost:3000/api/admin/vectorization/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1245,
    "vectorized": 1180,
    "pending": 65,
    "percentage": 94.78
  }
}
```

### **2. Pause Background Job**

```bash
curl -X POST http://localhost:3000/api/admin/vectorization/job/pause \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Background job paused successfully"
}
```

### **3. Get Dashboard Data**

```bash
curl -X GET http://localhost:3000/api/admin/vectorization/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": { "total": 1245, "vectorized": 1180, ... },
    "pending": 65,
    "failed": 3,
    "performance": { "last24Hours": { ... } },
    "jobStatus": { "enabled": true, "batchSize": 10, ... }
  }
}
```

---

## 🔧 **Integration with Frontend**

The admin module provides the backend API for the frontend admin panel:

```
Frontend Admin Panel (Next.js)
  └── /admin/vectorization-control/page.tsx
      ↓ HTTP requests
Backend Admin Module (NestJS)
  └── AdminVectorizationController
      ├── GET /stats
      ├── GET /queries
      ├── POST /job/pause
      └── POST /job/resume
```

---

## 🐛 **Troubleshooting**

### **Issue: "Cannot find module './admin/admin.module'"**

**Solution:**
```bash
# Verify file exists
ls src/admin/admin.module.ts

# Check app.module.ts import path
# Should be: import { AdminModule } from './admin/admin.module';
```

### **Issue: "Cannot find module '../../auth/guards/jwt-auth.guard'"**

**Solution:**
```bash
# Verify auth module exists
ls src/auth/guards/jwt-auth.guard.ts

# If missing, create auth guards (separate task)
```

### **Issue: "QueryVectorizationJob is not a provider"**

**Solution:**
```bash
# Verify job file exists
ls src/jobs/query-vectorization.job.ts

# Verify VectorizationService exists
ls src/vectorization/vectorization.service.ts
```

### **Issue: "401 Unauthorized" when testing endpoints**

**Solution:**
```bash
# Generate JWT token first
# Login endpoint: POST /api/auth/login
# Use token in Authorization header: Bearer <token>

# Verify user has ADMIN or CHIEF_ENGINEER role
```

---

## ✅ **Complete Checklist**

**File Structure:**
- [ ] admin/ directory created
- [ ] admin/controllers/ directory created
- [ ] admin.module.ts copied to admin/
- [ ] admin-vectorization.controller.ts copied to admin/controllers/

**Dependencies:**
- [ ] VectorizationModule exists
- [ ] QueryVectorizationJob exists
- [ ] Query entity exists
- [ ] VectorizationLog entity exists
- [ ] Auth guards exist

**Configuration:**
- [ ] AdminModule imported in app.module.ts
- [ ] TypeORM entities registered
- [ ] JWT authentication configured

**Testing:**
- [ ] Backend starts without errors
- [ ] Admin endpoints appear in Swagger docs
- [ ] Can access with admin JWT token
- [ ] Stats endpoint returns data
- [ ] Job control works (pause/resume)

---

## 🎉 **Success Indicators**

When everything is set up correctly:

```
✓ Files in correct locations
✓ No import errors on startup
✓ Swagger shows Admin - Vectorization tag
✓ 11 admin endpoints available
✓ JWT authentication working
✓ Can pause/resume vectorization job
✓ Statistics endpoint returns data
```

---

## 📚 **Related Files**

These admin files work with:
- `query-vectorization.job.ts` - Background job
- `vectorization.service.ts` - Vectorization service
- `vectorization.controller.ts` - Public vectorization endpoints
- `app.module.ts` - Main application module

---

## 🎯 **Next Steps**

After setting up admin module:

1. **Test all endpoints** with Swagger UI
2. **Connect frontend** admin panel
3. **Configure user roles** (ADMIN, CHIEF_ENGINEER)
4. **Test job control** (pause/resume)
5. **Monitor logs** for errors
6. **Verify statistics** are accurate

---

**Files:** 2 admin module files  
**Endpoints:** 11 REST API endpoints  
**Authentication:** JWT + Role-based  
**Status:** Ready to Use ✅
