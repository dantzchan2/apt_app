# Database Scripts

This directory contains database management scripts for the P.T. VIT appointment scheduling application.

## Reset Database Script

### Files
- `reset_and_create_accounts.sql` - Main SQL script that resets the database
- `reset_database.sh` - Shell script wrapper for easy execution
- `generate_password_hash.js` - Utility to generate bcrypt hashes

### Usage

#### Method 1: Using the Shell Script (Recommended)
```bash
./database/reset_database.sh
```

#### Method 2: Direct SQL Execution
```bash
# If using PostgreSQL directly
psql -d your_database_name -f database/reset_and_create_accounts.sql

# Or copy/paste the contents into your database SQL editor
```

### What the Script Does

1. **Truncates all tables** in dependency order:
   - `appointment_logs`
   - `appointments` 
   - `purchase_logs`
   - `point_batches`
   - `sessions`
   - `users`
   - `products`

2. **Creates 3 test accounts** with password `password!`:
   - `admin@ptvit.com` - Admin role
   - `trainer@ptvit.com` - Trainer role (General Fitness specialization)
   - `user@ptvit.com` - User role

3. **Creates basic product packages**:
   - 스타터 패키지 (5 points, 30min, ₩25,000)
   - 베이직 패키지 (10 points, 30min, ₩45,000) 
   - 프리미엄 패키지 (20 points, 60min, ₩85,000)
   - 프로 패키지 (50 points, 60min, ₩200,000)

### Password Information
- **Password**: `password!`
- **Hash Algorithm**: bcrypt with 10 salt rounds
- **Generated Hash**: `$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2`

### Regenerating Password Hash
If you need to change the password or regenerate the hash:

```bash
node database/generate_password_hash.js
```

Then update the hash in `reset_and_create_accounts.sql`.

### Safety Notes
⚠️ **WARNING**: This script will delete ALL data in your database. Use only for development/testing.

✅ **Safe for**: Development, testing, demo setups
❌ **Never use on**: Production databases with real user data

### Database Schema Compatibility
This script is compatible with the current database schema including:
- Variable session durations (30min/60min)
- No-show functionality
- Point batch system
- Appointment logging
- User authentication with bcrypt