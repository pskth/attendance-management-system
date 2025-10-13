# Excel Import Feature

## Overview

A complete Excel/CSV data import system has been added to the admin dashboard, allowing bulk data uploads with clear format instructions and validation.

## What Was Added

### 1. Backend API Route

**File**: `backend/src/routes/admin/excelImportRoutes.ts`

- **Endpoint**: `POST /api/admin/import-excel/:type`
- **Supported Types**: colleges, departments, sections, users, students, teachers, courses, academic_years
- **Features**:
  - File upload via multer (supports .xlsx, .xls, .csv)
  - Natural key lookups (uses codes instead of UUIDs)
  - Upsert logic (creates new or updates existing records)
  - Error collection per row (continues processing on failures)
  - Default password: `password123` for all users
  - Bcrypt password hashing

### 2. Frontend UI Component

**File**: `frontend/src/app/admin/database-setup-excel.tsx`

- **Features**:
  - Step-by-step import instructions
  - Download template buttons for each data type
  - Expandable format details showing all columns
  - File upload with drag-and-drop styling
  - Success/error feedback with detailed messages
  - Visual indicators for required fields
  - Numbered steps showing recommended import order

### 3. Admin Dashboard Integration

**File**: `frontend/src/app/admin/page.tsx`

- Added new "Excel Import" tab alongside existing tabs
- Renamed "Database Setup" to "Database Setup (CSV)" for clarity
- Tab grid expanded from 5 to 6 columns

### 4. Route Registration

**File**: `backend/src/routes/admin/index.ts`

- Imported and registered `excelImportRoutes`
- Routes are protected by admin authentication middleware

## Excel File Formats

### 1. Colleges

| Column | Type | Required | Example                      |
| ------ | ---- | -------- | ---------------------------- |
| code   | Text | ✓        | NMAMIT                       |
| name   | Text | ✓        | NMAM Institute of Technology |

### 2. Departments

| Column       | Type | Required | Example                          |
| ------------ | ---- | -------- | -------------------------------- |
| college_code | Text | ✓        | NMAMIT                           |
| code         | Text | ✓        | CS                               |
| name         | Text | ✓        | Computer Science and Engineering |

### 3. Sections

| Column          | Type | Required | Example |
| --------------- | ---- | -------- | ------- |
| college_code    | Text | ✓        | NMAMIT  |
| department_code | Text | ✓        | CS      |
| section_name    | Text | ✓        | A       |

### 4. Users

| Column   | Type | Required | Example           |
| -------- | ---- | -------- | ----------------- |
| username | Text | ✓        | NNM23CSA01        |
| name     | Text | ✓        | Rahul Kumar       |
| email    | Text | ○        | rahul@example.com |
| phone    | Text | ○        | 9876543210        |
| role     | Text | ✓        | student           |

**Note**: All users are created with password: `password123`

### 5. Students

| Column          | Type   | Required | Example    |
| --------------- | ------ | -------- | ---------- |
| usn             | Text   | ✓        | NNM23CSA01 |
| college_code    | Text   | ✓        | NMAMIT     |
| department_code | Text   | ✓        | CS         |
| section         | Text   | ✓        | A          |
| semester        | Number | ✓        | 5          |
| batch_year      | Number | ✓        | 2023       |

### 6. Teachers

| Column          | Type | Required | Example  |
| --------------- | ---- | -------- | -------- |
| username        | Text | ✓        | teacher1 |
| college_code    | Text | ✓        | NMAMIT   |
| department_code | Text | ✓        | CS       |

### 7. Courses

| Column          | Type    | Required | Example         |
| --------------- | ------- | -------- | --------------- |
| college_code    | Text    | ✓        | NMAMIT          |
| department_code | Text    | ✓        | CS              |
| code            | Text    | ✓        | CS301           |
| name            | Text    | ✓        | Data Structures |
| type            | Text    | ✓        | core            |
| year            | Number  | ✓        | 3               |
| has_theory      | Boolean | ✓        | true            |
| has_lab         | Boolean | ✓        | true            |

**Course Types**: core, department_elective, open_elective

### 8. Academic Years

| Column       | Type | Required | Example    |
| ------------ | ---- | -------- | ---------- |
| college_code | Text | ✓        | NMAMIT     |
| year_name    | Text | ✓        | 2024-2025  |
| start_date   | Date | ✓        | 2024-08-01 |
| end_date     | Date | ✓        | 2025-07-31 |

## How to Use

### Step 1: Access Excel Import

1. Login as admin
2. Navigate to Admin Dashboard
3. Click on "Excel Import" tab

### Step 2: Download Template

- Click "Download Template" button for the data type you want to import
- Opens a CSV file with correct column headers and one sample row

### Step 3: Fill Your Data

- Open the template in Excel or Google Sheets
- Replace the sample row with your actual data
- Add as many rows as needed
- Save as .xlsx or .csv format

### Step 4: Upload and Import

- Click the upload area or select file
- Click "Import" button
- View the results showing records processed and any errors

## Import Order (Important!)

Follow this sequence to maintain referential integrity:

1. **Colleges** - Must be imported first
2. **Departments** - Requires colleges to exist
3. **Sections** - Requires departments to exist
4. **Users** - Independent (can be imported anytime before students/teachers)
5. **Students** - Requires users, colleges, departments, sections
6. **Teachers** - Requires users, colleges, departments
7. **Courses** - Requires colleges, departments
8. **Academic Years** - Requires colleges

## Natural Key System

The system uses **natural keys** (human-readable codes) instead of UUIDs in Excel files:

- **College Code**: "NMAMIT" instead of UUID
- **Department Code**: "CS" instead of UUID
- **USN**: "NNM23CSA01" instead of UUID
- **Section Name**: "A" instead of UUID

The backend automatically looks up the corresponding UUIDs when creating relationships.

## Upsert Behavior

The system uses **upsert** (update or insert) logic:

- **Existing Records**: Updates the record based on unique key
- **New Records**: Creates a new record
- **Unique Keys**:
  - Colleges: `code`
  - Departments: `college_id + code`
  - Sections: `department_id + section_name`
  - Users: `username`
  - Students: `usn`
  - Teachers: `userId`
  - Courses: `department_id + code`
  - Academic Years: `college_id + year_name`

## Error Handling

- Individual row failures don't stop the batch import
- All errors are collected and displayed
- Error messages include row numbers for easy identification
- Successful records are committed even if some rows fail

## Dependencies Installed

```bash
npm install multer @types/multer  # Already installed
npm install xlsx                   # Already installed
```

## API Response Format

```json
{
  "success": true,
  "message": "Successfully imported 25 records",
  "recordsProcessed": 25,
  "errors": ["Row 5: Department CS not found", "Row 12: Invalid email format"]
}
```

## Security

- All routes protected by admin authentication middleware
- Password hashing using bcrypt for user creation
- File upload limited to .xlsx, .xls, .csv formats
- Files processed in memory (not saved to disk)

## Related Documentation

- See `backend/EXCEL_SEEDING_GUIDE.md` for comprehensive guide
- See `backend/EXCEL_QUICK_START.md` for quick reference
- See `backend/excel-seed-data/README.md` for format specifications

## Testing

To test the feature:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Login as admin (create one using `npm run create-admin`)
4. Navigate to Admin → Excel Import tab
5. Download a template, fill with data, and import
