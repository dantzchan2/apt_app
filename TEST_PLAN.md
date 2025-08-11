# Comprehensive Test Plan for New Features

This test plan covers all the new features we've implemented. Follow these steps to verify everything is working correctly.

## Prerequisites
1. Start the development server: `npm run dev`
2. Have at least one trainer account and one user account
3. Have some test appointments in different states

## Test Scenarios

### 1. Navigation Menu Reorder Test
**Feature**: "포인트 구매" appears after "예약 스케줄" in navigation menu

**Steps**:
1. Login as any user
2. Open navigation menu (hamburger icon)
3. **Verify**: Menu items appear in this order:
   - 대시보드
   - 예약 스케줄
   - 포인트 구매 ✅
   - 사용자 정보
   - (other items based on role)

**Expected Result**: "포인트 구매" should appear directly after "예약 스케줄"

---

### 2. Trainer Dashboard Display Test
**Feature**: Trainers can see their appointments and manage them

**Steps**:
1. Login as trainer account
2. Navigate to `/dashboard/trainer`
3. **Verify**: Page shows:
   - Debug info (in development mode)
   - Upcoming appointments section
   - Past appointments section
   - Appointment details (user name, date, time, status)

**Expected Result**: Trainer dashboard displays appointments without errors

---

### 3. Bulk Auto-Complete API Test
**Feature**: Admin can bulk complete past scheduled appointments

**Steps**:
1. Login as admin account
2. Navigate to `/dashboard/settlement`
3. Look for "지난 예약 자동 완료 처리" button
4. Click the button and confirm
5. **Verify**: 
   - Success message shows number of updated appointments
   - No database constraint errors in console
   - Past scheduled appointments change to completed status

**Expected Result**: Bulk completion works without database errors

---

### 4. Trainer No-Show Functionality Test
**Feature**: Trainers can mark scheduled appointments as no-show or completed

**Test 4a - Mark Scheduled as No-Show**:
1. Login as trainer
2. Navigate to `/dashboard/trainer`
3. Find a scheduled appointment that has passed its time
4. **Verify**: Two buttons appear: "완료 처리" and "노쇼 처리"
5. Click "노쇼 처리"
6. Confirm the action
7. **Verify**: 
   - Appointment status changes to "노쇼"
   - Status badge shows orange background
   - Success message appears

**Test 4b - Change Completed to No-Show**:
1. Login as trainer
2. Navigate to `/dashboard/trainer`
3. Find a completed appointment in past appointments section
4. **Verify**: "노쇼로 변경" button appears next to completed appointments
5. Click "노쇼로 변경"
6. Confirm the action
7. **Verify**:
   - Appointment status changes from "완료됨" to "노쇼"
   - Status badge changes from blue to orange
   - Success message appears

---

### 5. User Schedule No-Show Display Test
**Feature**: Users can see their no-show appointments in the schedule

**Steps**:
1. First, create a no-show appointment (use trainer dashboard from Test 4)
2. Login as the user who had the appointment
3. Navigate to `/dashboard/schedule`
4. **Verify**: 
   - No-show appointment appears with orange background (`bg-orange-100`)
   - Appointment shows "노쇼" text with orange badge
   - Legend includes "노쇼 처리된 예약" with orange color sample
   - Grid layout shows 6 legend items (including no-show)

**Test 5a - Click Behavior**:
1. Click on the no-show appointment slot
2. **Verify**: Alert shows "노쇼 처리된 예약입니다."

---

### 6. Settlement Page Dynamic Trainers Test
**Feature**: Settlement page loads trainers from database instead of hardcoded list

**Steps**:
1. Login as admin
2. Navigate to `/dashboard/settlement`
3. **Verify**:
   - Debug section shows "Total Trainers Loaded: X" (X > 0)
   - Trainer statistics table shows actual trainer names from database
   - No references to hardcoded trainer names
   - Statistics calculate correctly for each trainer

---

### 7. Database Logging Test
**Feature**: All appointment actions are properly logged without constraint errors

**Steps**:
1. Perform various appointment actions:
   - Book an appointment (as user)
   - Cancel an appointment (as user)
   - Mark as completed (as trainer)
   - Mark as no-show (as trainer)
   - Run bulk auto-complete (as admin)
2. Check browser console and server logs
3. **Verify**: No database constraint errors appear
4. **Optional**: Check database `appointment_logs` table for proper entries

---

### 8. Integration Test - Full Workflow
**Feature**: Complete appointment lifecycle works correctly

**Steps**:
1. **Book**: User books appointment
2. **View**: Trainer sees appointment in dashboard
3. **Time passes**: Appointment time passes
4. **Complete**: Trainer marks as completed
5. **Change**: Trainer changes to no-show
6. **View**: User sees no-show status in schedule
7. **Statistics**: Admin sees updated statistics in settlement page

**Expected Result**: All steps work without errors, data persists correctly

---

## Error Scenarios to Test

### 9. Error Handling Tests

**Test 9a - Insufficient Points**:
1. Login as user with 0 points
2. Try to book appointment
3. **Verify**: Error message about insufficient points

**Test 9b - Double Booking Prevention**:
1. Try to book same time slot that's already taken
2. **Verify**: Error message about slot being unavailable

**Test 9c - Past Appointment Actions**:
1. Try to cancel appointment after 24-hour cutoff
2. **Verify**: Appropriate error message

---

## Performance Tests

### 10. Load Time Tests
1. Navigate to each page and measure load times:
   - `/dashboard/trainer` - should load trainer appointments quickly
   - `/dashboard/schedule` - should load calendar view efficiently
   - `/dashboard/settlement` - should calculate statistics without delays

**Expected Result**: All pages load within 2 seconds with reasonable data sets

---

## Browser Console Checks

Throughout all tests, monitor browser console for:
- ❌ No JavaScript errors
- ❌ No failed API calls (400/500 status codes)
- ❌ No database constraint violation errors
- ❌ No authentication/authorization errors
- ✅ Successful API responses (200 status codes)
- ✅ Proper data transformation logs (in development mode)

---

## Test Data Requirements

For comprehensive testing, ensure you have:
- At least 2 trainer accounts
- At least 3 user accounts
- Appointments in different states:
  - Scheduled (future)
  - Scheduled (past) - for auto-complete testing
  - Completed
  - Cancelled
  - No-show
- Appointments across different dates for statistics testing

---

## Quick Test Commands

```bash
# Start development server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Run linting
npm run lint

# Build to check for production issues
npm run build
```

---

## Success Criteria

All features pass if:
1. ✅ Navigation menu shows correct order
2. ✅ Trainer dashboard displays appointments
3. ✅ Bulk auto-complete works without database errors
4. ✅ Trainers can mark appointments as no-show
5. ✅ Trainers can change completed to no-show
6. ✅ Users see no-show appointments in schedule
7. ✅ Settlement page uses dynamic trainer data
8. ✅ All database operations complete without constraint errors
9. ✅ No JavaScript errors in console
10. ✅ All API calls return successful responses

---

## Troubleshooting

If any test fails:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify database constraints and foreign key relationships
4. Ensure user roles and permissions are correct
5. Check that appointment data exists in expected states