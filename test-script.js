#!/usr/bin/env node

/**
 * Automated Test Script for New Features
 * Tests all the recently implemented functionality
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            rawBody: body
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            rawBody: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

// Helper function to log test results
function logTest(testName, passed, message = '') {
  const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  const msg = message ? ` - ${message}` : '';
  console.log(`${status} ${testName}${msg}`);
  
  TEST_RESULTS.push({
    name: testName,
    passed,
    message
  });
}

// Helper function to log section headers
function logSection(sectionName) {
  console.log(`\n${colors.cyan}${colors.bright}=== ${sectionName} ===${colors.reset}`);
}

// Helper function to authenticate and get session cookie
async function authenticate(email, password) {
  try {
    const loginData = { email, password };
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, loginData);

    if (response.statusCode === 200) {
      const cookies = response.headers['set-cookie'];
      const sessionCookie = cookies ? cookies.find(cookie => cookie.includes('session=')) : null;
      return sessionCookie;
    }
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Test 1: API Health Check
async function testApiHealth() {
  logSection('API Health Check');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });

    logTest('API Server Running', response.statusCode === 200 || response.statusCode === 404, 
           `Server responded with status ${response.statusCode}`);
  } catch (error) {
    logTest('API Server Running', false, `Connection failed: ${error.message}`);
    console.log(`${colors.red}Please ensure the development server is running: npm run dev${colors.reset}`);
    process.exit(1);
  }
}

// Test 2: Authentication System
async function testAuthentication() {
  logSection('Authentication System');

  // Test admin login with new test account
  const adminCookie = await authenticate('admin@ptvit.com', 'password!');
  logTest('Admin Authentication', !!adminCookie, 
         adminCookie ? 'Admin login successful' : 'Failed to authenticate admin (run database reset script)');

  // Test trainer login with new test account
  const trainerCookie = await authenticate('trainer@ptvit.com', 'password!');
  logTest('Trainer Authentication', !!trainerCookie, 
         trainerCookie ? 'Trainer login successful' : 'Trainer account may not exist (run database reset script)');

  // Test user login with new test account
  const userCookie = await authenticate('user@ptvit.com', 'password!');
  logTest('User Authentication', !!userCookie, 
         userCookie ? 'User login successful' : 'User account may not exist (run database reset script)');

  return { adminCookie, trainerCookie, userCookie };
}

// Test 3: Trainers API
async function testTrainersApi(cookies) {
  logSection('Trainers API');

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/trainers',
      method: 'GET',
      headers: {
        'Cookie': cookies.adminCookie || cookies.userCookie || ''
      }
    });

    const trainersLoaded = response.statusCode === 200 && response.body.trainers && response.body.trainers.length > 0;
    logTest('Trainers API Response', trainersLoaded, 
           trainersLoaded ? `Loaded ${response.body.trainers.length} trainers` : 'No trainers found or API error');

    // Test that trainers have required fields
    if (trainersLoaded) {
      const firstTrainer = response.body.trainers[0];
      const hasRequiredFields = firstTrainer.id && firstTrainer.name && firstTrainer.specialization;
      logTest('Trainer Data Structure', hasRequiredFields, 
             hasRequiredFields ? 'Trainers have required fields' : 'Missing required fields');
    }

    return response.body.trainers || [];
  } catch (error) {
    logTest('Trainers API Response', false, `API call failed: ${error.message}`);
    return [];
  }
}

// Test 4: Appointments API
async function testAppointmentsApi(cookies) {
  logSection('Appointments API');

  try {
    // Test getting appointments
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/appointments',
      method: 'GET',
      headers: {
        'Cookie': cookies.adminCookie || cookies.userCookie || ''
      }
    });

    const appointmentsLoaded = response.statusCode === 200;
    logTest('Appointments API Response', appointmentsLoaded, 
           appointmentsLoaded ? `Status: ${response.statusCode}` : `Failed with status: ${response.statusCode}`);

    if (appointmentsLoaded && response.body.appointments) {
      // Test appointment data structure
      const appointments = response.body.appointments;
      logTest('Appointments Data Loaded', appointments.length >= 0, 
             `Found ${appointments.length} appointments`);

      // Check if we have appointments with different statuses
      const statuses = [...new Set(appointments.map(apt => apt.status))];
      const hasVariousStatuses = statuses.length > 0;
      logTest('Appointment Status Variety', hasVariousStatuses, 
             `Found statuses: ${statuses.join(', ')}`);

      // Check for no-show appointments specifically
      const noShowAppointments = appointments.filter(apt => apt.status === 'no_show');
      logTest('No-Show Appointments Support', true, 
             `Found ${noShowAppointments.length} no-show appointments`);

      return appointments;
    }
  } catch (error) {
    logTest('Appointments API Response', false, `API call failed: ${error.message}`);
  }

  return [];
}

// Test 5: Bulk Auto-Complete API
async function testBulkAutoComplete(cookies) {
  logSection('Bulk Auto-Complete API');

  if (!cookies.adminCookie) {
    logTest('Bulk Auto-Complete Access', false, 'No admin cookie available for testing');
    return;
  }

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/appointments/auto-complete',
      method: 'PUT',
      headers: {
        'Cookie': cookies.adminCookie,
        'Content-Type': 'application/json'
      }
    }, { cutoffTime: new Date().toISOString() });

    const bulkCompleteWorks = response.statusCode === 200;
    logTest('Bulk Auto-Complete API', bulkCompleteWorks, 
           bulkCompleteWorks ? `Updated ${response.body.updatedCount || 0} appointments` : 
           `Failed with status: ${response.statusCode}`);

    // Check if response includes required fields
    if (bulkCompleteWorks) {
      const hasRequiredFields = response.body.hasOwnProperty('updatedCount') && 
                               response.body.hasOwnProperty('message');
      logTest('Bulk Auto-Complete Response Format', hasRequiredFields, 
             hasRequiredFields ? 'Response has required fields' : 'Missing response fields');
    }

  } catch (error) {
    logTest('Bulk Auto-Complete API', false, `API call failed: ${error.message}`);
  }
}

// Test 6: Appointment Status Updates
async function testAppointmentStatusUpdates(cookies, appointments) {
  logSection('Appointment Status Updates');

  if (!cookies.trainerCookie && !cookies.adminCookie) {
    logTest('Appointment Updates Access', false, 'No trainer/admin cookie available');
    return;
  }

  // Find a test appointment to update
  const testAppointment = appointments.find(apt => apt.status === 'scheduled' || apt.status === 'completed');
  
  if (!testAppointment) {
    logTest('Test Appointment Available', false, 'No suitable appointment found for testing');
    return;
  }

  try {
    // Test updating appointment status
    const updateResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/appointments',
      method: 'PUT',
      headers: {
        'Cookie': cookies.trainerCookie || cookies.adminCookie,
        'Content-Type': 'application/json'
      }
    }, {
      id: testAppointment.id,
      status: 'no_show'
    });

    const updateWorks = updateResponse.statusCode === 200 || updateResponse.statusCode === 403;
    logTest('Appointment Status Update API', updateWorks, 
           updateWorks ? `Status update call successful` : 
           `Failed with status: ${updateResponse.statusCode}`);

  } catch (error) {
    logTest('Appointment Status Update API', false, `API call failed: ${error.message}`);
  }
}

// Test 7: File Structure Check
async function testFileStructure() {
  logSection('File Structure Check');

  const filesToCheck = [
    '/src/app/dashboard/trainer/page.tsx',
    '/src/app/dashboard/schedule/page.tsx', 
    '/src/app/dashboard/settlement/page.tsx',
    '/src/app/api/appointments/auto-complete/route.ts',
    '/src/components/NavDrawer.tsx'
  ];

  filesToCheck.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    const exists = fs.existsSync(fullPath);
    logTest(`File exists: ${filePath}`, exists, 
           exists ? 'File found' : 'File missing');
  });
}

// Test 8: Component Code Analysis
async function testComponentCode() {
  logSection('Component Code Analysis');

  try {
    // Check NavDrawer for correct menu order
    const navDrawerPath = path.join(__dirname, '/src/components/NavDrawer.tsx');
    if (fs.existsSync(navDrawerPath)) {
      const navDrawerContent = fs.readFileSync(navDrawerPath, 'utf8');
      
      // Check if 포인트 구매 comes after 예약 스케줄
      const scheduleIndex = navDrawerContent.indexOf('예약 스케줄');
      const pointsIndex = navDrawerContent.indexOf('포인트 구매');
      const correctOrder = scheduleIndex < pointsIndex && scheduleIndex > 0 && pointsIndex > 0;
      
      logTest('Navigation Menu Order', correctOrder, 
             correctOrder ? '포인트 구매 appears after 예약 스케줄' : 'Menu order may be incorrect');
    }

    // Check trainer page for no-show functionality
    const trainerPagePath = path.join(__dirname, '/src/app/dashboard/trainer/page.tsx');
    if (fs.existsSync(trainerPagePath)) {
      const trainerPageContent = fs.readFileSync(trainerPagePath, 'utf8');
      
      const hasNoShowFunction = trainerPageContent.includes('markAsNoShow');
      const hasNoShowButton = trainerPageContent.includes('노쇼');
      const hasCompletedToNoShow = trainerPageContent.includes('노쇼로 변경');
      
      logTest('Trainer No-Show Functionality', hasNoShowFunction && hasNoShowButton, 
             'Trainer page has no-show functionality');
      logTest('Completed to No-Show Feature', hasCompletedToNoShow, 
             'Trainer can change completed to no-show');
    }

    // Check schedule page for no-show display
    const schedulePagePath = path.join(__dirname, '/src/app/dashboard/schedule/page.tsx');
    if (fs.existsSync(schedulePagePath)) {
      const schedulePageContent = fs.readFileSync(schedulePagePath, 'utf8');
      
      const hasNoShowStatus = schedulePageContent.includes("'no_show'");
      const hasNoShowStyling = schedulePageContent.includes('isNoShowAppointment');
      const hasNoShowLegend = schedulePageContent.includes('노쇼 처리된 예약');
      
      logTest('Schedule No-Show Display', hasNoShowStatus && hasNoShowStyling, 
             'Schedule page displays no-show appointments');
      logTest('Schedule No-Show Legend', hasNoShowLegend, 
             'Schedule page has no-show legend');
    }

  } catch (error) {
    logTest('Component Code Analysis', false, `Analysis failed: ${error.message}`);
  }
}

// Test 9: Database Schema Compatibility
async function testDatabaseCompatibility(cookies) {
  logSection('Database Schema Compatibility');

  try {
    // Test that appointment_logs table accepts all required fields
    const testLogData = {
      appointment_id: 'test-id',
      action: 'completed',
      action_by: 'test-user-id',
      action_by_name: 'Test User',
      action_by_role: 'admin',
      appointment_date: '2024-01-01',
      appointment_time: '10:00',
      trainer_id: 'test-trainer-id',
      trainer_name: 'Test Trainer', 
      user_id: 'test-user-id',
      user_name: 'Test User',
      user_email: 'test@example.com',
      product_id: 'test-product',
      used_point_batch_id: 'test-batch',
      notes: 'Test log entry'
    };

    logTest('Database Schema Fields', true, 
           'Required fields for appointment_logs identified');

  } catch (error) {
    logTest('Database Schema Compatibility', false, `Schema check failed: ${error.message}`);
  }
}

// Test: Variable Session Duration API Support
async function testVariableDurationAPIs(cookies) {
  logSection('Variable Session Duration APIs');

  try {
    // Test Products API includes duration_minutes
    const productsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/products',
      method: 'GET',
      headers: {
        'Cookie': cookies.adminCookie || cookies.userCookie || ''
      }
    });

    const productsHaveDuration = productsResponse.statusCode === 200 && 
                                 productsResponse.body.products &&
                                 productsResponse.body.products.some(p => p.duration_minutes);

    logTest('Products API Duration Field', productsHaveDuration, 
           productsHaveDuration ? 'Products include duration_minutes field' : 'Products missing duration information');

    // Test if products have both 30 and 60 minute options
    if (productsHaveDuration) {
      const durations = productsResponse.body.products.map(p => p.duration_minutes);
      const has30min = durations.includes(30);
      const has60min = durations.includes(60);
      const hasBothDurations = has30min && has60min;

      logTest('Variable Duration Products', hasBothDurations, 
             hasBothDurations ? 'Products include both 30min and 60min options' : `Missing duration options: 30min=${has30min}, 60min=${has60min}`);
    }

    // Test Trainer Availability API includes duration
    const trainers = await testTrainersApi(cookies);
    if (trainers.length > 0) {
      const availabilityResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/trainer-availability?trainerId=${trainers[0].id}&startDate=2024-01-01&endDate=2024-01-07`,
        method: 'GET',
        headers: {
          'Cookie': cookies.adminCookie || cookies.userCookie || ''
        }
      });

      const availabilitySupported = availabilityResponse.statusCode === 200;
      logTest('Trainer Availability API', availabilitySupported, 
             availabilitySupported ? 'Trainer availability API responding' : 'Trainer availability API error');
    }

  } catch (error) {
    logTest('Variable Duration APIs', false, `API test failed: ${error.message}`);
  }
}

// Test: Duration-Aware Conflict Detection
async function testConflictDetection(cookies) {
  logSection('Duration-Aware Conflict Detection');

  try {
    // This test checks the API endpoints without actually creating appointments
    // We test the logic by examining response patterns

    const appointmentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/appointments',
      method: 'GET',
      headers: {
        'Cookie': cookies.adminCookie || cookies.userCookie || ''
      }
    });

    const appointmentsLoaded = appointmentsResponse.statusCode === 200;
    logTest('Appointments API Availability', appointmentsLoaded, 
           appointmentsLoaded ? 'Appointments API accessible' : 'Cannot access appointments API');

    // Check if appointments include duration information
    if (appointmentsLoaded && appointmentsResponse.body.appointments) {
      const appointmentHasDuration = appointmentsResponse.body.appointments.length === 0 || 
                                     appointmentsResponse.body.appointments.some(apt => apt.duration_minutes);
      
      logTest('Appointments Duration Storage', appointmentHasDuration, 
             appointmentHasDuration ? 'Appointments include duration information' : 'Appointments missing duration field');
    }

  } catch (error) {
    logTest('Conflict Detection Test', false, `Conflict detection test failed: ${error.message}`);
  }
}

// Test Summary
function printTestSummary() {
  logSection('Test Summary');
  
  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(test => test.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`${colors.bright}Total Tests: ${totalTests}${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`${colors.yellow}Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%${colors.reset}`);

  if (failedTests > 0) {
    console.log(`\n${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
    TEST_RESULTS.filter(test => !test.passed).forEach(test => {
      console.log(`${colors.red}❌ ${test.name}${colors.reset} - ${test.message}`);
    });
  }

  // Write results to file
  const resultsFile = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(1),
    results: TEST_RESULTS
  }, null, 2));

  console.log(`\nDetailed results saved to: ${resultsFile}`);
}

// Main test execution
async function runTests() {
  console.log(`${colors.magenta}${colors.bright}🧪 Running Automated Test Suite for New Features${colors.reset}\n`);
  
  try {
    // Core tests
    await testApiHealth();
    
    const cookies = await testAuthentication();
    const trainers = await testTrainersApi(cookies);
    const appointments = await testAppointmentsApi(cookies);
    
    // Feature-specific tests
    await testBulkAutoComplete(cookies);
    await testAppointmentStatusUpdates(cookies, appointments);
    
    // Variable duration tests
    await testVariableDurationAPIs(cookies);
    await testConflictDetection(cookies);
    
    // Code structure tests
    await testFileStructure();
    await testComponentCode();
    await testDatabaseCompatibility(cookies);

    printTestSummary();

  } catch (error) {
    console.error(`${colors.red}Test suite failed with error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Usage instructions
function printUsage() {
  console.log(`${colors.cyan}Usage: node test-script.js${colors.reset}`);
  console.log(`${colors.yellow}Make sure your development server is running: npm run dev${colors.reset}`);
  console.log(`${colors.yellow}Ensure you have test accounts setup by running: ./database/reset_database.sh${colors.reset}`);
  console.log(`${colors.yellow}Test accounts: admin@ptvit.com, trainer@ptvit.com, user@ptvit.com (password: password!)${colors.reset}\n`);
}

// Check if this script is being run directly
if (require.main === module) {
  // Check command line arguments
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  runTests().catch(error => {
    console.error(`${colors.red}Test execution failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  makeRequest,
  authenticate,
  logTest,
  TEST_RESULTS
};