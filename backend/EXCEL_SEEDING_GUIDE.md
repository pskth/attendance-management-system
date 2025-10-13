# Excel-Based Database Seeding Guide

A comprehensive system to seed your database using Excel files. This makes it easy to import large amounts of data without writing SQL queries.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install xlsx
```

### 2. Generate Sample Excel Files

```bash
node create-sample-excel.js
```

This creates sample Excel files in the `excel-seed-data/` directory with example data.

### 3. Edit Excel Files

Open the Excel files in `excel-seed-data/` and edit them with your actual data. You can:

- Add more rows
- Modify existing data
- Delete sample rows

### 4. Run the Seeding

```bash
node seed-from-excel.js
```

The script will:

- ✅ Read all Excel files
- ✅ Validate data
- ✅ Create or update records in the database
- ✅ Show progress and any errors

## 📋 Excel File Formats

### 1. colleges.xlsx

| Column | Type   | Required | Description                          |
| ------ | ------ | -------- | ------------------------------------ |
| code   | String | Yes      | Unique college code (e.g., "NMAMIT") |
| name   | String | Yes      | Full college name                    |

**Example:**

```
code    | name
--------|----------------------------------------
NMAMIT  | NMAM Institute of Technology
NMIT    | Nitte Meenakshi Institute of Technology
```

### 2. departments.xlsx

| Column       | Type   | Required | Description                  |
| ------------ | ------ | -------- | ---------------------------- |
| college_code | String | Yes      | Reference to college code    |
| code         | String | Yes      | Department code (e.g., "CS") |
| name         | String | Yes      | Full department name         |

**Example:**

```
college_code | code | name
-------------|------|----------------------------------
NMAMIT       | CS   | Computer Science and Engineering
NMAMIT       | IS   | Information Science and Engineering
NMIT         | CS   | Computer Science and Engineering
```

### 3. sections.xlsx

| Column          | Type   | Required | Description                   |
| --------------- | ------ | -------- | ----------------------------- |
| college_code    | String | Yes      | Reference to college code     |
| department_code | String | Yes      | Reference to department code  |
| section_name    | String | Yes      | Section name (e.g., "A", "B") |

**Example:**

```
college_code | department_code | section_name
-------------|----------------|-------------
NMAMIT       | CS             | A
NMAMIT       | CS             | B
NMAMIT       | IS             | A
```

### 4. users.xlsx

| Column   | Type   | Required | Description                              |
| -------- | ------ | -------- | ---------------------------------------- |
| username | String | Yes      | Unique username (USN for students)       |
| name     | String | Yes      | Full name of user                        |
| email    | String | No       | Email address                            |
| phone    | String | No       | Phone number                             |
| role     | String | Yes      | User role: "student", "teacher", "admin" |

**Example:**

```
username    | name              | email               | phone       | role
------------|-------------------|---------------------|-------------|--------
NNM23CSA01  | Rahul Kumar       | rahul@example.com   | 9876543210 | student
teacher1    | Dr. Priya Sharma  | priya@example.com   | 9876543211 | teacher
admin       | System Admin      | admin@example.com   | 9876543212 | admin
```

**Note:** All users are created with default password: `password123`

### 5. students.xlsx

| Column          | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| usn             | String | Yes      | University Seat Number (must exist in users) |
| college_code    | String | Yes      | Reference to college code                    |
| department_code | String | Yes      | Reference to department code                 |
| section         | String | Yes      | Section name                                 |
| semester        | Number | Yes      | Current semester (1-8)                       |
| batch_year      | Number | Yes      | Year of admission (e.g., 2023)               |

**Example:**

```
usn         | college_code | department_code | section | semester | batch_year
------------|--------------|----------------|---------|----------|------------
NNM23CSA01  | NMAMIT       | CS             | A       | 5        | 2023
NNM23CSA02  | NMAMIT       | CS             | A       | 5        | 2023
```

### 6. teachers.xlsx

| Column          | Type   | Required | Description                            |
| --------------- | ------ | -------- | -------------------------------------- |
| username        | String | Yes      | Teacher username (must exist in users) |
| college_code    | String | Yes      | Reference to college code              |
| department_code | String | Yes      | Reference to department code           |

**Example:**

```
username  | college_code | department_code
----------|--------------|----------------
teacher1  | NMAMIT       | CS
teacher2  | NMAMIT       | IS
```

### 7. courses.xlsx

| Column          | Type    | Required | Description                                       |
| --------------- | ------- | -------- | ------------------------------------------------- |
| college_code    | String  | Yes      | Reference to college code                         |
| department_code | String  | Yes      | Reference to department code                      |
| code            | String  | Yes      | Course code (e.g., "CS301")                       |
| name            | String  | Yes      | Course name                                       |
| type            | String  | Yes      | "core", "department_elective", or "open_elective" |
| year            | Number  | Yes      | Year of study (1-4)                               |
| has_theory      | Boolean | Yes      | true/false or 1/0                                 |
| has_lab         | Boolean | Yes      | true/false or 1/0                                 |

**Example:**

```
college_code | department_code | code  | name                  | type  | year | has_theory | has_lab
-------------|----------------|-------|-----------------------|-------|------|-----------|--------
NMAMIT       | CS             | CS301 | Data Structures       | core  | 3    | true      | true
NMAMIT       | CS             | CS401 | Machine Learning      | department_elective | 4 | true | false
NMAMIT       | CS             | CS501 | Web Development       | open_elective | 3 | true | true
```

### 8. academic_years.xlsx

| Column     | Type   | Required | Description                            |
| ---------- | ------ | -------- | -------------------------------------- |
| year_name  | String | Yes      | Academic year name (e.g., "2024-2025") |
| start_date | Date   | Yes      | Start date (YYYY-MM-DD)                |
| end_date   | Date   | Yes      | End date (YYYY-MM-DD)                  |

**Example:**

```
year_name | start_date | end_date
----------|------------|----------
2024-2025 | 2024-08-01 | 2025-07-31
2025-2026 | 2025-08-01 | 2026-07-31
```

## 🔄 How It Works

1. **Upsert Logic**: The script uses "upsert" operations:

   - If a record exists (based on unique keys), it updates it
   - If it doesn't exist, it creates a new one

2. **Dependency Order**: Files are processed in order:

   - Colleges → Departments → Sections → Users → Students/Teachers → Courses → Academic Years

3. **Error Handling**:

   - If one record fails, the script continues with the next
   - All errors are logged with details

4. **Validation**: The script checks for:
   - Missing files
   - Invalid references (e.g., non-existent college_code)
   - Required fields

## 💡 Tips and Best Practices

### Data Preparation

1. **Use consistent naming**:

   - College codes: ALL CAPS (e.g., "NMAMIT")
   - Department codes: 2-3 letters (e.g., "CS", "IS", "ME")
   - USNs: Follow your institution's format

2. **Start small**:

   - Test with a few records first
   - Verify the data is imported correctly
   - Then import larger datasets

3. **Keep backups**:
   - Save your Excel files
   - They serve as documentation of your data structure

### Common Issues

**Problem:** "College not found: NMAMIT"

- **Solution:** Make sure colleges.xlsx is processed first and contains the college

**Problem:** "User not found: NNM23CSA01"

- **Solution:** Create the user in users.xlsx before creating the student record

**Problem:** Excel file not found

- **Solution:** Ensure files are in the `excel-seed-data/` directory with exact names

### Performance

- The script processes records sequentially for data integrity
- For large datasets (1000+ records), it may take a few minutes
- Watch the console output for progress

## 🔧 Advanced Usage

### Custom Default Password

Edit `seed-from-excel.js` and change:

```javascript
const DEFAULT_PASSWORD = "your_password_here";
```

### Selective Seeding

Comment out sections in the `seedDatabase()` function:

```javascript
async function seedDatabase() {
  await seedColleges();
  await seedDepartments();
  // await seedSections();  // Skip sections
  // await seedUsers();     // Skip users
  await seedStudents();
  // ...
}
```

### Adding Custom Fields

1. Add columns to your Excel file
2. Update the seeding script to read the new columns
3. Ensure the database schema supports the fields

## 📊 Example Workflow

### Scenario: Adding a new batch of students

1. **Prepare Excel file**:

   ```
   # users.xlsx - Add 50 new students
   NNM24CSA01 | Amit Kumar    | amit@example.com    | ... | student
   NNM24CSA02 | Priya Sharma  | priya@example.com   | ... | student
   ...

   # students.xlsx - Add student details
   NNM24CSA01 | NMAMIT | CS | A | 1 | 2024
   NNM24CSA02 | NMAMIT | CS | A | 1 | 2024
   ...
   ```

2. **Run seeding**:

   ```bash
   node seed-from-excel.js
   ```

3. **Verify**:

   - Check console output for any errors
   - Login to the system and verify students appear

4. **Done!** ✅
   - All 50 students created with default password
   - Ready to use the system

## 🛠️ Troubleshooting

### Script fails immediately

- Check if `xlsx` package is installed: `npm install xlsx`
- Verify you're in the `backend` directory

### "Cannot find module"

```bash
cd backend
npm install
npm install xlsx
```

### Database connection errors

- Check your `.env` file has correct `DATABASE_URL`
- Ensure PostgreSQL is running

### Data not appearing

- Run `npx prisma generate` to regenerate Prisma client
- Check console output for specific errors

## 📝 Notes

- **Security**: Change the default password after seeding
- **Testing**: Test on a development database first
- **Backup**: Always backup your database before seeding
- **Updates**: The script can be re-run to update existing data

## 🎯 Next Steps

After seeding:

1. Change default passwords for all users
2. Create course offerings for courses
3. Assign teachers to courses
4. Set up academic calendar
5. Configure attendance periods

---

Happy Seeding! 🌱
