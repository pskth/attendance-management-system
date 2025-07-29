# Student Enrollment CSV Upload

This feature allows administrators to upload students to courses using CSV files.

## CSV Format

The CSV file should contain the following columns:

### Required Columns:
- **USN**: University Seat Number (unique identifier for students) - can be uppercase or lowercase

### Optional Columns:
- **name**: Student's full name
- **email**: Student's email address  
- **section**: Section name

## Sample CSV Format

```csv
USN,Name,Email,Section
4NM23CS001,Student A,4nm23cs001@nmamit.in,NM_CSE_A2
4NM23CS002,Student B,4nm23cs002@nmamit.in,NM_CSE_A2
4NM23CS003,Student C,4nm23cs003@nmamit.in,NM_CSE_A2
4NM23CS006,Student F,4nm23cs006@nmamit.in,NM_CSE_B2
```

## How to Use

1. Navigate to Admin Dashboard → Course Management
2. Find the course you want to add students to
3. Click the "Users" button (👥) next to the course
4. In the enrollment modal, you'll see a "Upload Students via CSV" section
5. Select your academic year and semester
6. Choose your CSV file
7. Click "Upload CSV"

## Upload Results

After uploading, you'll see a summary showing:
- Total records processed
- Successful enrollments
- Failed enrollments
- Error details for any failures

## Common Issues

1. **Student not found**: The USN doesn't exist in the database
2. **Already enrolled**: Student is already enrolled in this course offering
3. **Invalid CSV format**: Missing required columns or format issues

## Notes

- Students must already exist in the system (created through user management)
- The academic year and course offering will be created automatically if they don't exist
- Only students with valid USNs will be enrolled
- Duplicate enrollments are prevented automatically

## Test CSV Files

For testing purposes, sample CSV files are available in the `test-csv-samples/` directory:

1. **`cse_students_simple.csv`** - Simple format with only USN column (CSE students)
2. **`cse_students_detailed.csv`** - Complete format with all columns (CSE students)
3. **`mech_students.csv`** - Mechanical engineering students
4. **`mixed_valid_invalid.csv`** - Mix of valid and invalid USNs for error testing
5. **`cross_department_students.csv`** - Students from multiple departments

These files contain actual USNs from the database and can be used to test the enrollment functionality.
