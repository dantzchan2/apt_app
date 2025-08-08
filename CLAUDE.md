# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 React application called "Studio Vit" - a point-based appointment scheduling system for fitness trainers. The app uses TypeScript, Tailwind CSS, and follows Next.js App Router architecture.

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
    specialization?: string;
    total_points: number;
    is_active: boolean;
  }
  ```

### Core Features
1. **User Management**: Login/signup flows with database-backed session management
2. **Point System**: Users purchase points to book appointments (1 point = 1 hour session)
3. **Appointment Booking**: 10-minute interval scheduling from 6:00 AM to 9:50 PM
4. **Trainer Management**: Hardcoded trainer list with specializations
5. **Security Features**: CSRF protection, rate limiting, password hashing with bcrypt

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