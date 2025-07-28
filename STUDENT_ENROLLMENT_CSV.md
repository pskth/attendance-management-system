# Student Enrollment CSV Upload

This feature allows administrators to upload students to courses using CSV files.

## CSV Format

The CSV file should contain the following columns:

### Required Columns:
- **usn**: University Seat Number (unique identifier for students)

### Optional Columns:
- **name**: Student's full name
- **email**: Student's email address  
- **section**: Section name

## Sample CSV Format

```csv
usn,name,email,section
1BG22CS001,John Doe,john@example.com,A
1BG22CS002,Jane Smith,jane@example.com,A
1BG22CS003,Bob Johnson,bob@example.com,B
1BG22CS004,Alice Brown,alice@example.com,B
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
