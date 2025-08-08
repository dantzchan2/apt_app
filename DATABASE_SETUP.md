# Database Setup Instructions

This application uses **PostgreSQL with Supabase** for data storage. The application has been fully migrated from localStorage to database-backed storage.

## Prerequisites
- Supabase account and project setup
- Node.js and npm installed

## Production Setup (Supabase)

1. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key

2. **Run the schema:**
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste the contents of `public/sql/schema.sql`
   - Execute the SQL to create tables and functions

3. **Add sample data:**
   - In SQL Editor, copy and paste the contents of `public/sql/dummy.sql`
   - Execute to populate with test data

4. **Configure environment variables:**
   Create `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   DATABASE_URL=your_supabase_database_url
   ```

## Local Development Setup (Optional)

For local PostgreSQL development:

1. **Create the database:**
   ```bash
   createdb studio_vit
   ```

2. **Run the schema:**
   ```bash
   psql -d studio_vit -f public/sql/schema.sql
   ```

3. **Add sample data:**
   ```bash
   psql -d studio_vit -f public/sql/dummy.sql
   ```

4. **Configure environment variables:**
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/studio_vit
   ```
## Database Schema

The database includes the following main tables:
- `users` - All users (customers, trainers, admins) with authentication
- `products` - Point packages for purchase with commission rates
- `point_batches` - Individual point purchases with expiration (FIFO consumption)
- `purchase_logs` - Audit trail of all purchases with payment status
- `appointments` - Appointment bookings with trainer and user details
- `appointment_logs` - Complete audit trail of all appointment actions
- `sessions` - User sessions for HTTP-only cookie authentication

## Key Features

- **No localStorage**: All data is now stored in the database
- **API-First**: All operations use RESTful API endpoints
- **Secure Authentication**: HTTP-only cookies with bcrypt password hashing
- **CSRF Protection**: Token-based CSRF validation
- **Rate Limiting**: Protection against brute force attacks
- **Audit Trails**: Complete logging of purchases and appointment changes
- **Point Expiration**: Automatic point batch expiration with FIFO consumption
- **Commission Tracking**: Built-in support for trainer revenue sharing

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or 3001 if 3000 is in use).

## API Endpoints

The application provides the following API endpoints:
- `GET/POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/me` - Current user info
- `GET/POST/PUT /api/appointments` - Appointment management
- `GET /api/appointment-logs` - Appointment audit logs
- `GET /api/purchase-logs` - Purchase history
- `GET /api/users` - User management
- `GET /api/products` - Available point packages