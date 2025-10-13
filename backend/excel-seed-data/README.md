# Excel-based Database Seeding

This directory contains Excel files for seeding the database with initial data.

## Setup Instructions

1. Install the required package:

   ```bash
   npm install xlsx
   ```

2. Place your Excel files in this directory with the following names:

   - `colleges.xlsx`
   - `departments.xlsx`
   - `sections.xlsx`
   - `users.xlsx`
   - `students.xlsx`
   - `teachers.xlsx`
   - `courses.xlsx`
   - `academic_years.xlsx`

3. Run the seeding script:
   ```bash
   node seed-from-excel.js
   ```

## Excel File Formats

### colleges.xlsx

| code   | name                                    |
| ------ | --------------------------------------- |
| NMAMIT | NMAM Institute of Technology            |
| NMIT   | Nitte Meenakshi Institute of Technology |

### departments.xlsx

| college_code | code | name                                |
| ------------ | ---- | ----------------------------------- |
| NMAMIT       | CS   | Computer Science and Engineering    |
| NMAMIT       | IS   | Information Science and Engineering |
| NMIT         | CS   | Computer Science and Engineering    |

### sections.xlsx

| college_code | department_code | section_name |
| ------------ | --------------- | ------------ |
| NMAMIT       | CS              | A            |
| NMAMIT       | CS              | B            |
| NMAMIT       | IS              | A            |

### users.xlsx

| username   | name             | email             | phone      | role    |
| ---------- | ---------------- | ----------------- | ---------- | ------- |
| NNM23CSA01 | Rahul Kumar      | rahul@example.com | 9876543210 | student |
| teacher1   | Dr. Priya Sharma | priya@example.com | 9876543211 | teacher |
| admin1     | System Admin     | admin@example.com | 9876543212 | admin   |

**Note:** All users will be created with default password: `password123`

### students.xlsx

| usn        | college_code | department_code | section | semester | batch_year |
| ---------- | ------------ | --------------- | ------- | -------- | ---------- |
| NNM23CSA01 | NMAMIT       | CS              | A       | 5        | 2023       |
| NNM23CSA02 | NMAMIT       | CS              | A       | 5        | 2023       |

### teachers.xlsx

| username | college_code | department_code |
| -------- | ------------ | --------------- |
| teacher1 | NMAMIT       | CS              |
| teacher2 | NMAMIT       | IS              |

### courses.xlsx

| college_code | department_code | code  | name             | type                | year | has_theory | has_lab |
| ------------ | --------------- | ----- | ---------------- | ------------------- | ---- | ---------- | ------- |
| NMAMIT       | CS              | CS301 | Data Structures  | core                | 3    | true       | true    |
| NMAMIT       | CS              | CS401 | Machine Learning | department_elective | 4    | true       | false   |

**Course Types:**

- `core` - Core/mandatory course
- `department_elective` - Department elective
- `open_elective` - Open elective

### academic_years.xlsx

| year_name | start_date | end_date   |
| --------- | ---------- | ---------- |
| 2024-2025 | 2024-08-01 | 2025-07-31 |
| 2025-2026 | 2025-08-01 | 2026-07-31 |

## Tips

1. **Order matters**: The script processes files in dependency order automatically
2. **Upsert logic**: Existing records will be updated, new ones will be created
3. **Error handling**: If a record fails, the script will continue with the next one
4. **Validation**: Make sure foreign key references (like college_code, department_code) exist
5. **Excel format**: Save files as `.xlsx` format (not `.xls`)

## Creating Sample Files

You can use the provided `create-sample-excel.js` script to generate sample Excel files:

```bash
node create-sample-excel.js
```

This will create all the Excel files with sample data in this directory.
