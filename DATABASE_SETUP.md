# Database Setup Instructions

This application now uses PostgreSQL for data storage. Follow these steps to set up the database:

## Prerequisites
- PostgreSQL installed and running
- Node.js and npm installed

## Database Setup

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
   Copy `.env.local` and update the database credentials if needed:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=studio_vit
   DB_USER=postgres
   DB_PASSWORD=password
   ```

## Demo Login Accounts

After running the dummy data script, you can login with these accounts:

- **Admin**: `admin@studiovit.com` / `password`
  - Full access to all features
  
- **Trainer**: `sarah.johnson@studiovit.com` / `password` 
  - Access to trainer-specific features
  
- **User**: `john.smith@email.com` / `password`
  - Regular user features

## Database Schema

The database includes the following main tables:
- `users` - All users (customers, trainers, admins)
- `products` - Point packages for purchase
- `point_batches` - Individual point purchases with expiration
- `purchase_logs` - Audit trail of all purchases  
- `appointments` - Appointment bookings
- `appointment_logs` - Audit trail of appointment actions

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or 3001 if 3000 is in use).