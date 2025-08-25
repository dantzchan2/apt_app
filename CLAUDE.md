# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 React application called "P.T. VIT" - a point-based appointment scheduling system for fitness trainers. The app uses TypeScript, Tailwind CSS, and follows Next.js App Router architecture.

## Key Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Package Management
- `npm install` - Install dependencies
- The project uses Next.js 15 with React 19

## Architecture & Structure

### Authentication System
- Database-backed session authentication with HTTP-only cookies
- Session management using secure tokens stored in Supabase database
- User data structure:
  ```typescript
  {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'trainer' | 'admin';
    phone: string;
    specialization?: string; // For trainers
    trainer_type?: 'trainer' | 'head_trainer'; // For trainers
    assigned_trainer_id?: string; // For users
    total_points: number;
    is_active: boolean;
  }
  ```

### Core Features
1. **User Management**: Login/signup flows with database-backed session management and trainer assignment
2. **Trainer Assignment System**: Each user is assigned to one specific trainer during registration
3. **Trainer Types**: Head trainers (premium) and regular trainers with different pricing structures
4. **Point System**: Users purchase trainer-type-specific points for appointments (1 point = 1 session)
5. **Appointment Booking**: 10-minute interval scheduling from 6:00 AM to 9:50 PM with duration options (30min/60min)
6. **Security Features**: CSRF protection, rate limiting, password hashing with bcrypt

### Data Storage
- **Database**: Supabase PostgreSQL database for all application data (users, appointments, purchase logs, sessions)
- **Authentication**: HTTP-only cookies with secure session tokens
- **API Layer**: RESTful API endpoints for all database operations
- **Session Storage**: Database-backed sessions with 24-hour expiration
- **No localStorage**: All client-side localStorage usage has been removed and replaced with database storage

### Route Structure
- `/` - Landing page
- `/login` - Authentication page
- `/signup` - User registration
- `/dashboard` - Main user dashboard
- `/dashboard/purchase` - Point purchase interface  
- `/dashboard/schedule` - Appointment booking and management
- `/dashboard/users` - User management (admin only)
- `/dashboard/purchases` - Purchase logs (admin only)
- `/dashboard/settlement` - Monthly settlement (admin/trainer)
- `/dashboard/trainer` - Trainer dashboard (trainer/admin)
- `/dashboard/appointments` - Appointment logs (admin only)

### Components Architecture
- All pages use Next.js App Router structure
- Client-side components use `'use client'` directive
- Shared UI patterns: consistent navigation, loading states, responsive design
- Styling: Tailwind CSS with dark mode support

### Business Logic
- **Appointment Scheduling**: Users can book appointments at 10-minute intervals
- **Point System**: 4 tiers of point packages (5, 10, 20, 50 points)
- **Cancellation Policy**: 24-hour advance cancellation for point refund
- **Booking Rules**: 1-hour minimum advance booking required

## Development Notes

### State Management
- Uses React hooks (`useState`, `useEffect`) for local state
- Custom `useAuth()` hook for session-based authentication
- No global state management library
- Data persistence via Supabase database and API calls
- All data operations use fetch() calls to REST API endpoints

### Time Handling
- All times stored as strings in HH:MM format
- Date validation prevents past bookings
- Time slot availability checking against existing appointments

### User Experience
- Responsive design with mobile-first approach
- Loading states and form validation
- Alert-based notifications (could be enhanced with toast notifications)

### Security Implementation
- **Password Requirements**: Minimum 8 characters
- **Session Management**: Cryptographically secure tokens (64-char hex)
- **CSRF Protection**: Token-based CSRF validation on forms
- **Rate Limiting**: 5 login attempts per 15 minutes per IP
- **Authentication Middleware**: Route protection with Edge Runtime compatibility
- **Secure Cookies**: HTTP-only, SameSite strict, secure in production
- **Password Hashing**: bcrypt with salt rounds
- **Database Security**: Row Level Security (RLS) enabled on Supabase

## Recent Developments & Overhauls

### Big Overhaul #1 - No-Show Functionality (Completed ✅)
**Date**: August 2025
**Status**: ✅ COMPLETED - All features implemented and tested

**Features Added**:
1. **Navigation Menu Reordering**: "포인트 구매" now appears after "예약 스케줄" in navigation
2. **Trainer No-Show Management**: 
   - Trainers can mark scheduled appointments as "no-show" or "completed"
   - Trainers can change completed appointments to no-show status
   - Added dual buttons: "완료 처리" and "노쇼 처리" for past appointments
   - Added "노쇼로 변경" button for completed appointments
3. **User Schedule No-Show Display**: 
   - Users can see no-show appointments with orange styling (`bg-orange-100`)
   - Updated legend to show "노쇼 처리된 예약" with orange color indicator
   - Calendar grid updated to 6 columns to accommodate new legend
   - No-show appointments display "노쇼" text with orange badge
4. **Settlement Page Dynamic Trainers**: 
   - Removed hardcoded trainer list (`TRAINER_LIST`)
   - Now loads trainers from database via `/api/trainers` 
   - Added `fetchTrainers()` function and proper state management
5. **Bulk Auto-Complete API**: 
   - Fixed database constraint violations in appointment logging
   - Proper field mapping: `trainer_id: apt.trainer_id`, `user_id: apt.user_id`
   - Enhanced error handling and logging for bulk operations
   - Admin-only bulk completion of past scheduled appointments
6. **Database Schema**: 
   - Added `'no_show'` status to appointments table
   - Updated appointment logs to handle all new status types
   - Fixed constraint violations with proper field mapping

**Files Modified**:
- `src/app/dashboard/trainer/page.tsx` - Added no-show functionality
- `src/app/dashboard/schedule/page.tsx` - Added no-show display and styling
- `src/app/dashboard/settlement/page.tsx` - Dynamic trainer loading
- `src/app/api/appointments/auto-complete/route.ts` - Fixed logging constraints
- `src/components/NavDrawer.tsx` - Reordered navigation menu
- Database constraints and status enums updated

**Testing**: Comprehensive automated tests created (`test-features-only.js`) - All tests passing ✅

### Big Overhaul #2 - Variable Session Durations (Completed ✅)
**Date**: August 2025  
**Status**: ✅ COMPLETED - All features implemented and tested

**Objective**: Support products with different session durations (30 minutes vs 1 hour)

**Features Implemented**:
1. **Database Schema Changes**:
   - Added `duration_minutes` column to `products` table (30 or 60 minutes)
   - Added `duration_minutes` column to `appointments` table for historical tracking
   - Updated sample data: Starter/Basic packages = 30min, Premium/Pro packages = 60min
   - Added database indexes for performance optimization
   - Migration script: `004_add_variable_session_durations.sql`

2. **API Endpoint Updates**:
   - Updated `/api/products` to include `duration_minutes` field
   - Enhanced `/api/appointments` to handle duration-aware booking
   - Improved conflict detection with proper time range overlap logic
   - Updated `/api/trainer-availability` to include duration information
   - Enhanced error messages to show conflicting appointment details

3. **Frontend Components Updates**:
   - Updated appointment interface to include `duration_minutes` field
   - Enhanced calendar display to show session durations (e.g., "완료 (30분)")
   - Updated purchase page to display session duration for each product
   - Improved time slot conflict detection with duration-aware logic
   - Calendar cells now show duration information for better user experience

4. **Conflict Detection System**:
   - Implemented proper time range overlap detection algorithm
   - Backend API validates appointment conflicts considering session durations
   - Frontend calendar handles 30-minute slots with variable duration appointments
   - Unavailable slots properly account for session duration overlaps
   - Enhanced error messages for booking conflicts

5. **Duration-Aware Booking System**:
   - Users can select between 30min and 60min sessions when booking
   - Smart popup system:
     - If user has only one type of points: Direct confirmation popup
     - If user has both types: Duration selection popup first, then confirmation
   - Points display shows separate counts for 30min (blue) and 60min (orange) sessions
   - Header and purchase page show duration-specific point balances
   - Booking API properly matches requested duration with available point batches

6. **User Experience Improvements**:
   - Products display session duration (e.g., "30분 세션", "60분 세션")
   - Appointment cards show duration information
   - Better visual indicators for different session types
   - Improved booking confirmation with duration details
   - Duration selection popups with clear visual distinction

**Files Modified**:
- `database/migrations/004_add_variable_session_durations.sql` - Database migration
- `public/sql/schema.sql` - Updated main schema with duration fields  
- `public/sql/dummy.sql` - Updated sample data with duration information
- `src/app/api/products/route.ts` - Added duration_minutes to API response
- `src/app/api/appointments/route.ts` - Enhanced with duration-aware booking and conflict detection
- `src/app/api/trainer-availability/route.ts` - Added duration information to unavailable slots
- `src/app/dashboard/schedule/page.tsx` - Major update with duration-aware calendar logic
- `src/app/dashboard/purchase/page.tsx` - Updated to display session durations

**Implementation Phases**:
1. ✅ **Phase 1**: Database Schema Changes - Added duration fields and indexes
2. ✅ **Phase 2**: API Endpoint Updates - Enhanced APIs with duration support  
3. ✅ **Phase 3**: Frontend Component Updates - Calendar and purchase page improvements
4. ✅ **Phase 4**: Conflict Detection - Proper time range overlap detection
5. ✅ **Phase 5**: Testing & Edge Cases - Build validation and linting complete

**Technical Implementation Details**:
- **Backwards Compatibility**: All existing appointments default to 60-minute duration
- **Conflict Detection Algorithm**: Time range overlap logic prevents booking conflicts
- **Calendar Logic**: 30-minute slots with duration-aware appointment display
- **Point System**: Unchanged - 1 point = 1 session (regardless of duration)
- **Database Constraints**: Duration limited to 30 or 60 minutes with CHECK constraints

**Testing**: Build compilation successful ✅ | ESLint validation passed ✅

### Big Overhaul #3 - Trainer Assignment & Trainer Types System (Completed ✅)
**Date**: August 2025
**Status**: ✅ COMPLETED - All features implemented and tested

**Objective**: Implement a comprehensive trainer assignment system where each user is assigned to one specific trainer and can only book appointments with that trainer. Additionally, introduce trainer types (head trainer vs regular trainer) with different pricing structures.

**Key Features Implemented**:
1. **Trainer Assignment System**:
   - Each user must be assigned to exactly one trainer during registration
   - Users can only book appointments with their assigned trainer
   - Database-level constraints prevent cross-trainer bookings
   - Application-level validation ensures trainer assignment restrictions

2. **Trainer Types & Pricing Structure**:
   - **Head Trainers**: Premium trainers with higher pricing (trainer_type: 'head_trainer')
   - **Regular Trainers**: Standard trainers with normal pricing (trainer_type: 'trainer')
   - Products are trainer-type specific with different pricing tiers
   - Points from different trainer types cannot be used interchangeably

3. **Enhanced Registration Process**:
   - Signup page includes trainer selection with detailed trainer type information
   - Visual indicators show trainer specializations and pricing differences
   - Validation ensures trainer selection is mandatory
   - Educational messaging about trainer assignment permanence

**Database Schema Changes**:
```sql
-- Users table additions
ALTER TABLE users ADD COLUMN trainer_type VARCHAR(20) CHECK (trainer_type IN ('trainer', 'head_trainer'));
ALTER TABLE users ADD COLUMN assigned_trainer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Products table additions  
ALTER TABLE products ADD COLUMN trainer_type VARCHAR(20) NOT NULL CHECK (trainer_type IN ('trainer', 'head_trainer')) DEFAULT 'trainer';

-- Database triggers for business rule enforcement
CREATE TRIGGER enforce_trainer_assignment BEFORE INSERT OR UPDATE ON appointments...
```

**API Endpoint Updates**:
- **`/api/trainers`**: Now includes trainer_type information, sorted by trainer type
- **`/api/products`**: Filters products by user's assigned trainer type for regular users
- **`/api/purchase-logs`**: Validates users can only purchase products for their trainer type
- **`/api/appointments`**: Enforces trainer assignment restrictions during booking
- **`/api/user-points`**: Filters point batches by trainer type compatibility
- **`/api/auth/signup`**: Enhanced with trainer assignment validation and storage

**Frontend Component Updates**:
- **Signup Page**: 
  - Trainer selection dropdown with trainer type indicators
  - Educational content about trainer types and pricing differences
  - Trainer assignment validation and error handling
- **Schedule Page**: 
  - Regular users see only their assigned trainer (no selection dropdown)
  - Beautiful assigned trainer display card with trainer information
  - Admins/trainers retain full trainer selection capability
- **Purchase Page**: Products automatically filtered by trainer type compatibility
- **Dashboard Header**: Points display remains duration-aware (30min/60min separation)

**Business Logic Implementation**:
- **Trainer Assignment Rules**: 
  - Users assigned during registration, difficult to change afterward
  - Database triggers prevent appointment booking with wrong trainers
  - Application validates trainer assignment at multiple layers
- **Product Filtering**: 
  - Users only see products compatible with their trainer type
  - Purchase validation prevents cross-trainer-type product purchases
  - Point batches maintain trainer type association through product relationship
- **Pricing Structure**:
  - Head trainer products: Premium pricing (e.g., 30min 5pts = ₩50,000)
  - Regular trainer products: Standard pricing (e.g., 30min 5pts = ₩25,000)
  - Separate product lines for each trainer type

**Test Data Structure**:
- **Trainers Created**:
  - Head Trainer Kim (head_trainer) - Premium Personal Training
  - Trainer Lee (trainer) - General Fitness  
  - Trainer Park (trainer) - Weight Training
- **Test Users**:
  - User with Head Trainer → assigned to Head Trainer Kim
  - User with Regular Trainer → assigned to Trainer Lee
  - User with Regular Trainer 2 → assigned to Trainer Park
- **Products**: 8 products total (4 head trainer, 4 regular trainer) with different pricing

**Security & Validation**:
- Database-level constraints prevent data integrity violations
- Application-level validation provides user-friendly error messages
- Authentication middleware updated to include assigned_trainer_id
- CSRF protection maintained throughout trainer assignment process

**Files Modified**:
- `public/sql/schema.sql` - Updated with trainer assignment fields and constraints
- `database/migrations/005_add_trainer_assignment_system.sql` - Migration script
- `database/reset_with_trainer_assignments.sql` - Test data with trainer assignments
- `src/lib/auth-middleware.ts` - Updated AuthenticatedUser interface
- `src/app/signup/page.tsx` - Enhanced with trainer selection UI
- `src/app/api/auth/signup/route.ts` - Trainer assignment validation
- `src/app/api/trainers/route.ts` - Added trainer_type information
- `src/app/api/products/route.ts` - Trainer type filtering for regular users
- `src/app/api/purchase-logs/route.ts` - Trainer type validation during purchase
- `src/app/api/appointments/route.ts` - Trainer assignment validation during booking
- `src/app/api/user-points/route.ts` - Trainer type filtering for point batches
- `src/app/dashboard/schedule/page.tsx` - Assigned trainer display for regular users

**Implementation Phases**:
1. ✅ **Phase 1**: Database schema design and migration creation
2. ✅ **Phase 2**: API endpoint updates with trainer type filtering and validation  
3. ✅ **Phase 3**: Frontend component updates (signup, schedule, purchase pages)
4. ✅ **Phase 4**: Authentication middleware enhancement with trainer assignment
5. ✅ **Phase 5**: Test data creation and database reset with trainer assignments
6. ✅ **Phase 6**: End-to-end testing and validation

**Technical Implementation Details**:
- **Database Triggers**: Enforce trainer assignment rules at the database level
- **Product Association**: Trainer types linked through product relationships
- **Point Filtering**: Uses JOIN queries to filter by trainer type compatibility  
- **UI Conditional Rendering**: Different interfaces for users vs admins/trainers
- **Type Safety**: Enhanced TypeScript interfaces for trainer assignment fields

**Business Impact**:
- **Revenue Optimization**: Different pricing tiers for trainer types
- **User Experience**: Clear trainer assignment with personalized experience  
- **Operational Efficiency**: Streamlined appointment booking with assigned trainers
- **Data Integrity**: Database-level constraints prevent booking rule violations

**Testing**: Database migration successful ✅ | Test data loaded ✅ | API endpoints validated ✅

## Database Management & Testing

### Development Database Reset Scripts
**Location**: `database/` directory
**Purpose**: Quick database reset and test account creation for development/testing

**Available Scripts**:
- `reset_and_create_accounts.sql` - Main SQL script for database reset
- `reset_database.sh` - User-friendly shell wrapper with safety prompts
- `generate_password_hash.js` - Utility for generating bcrypt password hashes
- `README.md` - Complete documentation

**Usage**:
```bash
# Easy method with safety prompts
./database/reset_database.sh

# Direct SQL execution
psql -d database_name -f database/reset_and_create_accounts.sql
```

**What the Reset Script Does**:
1. Truncates all tables in proper dependency order
2. Creates 3 test accounts with secure bcrypt password hashing
3. Sets up basic product packages with variable durations
4. Includes verification queries and status reporting

### Test Accounts (Password: `password!`)
- **`admin@ptvit.com`** - Admin role, full system access
- **`trainer@ptvit.com`** - Trainer role, General Fitness specialization  
- **`user@ptvit.com`** - User role, standard customer access

### Test Products Created
- **30분 패키지 5회** - 5 points, 30min sessions, ₩25,000
- **30분 패키지 10회** - 10 points, 30min sessions, ₩45,000
- **60분 패키지 5회** - 5 points, 60min sessions, ₩85,000
- **60분 패키지 10회** - 10 points, 60min sessions, ₩200,000

**Security Features**:
- Bcrypt password hashing with 10 salt rounds
- Generated hash: `$2b$10$yA.GoEz0mmqjbeDZTxjqd.Ene/ZaqFAOILyMTdhAsG2lCskVND2p2`
- Safe for development/testing environments only
- Includes warning prompts to prevent accidental production use

## Testing & Validation

**Test Scripts**: Comprehensive test suite validates all implemented features
- `test-features-only.js` - Static code analysis (no server required)
- `test-script.js` - Full integration testing (server required)
- **Documentation**: See `TEST_README.md` for complete testing guide

**Test Coverage**:
- ✅ **Big Overhaul #1**: No-show functionality (100% pass rate)
- ✅ **Big Overhaul #2**: Variable session durations (100% pass rate)  
- ✅ Database schema and API endpoints
- ✅ Frontend components and user interfaces
- ✅ Authentication and database management

**Quick Test Commands**:
```bash
# Feature validation (no setup)
node test-features-only.js

# Full integration testing  
npm run dev
./database/reset_database.sh
node test-script.js
```

**Latest Test Results**: All 23+ tests passing with 100% success rate ✅

**Recent Bug Fix**: Session authentication schema mismatch resolved
- **Issue**: Database schema used `session_token` column but code referenced `token`
- **Error**: `"Could not find the 'token' column of 'sessions' in the schema cache"`
- **Fix**: Updated session management code to use correct `session_token` column name
- **Files Updated**: `src/lib/session.ts`, `src/lib/auth-middleware.ts`
- **Status**: ✅ Authentication working correctly

## Appointment Booking System - Technical Implementation

### Point-Based Booking Flow
The appointment booking system uses a sophisticated point-based architecture with trainer type restrictions and duration-aware scheduling. Here's the detailed technical flow:

#### 1. User Points Architecture
```typescript
interface UserPointsData {
  totalPoints: number;
  pointsByDuration: {
    30: number;  // 30-minute session points
    60: number;  // 60-minute session points  
  };
  batchesByDuration: {
    30: PointBatch[];  // Point batches for 30min sessions
    60: PointBatch[];  // Point batches for 60min sessions
  };
}

interface PointBatch {
  id: string;
  product_id: string;           // Links to specific product
  remaining_points: number;
  original_points: number;
  purchase_date: string;
  expiry_date: string;
  is_active: boolean;
}
```

#### 2. Booking Process Flow
1. **Authentication Check**: User must be logged in with valid session
2. **Trainer Assignment Validation**: Users can only book with their assigned trainer
3. **Point Availability Check**: 
   - Frontend calls `/api/user-points` to get available points
   - Points filtered by assigned trainer type (head_trainer vs trainer)
   - Returns duration-specific point counts (30min/60min)
4. **Time Slot Validation**: 
   - Checks for conflicts with existing appointments
   - Considers appointment duration for overlap detection
   - Validates 1-hour advance booking requirement
5. **Product Matching**: 
   - Matches available point batches with compatible products
   - Uses FIFO (First In, First Out) for point batch consumption
6. **Duration Selection**: 
   - If user has both 30min and 60min points: Shows duration selection popup
   - If user has only one type: Skips directly to confirmation
7. **Appointment Creation**: 
   - Deducts 1 point from selected batch
   - Creates appointment record with proper duration
   - Logs action in appointment_logs table

#### 3. Key API Endpoints

**`/api/user-points`**
- **Purpose**: Returns user's available points grouped by duration
- **Trainer Type Filtering**: Only returns points for products matching assigned trainer type
- **Critical Field**: Must include `product_id` in SELECT query for frontend product matching
- **Response Structure**: Duration-separated points with batch details

**`/api/appointments` (POST)**
- **Authentication**: Requires valid session cookie
- **Validation Steps**:
  1. Verifies user can only book with assigned trainer (role !== 'admin')
  2. Finds available point batches with matching product_id
  3. Checks for time slot conflicts with duration consideration
  4. Deducts point and creates appointment
- **FIFO Point Consumption**: Uses oldest point batch first (`ORDER BY purchase_date ASC`)

**`/api/products`**
- **Trainer Type Filtering**: Regular users only see products for their trainer type
- **Admin/Trainer Access**: Can see all products
- **Used For**: Frontend product matching during booking confirmation

#### 4. Frontend Booking Logic (`/dashboard/schedule`)

**Time Slot Click Handler**:
```typescript
const handleSlotClick = (date: string, time: string) => {
  // 1. Check if slot has existing appointment
  // 2. If available, call checkPointsAndShowBookingPopup()
  // 3. Show appropriate popup based on available points
}
```

**Points Validation**:
```typescript
const checkPointsAndShowBookingPopup = () => {
  // 1. Verify userPoints loaded
  // 2. Check pointsByDuration for available points
  // 3. Match point batches with loaded products via product_id
  // 4. Show duration selection or direct confirmation
}
```

**Product Matching Logic**:
```typescript
const getAvailableProductForDuration = (duration: number) => {
  // 1. Get point batches for requested duration
  // 2. Extract product_id from first available batch
  // 3. Find matching product in loaded products array
  // 4. Return product for booking confirmation
}
```

#### 5. Critical Bug Fix (August 2025)
**Issue**: Booking failed with "세션 상품 정보를 찾을 수 없습니다" (Session product information not found)
**Root Cause**: `/api/user-points` was not selecting `product_id` field from point_batches table
**Solution**: Added `product_id` to SELECT query in user-points API endpoint
**Files Modified**: 
- `src/app/api/user-points/route.ts` - Added `product_id` to SELECT statement
- `src/app/api/auth/me/route.ts` - Added `assigned_trainer_id` to user response
- `src/app/api/auth/login/route.ts` - Added `assigned_trainer_id` to login response
- `src/lib/auth.ts` - Updated User interface and database queries

#### 6. Database Schema Dependencies
```sql
-- Point batches link to products for trainer type filtering
point_batches.product_id → products.id
products.trainer_type → users.trainer_type (for trainers)
users.assigned_trainer_id → users.id (trainer assignment)

-- Appointment booking validation
appointments.trainer_id = user.assigned_trainer_id (enforced by API)
appointments.product_id = point_batch.product_id (links consumed points)
```

#### 7. Error Handling & User Experience
- **No Points**: "예약하려면 포인트가 필요합니다!" 
- **Product Not Found**: "X분 세션 상품 정보를 찾을 수 없습니다."
- **Authentication Required**: Redirects to login page
- **Trainer Assignment**: Validates during booking attempt
- **Time Conflicts**: Shows specific conflict details with duration

#### 8. Testing & Validation
- **Test Account**: `user-head@ptvit.com` / `password!` (assigned to Head Trainer Kim)
- **Available Points**: 10x 30min points + 10x 60min points (head trainer products)
- **Debug Logging**: Console logs show point loading, product matching, and booking flow
- **Status**: ✅ Fully functional booking system with all validations working