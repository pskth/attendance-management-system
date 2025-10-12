# College ERP Backend

This is the backend API for the College ERP System built with Node.js, Express, TypeScript, and Prisma.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment Setup:**

   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` with your PostgreSQL connection string

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/college_erp?schema=public"
   ```

3. **Database Setup:**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database (for development)
   npm run db:push

   # Or run migrations (for production)
   npm run db:migrate

   # Test database connection
   npm run db:setup
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:setup` - Test database connection and setup

## API Endpoints

- `GET /` - API status and information
- `GET /health` - Health check with database connectivity

## Database Schema

The database schema is defined in `prisma/schema.prisma` and includes:

### Core Entities

- **Users** - Base user information
- **Students** - Student-specific data
- **Teachers** - Faculty information
- **Admins** - Administrative users
- **Report Viewers** - Analytics access users

### Academic Structure

- **Colleges** - Institution information
- **Departments** - Academic departments
- **Courses** - Course catalog
- **Course Offerings** - Specific course instances

### Enrollment & Assessment

- **Student Enrollments** - Course registrations
- **Attendance** - Class attendance tracking
- **Theory Marks** - Theory assessment marks
- **Lab Marks** - Laboratory assessment marks

### Electives Management

- **Department Elective Groups** - Grouped elective options
- **Open Elective Restrictions** - Cross-department restrictions

## Technology Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Development:** ts-node-dev for hot reload

## Project Structure

```
backend/
├── src/
│   ├── index.ts          # Main server file
│   ├── routes/           # API route handlers
│   │   ├── admin/        # Admin-specific routes
│   │   ├── auth.ts       # Authentication routes
│   │   ├── student.ts    # Student routes
│   │   └── teacher.ts    # Teacher routes
│   └── middleware/       # Express middleware
├── prisma/
│   └── schema.prisma     # Database schema
├── excel-seed-data/      # Sample Excel files for import
├── generated/
│   └── prisma/          # Generated Prisma client
├── create-admin.js       # Script to create admin user
├── seed-from-excel.js    # Script to seed database from Excel
├── create-sample-excel.js # Script to generate sample Excel files
├── list-teachers.js      # Utility to list all teachers
├── setup-teacher.js      # Utility to setup teacher accounts
├── .env                 # Environment variables
├── .env.example         # Environment template
└── package.json         # Dependencies and scripts
```

## Utility Scripts

The backend includes several utility scripts to help with setup and administration:

### `create-admin.js`

Creates an admin user in the system.

```bash
node create-admin.js
```

**What it does:**

- Prompts for admin details (username, email, password)
- Creates user with admin role
- Useful for initial system setup

### `seed-from-excel.js`

Seeds the database from Excel files.

```bash
node seed-from-excel.js
```

**What it does:**

- Reads Excel files from `excel-seed-data/` directory
- Imports colleges, departments, users, students, teachers, courses
- Validates data before insertion
- Useful for bulk data import

### `create-sample-excel.js`

Generates sample Excel files for testing import functionality.

```bash
node create-sample-excel.js
```

**What it does:**

- Creates sample Excel files with proper format
- Includes realistic test data
- Useful for testing Excel import feature

### `list-teachers.js`

Lists all teachers in the system.

```bash
node list-teachers.js
```

**What it does:**

- Displays all teacher accounts with their details
- Shows username, name, department
- Useful for verification and debugging

### `setup-teacher.js`

Interactive script to setup or modify teacher accounts.

```bash
node setup-teacher.js
```

**What it does:**

- Creates or updates teacher profiles
- Assigns teachers to departments
- Useful for manual teacher management

## Development Workflow

1. Make changes to the Prisma schema (`prisma/schema.prisma`)
2. Generate the client: `npm run db:generate`
3. Push changes to database: `npm run db:push`
4. The development server will automatically restart

## Production Deployment

1. Build the application: `npm run build`
2. Set production environment variables
3. Run database migrations: `npm run db:migrate`
4. Start the server: `npm run start`
