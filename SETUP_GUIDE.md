# KAVACH SURAKSHA - Setup Guide

## Quick Start

The application is ready to run! Follow these steps to get started:

### 1. Start the Development Server

The development server will automatically start. You can access the application at the URL provided.

### 2. Create Your First Admin User

Since the application uses Supabase authentication, you need to create users through the Supabase Auth system. Here's how:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Users"
3. Click "Add user" → "Create new user"
4. Enter the following details:
   - Email: `admin@kavach.railway.gov.in`
   - Password: Choose a secure password
   - Check "Auto Confirm User"
5. After creating the user in Supabase Auth, the user profile will be automatically created in the `users` table when they first sign in

#### Option B: Using SQL (For Admin User Setup)

Run this SQL in your Supabase SQL Editor after creating the auth user:

```sql
-- After creating user in Supabase Auth, insert user profile
-- Replace 'USER_ID_FROM_AUTH' with the actual user ID from auth.users
INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  'USER_ID_FROM_AUTH',
  'admin@kavach.railway.gov.in',
  'System Administrator',
  'SUPER_ADMIN',
  true
);
```

### 3. Login to the Application

1. Open the application in your browser
2. Use the credentials you just created:
   - Email: `admin@kavach.railway.gov.in`
   - Password: (the password you set)

### 4. Create Additional Users

Once logged in as admin:

1. Navigate to "User Management" in the sidebar
2. Click "Add User"
3. Fill in the user details:
   - Full Name
   - Email
   - Password
   - Role
   - Zone/Division (if applicable)
4. Click "Create User"

## Sample User Roles for Testing

Create these users for comprehensive testing:

| Email | Role | Zone | Division | Use Case |
|-------|------|------|----------|----------|
| `admin@kavach.railway.gov.in` | SUPER_ADMIN | - | - | Full system access |
| `board@kavach.railway.gov.in` | RAILWAY_BOARD | - | - | All zones access |
| `rdso@kavach.railway.gov.in` | RDSO | - | - | Read-only audit |
| `zone.cr@kavach.railway.gov.in` | ZONE_USER | Central Railway | - | Zone management |
| `div.mumbai@kavach.railway.gov.in` | DIVISION_USER | Central Railway | Mumbai Division | Division ops |
| `oem@kavach.railway.gov.in` | OEM | - | - | Asset management |
| `viewer@kavach.railway.gov.in` | VIEW_ONLY | - | - | Read-only access |

## Sample Data

The database has been populated with sample data including:

- **5 Railway Zones**: Central, Western, Northern, Southern, Eastern
- **7 Divisions**: Distributed across zones
- **5 Sections**: Railway sections within divisions
- **5 Locomotives**: Active and maintenance units
- **5 Assets**: RFID tags, towers, trackside, and onboard units
- **5 NMS Logs**: Various severity levels for testing

## Testing the Application

### 1. Dashboard Testing
- Login with different user roles
- Observe filtered data based on role
- Test zone and division filters
- Verify KPI calculations

### 2. NMS Logs Testing
- Navigate to "Real-Time NMS Logs"
- Test auto-refresh toggle
- Apply various filters
- Export logs to CSV

### 3. FRACAS Module Testing
- Create a new failure report
- Analyze an open failure
- Take corrective action
- Close a FRACAS record

### 4. Asset Management Testing
- Browse different asset types
- Check health status
- View last communication times
- Filter by zone/division

### 5. User Management Testing
- Create users with different roles
- Toggle user active status
- Assign zones and divisions
- Test role-based access

### 6. Navigation Testing
- Test sidebar collapse/expand
- Navigate through all menu items
- Verify role-based menu visibility
- Test mobile responsive design

### 7. Theme Testing
- Toggle between light and dark modes
- Verify all components render correctly
- Check contrast and readability

## Role-Based Access Testing

### SUPER_ADMIN
- Should see all menu items
- Can access user management
- Can view all zones and divisions
- Can create/edit/delete users

### RAILWAY_BOARD
- Can view all zones and divisions
- Cannot access user management
- Can view all reports
- Can manage FRACAS records

### ZONE_USER
- Can only see their assigned zone
- Can view divisions within their zone
- Cannot see other zones' data
- Can manage zone-level assets

### DIVISION_USER
- Can only see their assigned division
- Cannot see other divisions
- Can manage division-level assets
- Can create FRACAS records

### VIEW_ONLY
- Read-only access to all modules
- Cannot create or edit records
- Can view reports
- Can export data

### RDSO
- Read-only access for audit
- Can view all zones and divisions
- Cannot create or modify records
- Can access all reports

## Troubleshooting

### Issue: Cannot login
**Solution**:
1. Verify user exists in `auth.users` table
2. Check if user profile exists in `users` table
3. Ensure `is_active` is `true` in users table
4. Verify email confirmation (if required)

### Issue: Empty dashboard
**Solution**:
1. Check if sample data was inserted
2. Verify RLS policies are correctly set
3. Ensure user has proper role assignment
4. Check zone/division assignment for role

### Issue: Access denied to certain pages
**Solution**:
1. Verify user role in database
2. Check if role is allowed for the route
3. Review RLS policies for the table
4. Ensure zone/division is properly assigned

### Issue: No data showing in tables
**Solution**:
1. Check RLS policies for the table
2. Verify user's zone/division assignment
3. Check if data exists in the table
4. Review filter selections

## Environment Variables

The `.env` file contains:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

These are automatically configured and should not need modification.

## Database Migrations

All migrations have been applied:

1. `create_kavach_fracas_schema` - Main database schema
2. `seed_sample_data` - Sample data for testing

## Security Notes

1. All tables have Row Level Security (RLS) enabled
2. Users can only access data based on their role and assignment
3. JWT tokens are used for authentication
4. Sessions are automatically managed
5. Passwords are securely hashed by Supabase Auth

## Next Steps

After setup:

1. Create production user accounts
2. Configure real NMS log integration
3. Set up automated backups
4. Configure email notifications
5. Set up monitoring and alerting
6. Train users on the system

## Support

For technical support:
- Check the README.md for detailed documentation
- Review the code in `src/` directory
- Check Supabase documentation for auth/database issues
- Contact the development team for assistance

## Production Deployment

Before deploying to production:

1. Update environment variables with production Supabase credentials
2. Run `npm run build` to create production build
3. Test all functionality thoroughly
4. Set up proper backup procedures
5. Configure monitoring and logging
6. Implement proper error tracking
7. Set up SSL certificates
8. Configure proper CORS policies
9. Enable rate limiting on APIs
10. Set up automated testing

---

**Important**: This is a non-safety system for monitoring and management only. It does not interface with or control any safety-critical KAVACH systems.
