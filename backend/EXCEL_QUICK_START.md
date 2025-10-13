# Excel Seeding - Quick Reference

## Commands

```bash
# 1. Create sample Excel files
npm run excel:create-samples

# 2. Edit Excel files in excel-seed-data/ directory

# 3. Seed database from Excel files
npm run excel:seed
```

## File Checklist

- [ ] `colleges.xlsx` - College information
- [ ] `departments.xlsx` - Departments per college
- [ ] `sections.xlsx` - Sections per department
- [ ] `users.xlsx` - All user accounts
- [ ] `students.xlsx` - Student details
- [ ] `teachers.xlsx` - Teacher assignments
- [ ] `courses.xlsx` - Course catalog
- [ ] `academic_years.xlsx` - Academic year dates

## Key Points

✅ All users created with password: `password123`
✅ Files process in dependency order automatically
✅ Existing records will be updated (upsert logic)
✅ Errors for individual records don't stop the whole process
✅ Full logs show what was created/updated

## Common Errors

| Error                | Solution                                                              |
| -------------------- | --------------------------------------------------------------------- |
| File not found       | Ensure Excel files are in `excel-seed-data/` directory                |
| College not found    | Make sure college exists in `colleges.xlsx`                           |
| User not found       | Create user in `users.xlsx` before referencing in students/teachers   |
| Department not found | Check `departments.xlsx` has the department with correct college_code |

## Excel Column Types

- `code` = Short identifier (NMAMIT, CS, etc.)
- `name` = Full text name
- `role` = student, teacher, admin
- `type` = core, department_elective, open_elective
- `semester` = 1-8 (number)
- `year` = 1-4 (number)
- `has_theory/has_lab` = true/false or 1/0

## Need Help?

📖 See `EXCEL_SEEDING_GUIDE.md` for detailed documentation
📁 See `excel-seed-data/README.md` for format examples
