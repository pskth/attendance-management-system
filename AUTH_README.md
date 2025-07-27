# Role-Based Authentication System

This attendance management system now includes a comprehensive role-based authentication system with JWT tokens.

## Features

### 🔐 Authentication
- JWT-based authentication with automatic token refresh
- Secure password hashing with bcryptjs
- Session management with HTTP-only cookies
- Token expiration and renewal

### 👥 Role-Based Authorization
- **Admin**: Full system access
- **Teacher**: Course and student management
- **Student**: View own attendance and grades
- **Analytics**: View reports and analytics

### 🛡️ Security Features
- Protected routes with middleware
- Role-specific access control
- Automatic logout on token expiration
- Password change functionality
- Input validation and sanitization

## Setup Instructions

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Environment variables:**
Create a `.env` file in the backend directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/attendance_management"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=4000
FRONTEND_URL=http://localhost:3000
```

3. **Database setup:**
```bash
npm run db:push
npm run db:generate
```

4. **Start the server:**
```bash
npm run dev
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Environment variables:**
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

3. **Start the development server:**
```bash
npm run dev
```

## Authentication Flow

### Login Process
1. User submits username/email and password
2. Backend validates credentials against database
3. JWT token generated with user info and roles
4. Token stored in secure cookies on frontend
5. User redirected to role-specific dashboard

### Protected Routes
Routes are protected using middleware components:
- `ProtectedRoute`: General authentication required
- `AdminRoute`: Admin role required
- `TeacherRoute`: Teacher or Admin role required
- `StudentRoute`: Any authenticated user
- `AnalyticsRoute`: Analytics, Teacher, or Admin role required

### Token Management
- Tokens expire in 24 hours
- Automatic refresh every 20 hours
- Logout clears all authentication data
- Failed requests trigger re-authentication

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/verify` - Verify token validity

### Protected Endpoints
All admin routes now require authentication:
- `/api/admin/*` - Admin only
- `/api/users/*` - Authenticated users
- `/api/courses/*` - Authenticated users

## Usage Examples

### Frontend Components

```tsx
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Using authentication context
function MyComponent() {
  const { user, isAuthenticated, hasRole, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      {hasRole('admin') && <AdminPanel />}
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Protected route wrapper
function AdminPage() {
  return (
    <ProtectedRoute requiredRoles="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

### API Client Usage

```tsx
import { apiClient } from '@/lib/apiClient';

// Authenticated API calls
const users = await apiClient.getUsers();
const result = await apiClient.createUser(userData);
```

## Default Users

The system includes sample users with hashed passwords. Default login credentials:

- **Admin**: `admin1` / `admin123`
- **Teacher**: `teacher_cse1_nmamit` / `teacher123`
- **Student**: `4nm23cs001` / `student123`

## Security Considerations

### Production Deployment
1. **Change JWT_SECRET** to a strong, random 256-bit key
2. **Use HTTPS** for all communications
3. **Set secure cookie flags** in production
4. **Configure CORS** properly for your domain
5. **Enable rate limiting** on authentication endpoints
6. **Use strong passwords** and consider 2FA

### Password Policies
- Minimum 6 characters (configurable)
- Support for bcrypt hashing
- Legacy plain-text password migration

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Run `npm install` in both directories
2. **Database connection failed**: Check DATABASE_URL in .env
3. **CORS errors**: Verify FRONTEND_URL matches your frontend port
4. **Token expired errors**: Check JWT_SECRET consistency

### Development Tips

1. **Testing authentication**: Use browser dev tools to inspect cookies
2. **API debugging**: Check Network tab for response codes
3. **Role testing**: Create test users with different roles
4. **Token inspection**: Use jwt.io to decode tokens (development only)

## Migration from Previous Version

If upgrading from a system without authentication:

1. **Backup your database**
2. **Run password migration script** for existing users
3. **Update frontend components** to use new auth system
4. **Test all user roles** thoroughly
5. **Update deployment scripts** with new environment variables

## Contributing

When adding new features:
1. **Add proper middleware** to protect new endpoints
2. **Include role checks** for appropriate access levels
3. **Update TypeScript types** for new user data
4. **Test authentication flows** thoroughly
5. **Document new permissions** in this README
