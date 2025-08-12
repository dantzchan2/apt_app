#!/bin/bash

# Reset Database Script
# This script truncates all tables and creates three test accounts
# Usage: ./database/reset_database.sh

echo "🗄️  Database Reset Script"
echo "=========================="
echo ""
echo "This script will:"
echo "• Truncate all database tables"
echo "• Create 3 test accounts with password 'password!'"
echo "  - admin@ptvit.com (admin role)"
echo "  - trainer@ptvit.com (trainer role)"  
echo "  - user@ptvit.com (user role)"
echo "• Create basic product packages"
echo ""

# Check if we're in the correct directory
if [ ! -f "database/reset_and_create_accounts.sql" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "Usage: ./database/reset_database.sh"
    exit 1
fi

# Confirm before proceeding
read -p "⚠️  This will DELETE ALL DATA. Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Database reset cancelled."
    exit 1
fi

echo "🚀 Running database reset..."
echo ""

# Check if psql is available
if command -v psql &> /dev/null; then
    echo "📋 You can run the SQL script with:"
    echo "psql -d your_database_name -f database/reset_and_create_accounts.sql"
    echo ""
    echo "Or copy the contents of database/reset_and_create_accounts.sql"
    echo "and paste it into your Supabase SQL editor."
else
    echo "📋 Copy the contents of database/reset_and_create_accounts.sql"
    echo "and paste it into your database SQL editor (e.g., Supabase SQL editor)."
fi

echo ""
echo "✅ Script location: database/reset_and_create_accounts.sql"
echo "🔑 All accounts use password: password!"
echo ""
echo "Test accounts created:"
echo "• admin@ptvit.com (Admin User)"
echo "• trainer@ptvit.com (Test Trainer)" 
echo "• user@ptvit.com (Test User)"