# Admin User Preservation Guide

## Overview

This document explains how admin users are preserved across different database operations to prevent accidental loss of admin access.

## Admin User Credentials

- **Username:** `admin`
- **Password:** `admin123`
- **Script:** Run `node backend/create-admin.js` to create/recreate admin user

## Places Where Admin Preservation is Implemented

### 1. ✅ Clear Database API Endpoint

**File:** `backend/src/routes/admin/dumpRoutes.ts`

**Endpoint:** `POST /api/admin/clear-database`

**How it works:**

- Fetches all admin users BEFORE deleting anything
- Extracts admin user IDs
- Uses Prisma `where: { userId: { notIn: adminUserIds }}` filters
- Deletes all data except admin users, their roles, and admin table entries

**Safety checks:**

- Returns error if no admin users exist
- Requires confirmation: `{ "confirmation": "DELETE_ALL_DATA" }`
- Returns statistics showing preserved vs deleted counts

**Example response:**

```json
{
  "success": true,
  "message": "Database cleared successfully. Admin users preserved.",
  "details": {
    "preserved": {
      "admins": 1,
      "usernames": ["admin"]
    },
    "deleted": {
      "users": 50,
      "students": 40,
      "teachers": 10,
      "roles": 50
    }
  }
}
```

### 2. ✅ Prisma Seed Script

**File:** `backend/prisma/seed.ts`

**Command:** `npm run seed` or `npx prisma db seed`

**How it works:**

- Checks for existing admin users at the start
- Preserves admin user IDs during deletion
- Uses filtered `deleteMany` operations
- Logs warning if no admins exist

**Example output:**

```
⚠️  Preserving 1 admin user(s) during seed...
✅ Admin users preserved during seed
```

### 3. ❌ OLD Clear Database (DEPRECATED)

**Status:** REPLACED in commit 684614d

**Old implementation:**

```typescript
// ❌ BAD: Dropped ALL tables including admins
DROP TABLE IF EXISTS ... CASCADE
```

**New implementation:**

```typescript
// ✅ GOOD: Selective deletion preserving admins
await prisma.user.deleteMany({
  where: { id: { notIn: adminUserIds } },
});
```

## Database Import Operations

### Database Dump Import

**File:** `backend/src/routes/admin/dumpRoutes.ts`

**Endpoint:** `POST /api/admin/import-dump`

**Important:** When importing a database dump:

1. The dump will INSERT data, potentially causing conflicts
2. If the dump contains users, it may create duplicate key errors
3. **Recommendation:** Clear database first, then import dump
4. Admin will be preserved during clear, then dump data will be added

## Common Scenarios

### Scenario 1: Lost Admin Access After Clear

**Cause:** Used old version of clear-database that used DROP TABLE

**Solution:**

1. Run: `cd backend && node create-admin.js`
2. Login with admin/admin123
3. Ensure you're using the latest version of dumpRoutes.ts

### Scenario 2: Lost Admin After Running Seed

**Cause:** Used old version of seed.ts without admin preservation

**Solution:**

1. Update `backend/prisma/seed.ts` to latest version
2. Run: `cd backend && node create-admin.js`
3. Re-run seed if needed: `npm run seed`

### Scenario 3: Want to Test Clear Database

**Steps:**

1. Ensure admin exists: `node backend/check-admin.js`
2. Create test data: `node backend/verify-admin-preservation.js`
3. Call clear-database API endpoint
4. Verify admin still exists: `node backend/check-admin.js`

## Verification Scripts

### Check if Admin Exists

```bash
cd backend
node check-admin.js
```

### Create Admin User

```bash
cd backend
node create-admin.js
```

### Test Clear Database with Admin Preservation

```bash
cd backend
node test-clear-preserve-admin.js
```

### Setup Test Data and Verify

```bash
cd backend
node verify-admin-preservation.js
```

## Schema Relationships

### Admin Table Structure

```prisma
model Admin {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Key Points:**

- Admin has `onDelete: Cascade` from User
- If User is deleted, Admin is automatically deleted
- Therefore, we MUST preserve User records for admins
- We preserve by using `where: { id: { notIn: adminUserIds }}`

### Role Assignment Structure

```prisma
model UserRoleAssignment {
  userId String
  role   user_role
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([userId, role])
}
```

**Key Points:**

- Admin users have a role of "admin" in this table
- Must also preserve role assignments for admin users
- Use `where: { userId: { notIn: adminUserIds }}`

## Best Practices

### ✅ DO:

- Always check for admin users before bulk deletions
- Use filtered `deleteMany` with `notIn: adminUserIds`
- Log preserved admin usernames for transparency
- Return error if no admins exist before clearing
- Test admin preservation after any database operation

### ❌ DON'T:

- Use `DROP TABLE` commands that affect admin tables
- Use unfiltered `deleteMany()` on users table
- Run migrations that remove admin-related tables without backup
- Clear database without checking admin existence first
- Use `TRUNCATE` commands on user-related tables

## Troubleshooting

### Admin Not Logging In After Clear

1. Check if admin exists: `node backend/check-admin.js`
2. If empty, recreate: `node backend/create-admin.js`
3. Clear browser cookies and try login again
4. Check backend logs for authentication errors

### Clear Database Returns Error

**Error:** "Cannot clear database: No admin users found"

**Solution:** Run `node backend/create-admin.js` first

### Import Dump Fails with Duplicate Keys

**Cause:** Trying to import data when admin already exists

**Solution:**

1. Export your current data if needed
2. Clear database (preserves admin)
3. Import the dump (may overwrite admin with dump's admin)
4. If admin login fails, run create-admin.js again

## Migration Considerations

When creating new migrations:

1. Never add `onDelete: Cascade` from critical tables TO admin/user tables
2. If modifying admin table, test preservation scripts
3. Document any new relationships that could affect admin deletion
4. Update this guide if admin preservation logic changes

## Future Improvements

Potential enhancements:

- [ ] Add UI confirmation showing which admins will be preserved
- [ ] Add ability to export/import just admin users separately
- [ ] Add backup/restore functionality for admin table specifically
- [ ] Add warning in UI if only 1 admin exists (preventing accidental lockout)
- [ ] Add audit log of database clear operations

## Questions?

If admin users are being deleted unexpectedly:

1. Check all places listed in this document
2. Search codebase for: `user.deleteMany`, `admin.deleteMany`, `DROP TABLE`, `TRUNCATE`
3. Check seed scripts and migration files
4. Review recent git commits for database operation changes
