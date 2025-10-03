# Academic Year Update - 2025-26

## Changes Made (October 3, 2025)

### 1. Academic Year Update ✅

- **Previous**: 2024-25
- **Current**: 2025-26
- **Status**: Active

### 2. Student Promotion ✅

All 150 students were promoted to the next academic year:

| Batch | Previous Semester | New Semester | Current Year |
| ----- | ----------------- | ------------ | ------------ |
| 2023  | 3 → 5             | Semester 5   | 3rd Year     |
| 2024  | 1 → 3             | Semester 3   | 2nd Year     |
| 2025  | (New)             | Semester 1   | 1st Year     |

### 3. Analytics Dashboard Updates ✅

#### Backend Changes (`backend/src/routes/analytics.ts`):

- **Academic Years Endpoint**: Now returns only **active** academic years
- **Overview Stats**: Now counts students based on enrollments in the specific academic year
- **Default Year**: Changed from `2024-25` to `2025-26`

#### Frontend Changes (`frontend/src/app/analytics/page.tsx`):

- **Default Year**: Changed from `2024-25` to `2025-26`
- **Auto-selection**: Automatically selects the most recent active year
- **Fallback**: Defaults to `2025-26` if API fails

### 4. System Behavior

#### ✅ What Works:

- Only **active academic year (2025-26)** appears in analytics dropdown
- Student counts are based on the selected academic year
- No duplicate academic years in the UI
- Batch 2023 students correctly show as 3rd year
- Batch 2024 students correctly show as 2nd year

#### ⚠️ Known Limitations:

- **No Historical Data**: Previous academic year (2024-25) data is not retained
- **Zero Enrollments**: Current system has 0 course enrollments (needs to be populated)
- **Analytics Data**: Will show zeros until course enrollments are created

### 5. How the System Works Now

#### Student Year Calculation:

```
Current Year = Math.ceil(semester / 2)

Examples:
- Semester 1 or 2 → 1st Year
- Semester 3 or 4 → 2nd Year
- Semester 5 or 6 → 3rd Year
- Semester 7 or 8 → 4th Year
```

#### Academic Year vs Batch Year:

- **Batch Year**: Year student was admitted (e.g., 2023) - **NEVER CHANGES**
- **Academic Year**: Current academic session (e.g., 2025-26) - **CHANGES ANNUALLY**
- **Semester**: Current semester of study - **UPDATES WITH ACADEMIC YEAR**

### 6. Future Academic Year Updates

To update to the next academic year (e.g., 2026-27):

1. Run the promotion script:

   ```bash
   cd backend
   node scripts/update-academic-year.js
   ```

2. The script will:

   - Deactivate all old academic years
   - Create/activate new academic year (e.g., 2026-27)
   - Promote all students by 2 semesters
   - Update the database

3. Restart backend server
4. Refresh frontend - new year will appear automatically

### 7. Data Requirements

For analytics to show meaningful data, you need to:

1. **Create Course Enrollments**: Enroll students in courses for the current academic year
2. **Record Attendance**: Mark attendance for classes
3. **Enter Marks**: Add theory and lab marks for students

### 8. Design Decision: Active Year Only

**Choice**: Show only active academic year (Option A)

**Rationale**:

- Simpler to maintain
- No need to migrate historical data
- Focus on current academic operations
- Export reports for historical records

**Trade-off**:

- Cannot compare across multiple years in analytics
- Historical data is not retained in the system
- Past year statistics are lost unless exported

---

## Summary

✅ Academic year successfully updated to 2025-26  
✅ All students promoted to correct year levels  
✅ Analytics shows only active academic year  
✅ System ready for current academic year operations

⚠️ Need to populate course enrollments for analytics to work  
⚠️ Historical data from 2024-25 is not retained
