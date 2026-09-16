# 🔧 Migration Script Error - Complete Fix Guide

**Error:** `npm error Missing script: "migration:run"`

---

## ⚠️ **Problem**

Your `package.json` is missing the migration scripts.

---

## ✅ **Solution 1: Add Scripts to package.json (Quick Fix)**

### **Step 1: Open package.json**

```bash
# In backend directory
notepad package.json  # Windows
nano package.json     # Linux/Mac
```

### **Step 2: Find the "scripts" section**

Look for:
```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    // ... other scripts
  }
}
```

### **Step 3: Add these migration scripts**

Add these lines to the "scripts" section:

```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "build": "nest build",
    
    // ADD THESE LINES ↓
    "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js",
    "migration:run": "npm run typeorm -- migration:run -d ./src/config/typeorm.config.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d ./src/config/typeorm.config.ts",
    "migration:show": "npm run typeorm -- migration:show -d ./src/config/typeorm.config.ts",
    "migration:generate": "npm run typeorm -- migration:generate",
    "migration:create": "npm run typeorm -- migration:create"
  }
}
```

### **Step 4: Save and test**

```bash
# Verify script is now available
npm run migration:run
```

---

## ✅ **Solution 2: Replace Entire package.json (Recommended)**

I've provided a complete fixed package.json file.

### **Step 1: Backup current package.json**

```bash
cd backend
cp package.json package.json.backup
```

### **Step 2: Replace with fixed version**

Copy the provided `package-fixed.json` to `package.json`:

```bash
# Copy the fixed file
cp package-fixed.json package.json
```

### **Step 3: Reinstall dependencies**

```bash
npm install
```

### **Step 4: Run migration**

```bash
npm run migration:run
```

---

## ✅ **Solution 3: Create TypeORM Config File**

The migration scripts reference a config file. Create it:

### **Step 1: Create config directory**

```bash
cd backend/src
mkdir -p config
```

### **Step 2: Create typeorm.config.ts**

**File:** `backend/src/config/typeorm.config.ts`

Copy the provided `typeorm.config.ts` file to this location.

### **Step 3: Install required package**

```bash
npm install dotenv
```

### **Step 4: Verify .env file**

Make sure `backend/.env` has database config:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nhai_tender_db
```

---

## ✅ **Solution 4: Use TypeORM CLI Directly (Alternative)**

If you just want to run the migration without fixing package.json:

### **Option A: Using npx**

```bash
npx typeorm migration:run -d ./src/config/typeorm.config.ts
```

### **Option B: Using ts-node directly**

```bash
npx ts-node ./node_modules/typeorm/cli.js migration:run -d ./src/config/typeorm.config.ts
```

### **Option C: Simple TypeORM command (if config is in root)**

```bash
npx typeorm-ts-node-commonjs migration:run
```

---

## 📋 **Complete Setup Checklist**

Follow these steps in order:

### **1. Install Required Packages**

```bash
cd backend

# Install TypeScript and TypeORM dependencies
npm install --save-dev ts-node tsconfig-paths @types/node

# Install dotenv for config
npm install dotenv
```

### **2. Create/Update package.json Scripts**

Add the migration scripts shown in Solution 1, or use the complete fixed package.json.

### **3. Create TypeORM Config**

Create `backend/src/config/typeorm.config.ts` with the provided content.

### **4. Verify Migration File Location**

```bash
# Check migration file exists
ls src/migrations/1705847291000-AddVectorizationSupport.ts
```

Should show the file. If not, copy it to the correct location.

### **5. Verify Database Connection**

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d nhai_tender_db
```

If connection fails, start PostgreSQL:
- Windows: Start PostgreSQL service
- Linux: `sudo systemctl start postgresql`

### **6. Run Migration**

```bash
npm run migration:run
```

---

## 🎯 **Quick Fix (Copy-Paste)**

**Complete fixed package.json scripts section:**

```json
{
  "name": "nhai-tender-automation-backend",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js",
    "migration:run": "npm run typeorm -- migration:run -d ./src/config/typeorm.config.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d ./src/config/typeorm.config.ts",
    "migration:show": "npm run typeorm -- migration:show -d ./src/config/typeorm.config.ts",
    "migration:generate": "npm run typeorm -- migration:generate",
    "migration:create": "npm run typeorm -- migration:create"
  }
}
```

---

## 🐛 **Troubleshooting**

### **Issue: "Cannot find module 'ts-node'"**

**Solution:**
```bash
npm install --save-dev ts-node tsconfig-paths
```

---

### **Issue: "Cannot find module 'dotenv'"**

**Solution:**
```bash
npm install dotenv
```

---

### **Issue: "Cannot find config file"**

**Error:**
```
Error: Cannot find module './src/config/typeorm.config.ts'
```

**Solution:**

**Option 1:** Create the config file (provided in this prompt)

**Option 2:** Use simplified command without config:
```bash
# Edit package.json scripts to:
"migration:run": "typeorm-ts-node-commonjs migration:run"
```

---

### **Issue: Still getting "Missing script" error**

**Solution:**

1. **Check you saved package.json:**
```bash
# View the scripts section
cat package.json | grep -A 10 "scripts"
```

2. **Verify format is correct:**
- Scripts must be inside "scripts" object
- Each line must end with comma (except last)
- Proper JSON formatting

3. **Try clearing npm cache:**
```bash
npm cache clean --force
npm install
```

---

## 📁 **Required File Structure**

After setup, you should have:

```
backend/
├── package.json                    ← Has migration scripts
├── .env                           ← Database config
├── node_modules/                  ← Dependencies
└── src/
    ├── config/
    │   └── typeorm.config.ts      ← TypeORM config
    └── migrations/
        └── 1705847291000-AddVectorizationSupport.ts
```

---

## ✅ **Verification Steps**

After fixing:

```bash
# 1. Check script is available
npm run

# Should list:
# - migration:run
# - migration:revert
# - migration:show

# 2. Try running migration
npm run migration:run

# Expected output:
# query: CREATE TABLE "vectorization_logs" ...
# Migration has been executed successfully.

# 3. Verify in database
psql -U postgres -d nhai_tender_db
\d queries
# Should show: vectorized | boolean
```

---

## 🎯 **Recommended Fix (Step-by-Step)**

**The fastest way to fix this:**

```bash
# 1. Go to backend directory
cd backend

# 2. Install required packages
npm install --save-dev ts-node tsconfig-paths
npm install dotenv

# 3. Create config directory
mkdir -p src/config

# 4. Copy typeorm.config.ts to src/config/
# (Use the file provided in this prompt)

# 5. Update package.json with migration scripts
# (Use the scripts from Solution 1)

# 6. Run migration
npm run migration:run
```

---

## 📦 **Files Provided in This Fix**

1. **package-fixed.json** - Complete package.json with all scripts
2. **typeorm.config.ts** - TypeORM configuration for migrations

**How to use:**

```bash
# Copy fixed package.json
cp package-fixed.json package.json

# Create config directory
mkdir -p src/config

# Copy typeorm config
cp typeorm.config.ts src/config/

# Install dependencies
npm install

# Run migration
npm run migration:run
```

---

## 🎉 **Success Indicators**

When fixed correctly:

```
✓ npm run shows migration:run in list
✓ No "Missing script" error
✓ Migration executes successfully
✓ Database tables updated
✓ Vectorization columns exist
```

---

**Quick Command Summary:**

```bash
# Fix package.json (add scripts)
# Fix typeorm.config.ts (create file)
# Install dependencies
npm install --save-dev ts-node tsconfig-paths
npm install dotenv

# Run migration
npm run migration:run
```

Done! ✅
