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
- Demo authentication using localStorage
- Default demo credentials: `admin@aptapp.com` / `password`
- User data stored in localStorage with structure:
  ```typescript
  {
    name: string;
    email: string;
    role: 'user' | 'trainer';
    points?: number;
    id: string;
  }
  ```

### Core Features
1. **User Management**: Login/signup flows with localStorage-based session management
2. **Point System**: Users purchase points to book appointments (1 point = 1 hour session)
3. **Appointment Booking**: 10-minute interval scheduling from 6:00 AM to 9:50 PM
4. **Trainer Management**: Hardcoded trainer list with specializations

### Data Storage
- All data is stored in localStorage (no backend/database)
- Key storage items:
  - `isAuthenticated`: Authentication status
  - `userData`: User profile and points
  - `appointments`: Array of all appointments

### Route Structure
- `/` - Landing page
- `/login` - Authentication page
- `/signup` - User registration
- `/dashboard` - Main user dashboard
- `/dashboard/purchase` - Point purchase interface
- `/dashboard/schedule` - Appointment booking and management

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
- No global state management library
- Data persistence via localStorage

### Time Handling
- All times stored as strings in HH:MM format
- Date validation prevents past bookings
- Time slot availability checking against existing appointments

### User Experience
- Responsive design with mobile-first approach
- Loading states and form validation
- Alert-based notifications (could be enhanced with toast notifications)