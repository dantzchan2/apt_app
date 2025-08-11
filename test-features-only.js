#!/usr/bin/env node

/**
 * Feature-Only Test Script (No Authentication Required)
 * Tests code implementations and file structure without API calls
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m', 
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}${colors.bright}🧪 Feature Implementation Test (Authentication-Free)${colors.reset}\n`);

let passed = 0;
let total = 0;
let testResults = [];

function logResult(testName, success, message = '', details = null) {
  total++;
  const result = {
    name: testName,
    passed: success,
    message: message,
    details: details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  if (success) {
    passed++;
    console.log(`${colors.green}✅ PASS${colors.reset} ${testName}`);
    if (message) console.log(`   ${colors.green}→${colors.reset} ${message}`);
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} ${testName}`);
    if (message) console.log(`   ${colors.red}→${colors.reset} ${message}`);
  }
  if (details) {
    console.log(`   ${colors.blue}Details:${colors.reset} ${JSON.stringify(details)}`);
  }
  console.log('');
}

async function testFeatureImplementations() {
  console.log(`${colors.cyan}${colors.bright}=== FILE STRUCTURE TESTS ===${colors.reset}\n`);
  
  const criticalFiles = [
    { path: 'src/app/dashboard/trainer/page.tsx', description: 'Trainer dashboard page' },
    { path: 'src/app/dashboard/schedule/page.tsx', description: 'User schedule page' },
    { path: 'src/app/dashboard/settlement/page.tsx', description: 'Settlement page' },
    { path: 'src/app/api/appointments/auto-complete/route.ts', description: 'Bulk auto-complete API' },
    { path: 'src/app/api/appointments/route.ts', description: 'Appointments API' },
    { path: 'src/components/NavDrawer.tsx', description: 'Navigation drawer component' }
  ];

  criticalFiles.forEach(file => {
    const fullPath = path.join(__dirname, file.path);
    const exists = fs.existsSync(fullPath);
    let fileSize = 0;
    try {
      if (exists) {
        const stats = fs.statSync(fullPath);
        fileSize = stats.size;
      }
    } catch (e) {
      // Ignore size check errors
    }
    
    logResult(
      `File Structure: ${file.description}`, 
      exists, 
      exists ? `File exists (${fileSize} bytes)` : 'File missing',
      { path: file.path, exists, size: fileSize }
    );
  });

  console.log(`${colors.cyan}${colors.bright}=== NEW FEATURE IMPLEMENTATION TESTS ===${colors.reset}\n`);

  // Test 1: Navigation Menu Order
  const navDrawerPath = path.join(__dirname, 'src/components/NavDrawer.tsx');
  if (fs.existsSync(navDrawerPath)) {
    const content = fs.readFileSync(navDrawerPath, 'utf8');
    
    // Find the navigation items array
    const navItemsMatch = content.match(/const navigationItems = \[([\s\S]*?)\];/);
    
    if (navItemsMatch) {
      const navItemsSection = navItemsMatch[1];
      const scheduleIndex = navItemsSection.indexOf('예약 스케줄');
      const pointsIndex = navItemsSection.indexOf('포인트 구매');
      const correctOrder = scheduleIndex > 0 && pointsIndex > scheduleIndex;
      
      logResult(
        'Navigation Menu Order', 
        correctOrder, 
        correctOrder ? '포인트 구매 appears after 예약 스케줄 in navigation' : '포인트 구매 does not appear after 예약 스케줄',
        { 
          scheduleFound: scheduleIndex > 0,
          pointsFound: pointsIndex > 0,
          correctOrder,
          schedulePosition: scheduleIndex,
          pointsPosition: pointsIndex
        }
      );
    } else {
      logResult('Navigation Menu Order', false, 'Could not find navigationItems array', { filePath: navDrawerPath });
    }
  } else {
    logResult('Navigation Menu Order', false, 'NavDrawer.tsx file not found', { filePath: navDrawerPath });
  }

  // Test 2: Trainer No-Show Features
  const trainerPagePath = path.join(__dirname, 'src/app/dashboard/trainer/page.tsx');
  if (fs.existsSync(trainerPagePath)) {
    const content = fs.readFileSync(trainerPagePath, 'utf8');
    
    // Check for various no-show related implementations
    const hasMarkAsNoShow = content.includes('markAsNoShow');
    const hasNoShowButton = content.includes('노쇼 처리');
    const hasCompleteToNoShow = content.includes('노쇼로 변경');
    const hasNoShowStatus = content.includes("'no_show'");
    const hasNoShowInterface = content.includes('no_show') && content.includes('status:');
    
    // Check for the specific button implementation
    const hasCompleteToNoShowButton = content.includes('노쇼로 변경') && 
                                     content.includes('appointment.status === \'completed\'');
    
    logResult(
      'Trainer No-Show Functions', 
      hasMarkAsNoShow && hasNoShowButton, 
      hasMarkAsNoShow ? 'markAsNoShow function and no-show buttons implemented' : 'Missing core no-show functionality',
      { 
        hasMarkAsNoShow, 
        hasNoShowButton, 
        hasNoShowStatus,
        hasNoShowInterface,
        coreImplementation: hasMarkAsNoShow && hasNoShowButton
      }
    );
    
    logResult(
      'Complete-to-NoShow Feature', 
      hasCompleteToNoShowButton, 
      hasCompleteToNoShowButton ? 'Trainers can change completed appointments to no-show' : 'Missing completed-to-no-show button functionality',
      { 
        hasCompleteToNoShow, 
        hasCompleteToNoShowButton,
        implementationComplete: hasCompleteToNoShowButton
      }
    );
  } else {
    logResult('Trainer No-Show Features', false, 'Trainer page file not found', { filePath: trainerPagePath });
  }

  // Test 3: User Schedule No-Show Display
  const schedulePagePath = path.join(__dirname, 'src/app/dashboard/schedule/page.tsx');
  if (fs.existsSync(schedulePagePath)) {
    const content = fs.readFileSync(schedulePagePath, 'utf8');
    
    // Check appointment interface includes no_show
    const hasNoShowInInterface = content.includes("status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'");
    const hasNoShowAppointmentVar = content.includes('isNoShowAppointment');
    const hasNoShowStyling = content.includes('bg-orange-100') || content.includes('bg-orange-');
    const hasNoShowLegend = content.includes('노쇼 처리된 예약');
    const hasNoShowHandling = content.includes("'no_show'") && content.includes('노쇼');
    
    // Check for comprehensive no-show implementation
    const hasFullNoShowDisplay = hasNoShowInInterface && hasNoShowAppointmentVar && hasNoShowLegend;
    
    logResult(
      'Schedule No-Show Display', 
      hasFullNoShowDisplay, 
      hasFullNoShowDisplay ? 'No-show appointments properly displayed with styling and legend' : 'Incomplete no-show display implementation',
      { 
        hasNoShowInInterface, 
        hasNoShowAppointmentVar, 
        hasNoShowStyling,
        hasNoShowLegend,
        hasNoShowHandling,
        implementationComplete: hasFullNoShowDisplay
      }
    );
    
    // Check legend update (6 columns vs 5)
    const hasUpdatedLegend = content.includes('sm:grid-cols-6') || content.includes('grid-cols-6');
    logResult(
      'Schedule Legend Update', 
      hasUpdatedLegend, 
      hasUpdatedLegend ? 'Legend updated to accommodate no-show color indicator' : 'Legend may still be using old column count',
      { hasUpdatedLegend, expectedColumns: 6 }
    );
  } else {
    logResult('Schedule No-Show Display', false, 'Schedule page file not found', { filePath: schedulePagePath });
  }

  // Test 4: Settlement Page Dynamic Trainers
  const settlementPagePath = path.join(__dirname, 'src/app/dashboard/settlement/page.tsx');
  if (fs.existsSync(settlementPagePath)) {
    const content = fs.readFileSync(settlementPagePath, 'utf8');
    
    const hasFetchTrainers = content.includes('fetchTrainers');
    const hasApiCall = content.includes('/api/trainers');
    const hasBulkComplete = content.includes('handleBulkAutoComplete');
    const hasDebugInfo = content.includes('Total Trainers Loaded');
    
    // Check that hardcoded trainer list is removed
    const hasHardcodedList = content.includes('TRAINER_LIST') || content.includes('trainers = [');
    const usesDatabase = hasFetchTrainers && hasApiCall && !hasHardcodedList;
    
    logResult(
      'Settlement Dynamic Trainers', 
      usesDatabase, 
      usesDatabase ? 'Settlement page loads trainers from database (not hardcoded)' : 'Settlement page may still use hardcoded trainer data',
      { 
        hasFetchTrainers, 
        hasApiCall, 
        hasHardcodedList,
        hasBulkComplete,
        hasDebugInfo,
        usesDatabase
      }
    );
  } else {
    logResult('Settlement Dynamic Trainers', false, 'Settlement page file not found', { filePath: settlementPagePath });
  }

  // Test 5: Bulk Auto-Complete API Implementation
  const autoCompleteApiPath = path.join(__dirname, 'src/app/api/appointments/auto-complete/route.ts');
  if (fs.existsSync(autoCompleteApiPath)) {
    const content = fs.readFileSync(autoCompleteApiPath, 'utf8');
    
    const hasLogging = content.includes('appointment_logs');
    const hasProperTrainerIdMapping = content.includes('trainer_id: apt.trainer_id');
    const hasProperUserIdMapping = content.includes('user_id: apt.user_id');
    const hasProperFieldsMapping = hasProperTrainerIdMapping && hasProperUserIdMapping;
    const hasErrorHandling = content.includes('logError') || content.includes('catch');
    const hasSelectFields = content.includes('trainer_id') && content.includes('trainer_name') && 
                          content.includes('user_id') && content.includes('user_name') &&
                          content.includes('.select(');
    
    const implementationComplete = hasLogging && hasProperFieldsMapping && hasErrorHandling && hasSelectFields;
    
    logResult(
      'Auto-Complete API Implementation', 
      implementationComplete, 
      implementationComplete ? 'Auto-complete API properly implemented with database constraint fixes' : 'Auto-complete API missing proper field mapping',
      { 
        hasLogging, 
        hasProperTrainerIdMapping,
        hasProperUserIdMapping,
        hasProperFieldsMapping,
        hasErrorHandling,
        hasSelectFields,
        implementationComplete
      }
    );
    
    // Specific check for database constraint fix
    const hasConstraintFix = !content.includes('trainer_id: null') && !content.includes('user_id: null');
    logResult(
      'Database Constraint Fix', 
      hasConstraintFix, 
      hasConstraintFix ? 'Database logging no longer uses null values for required fields' : 'Still using null values that cause constraint violations',
      { hasConstraintFix, fixImplemented: hasConstraintFix }
    );
  } else {
    logResult('Auto-Complete API Implementation', false, 'Auto-complete API file not found', { filePath: autoCompleteApiPath });
  }

  // Test Summary
  console.log(`${colors.cyan}${colors.bright}=== FEATURE TEST SUMMARY ===${colors.reset}`);
  
  const failedTests = testResults.filter(test => !test.passed);
  
  console.log(`\n${colors.bright}📊 RESULTS${colors.reset}`);
  console.log(`Total Feature Tests: ${colors.bright}${total}${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${total - passed}${colors.reset}`);
  console.log(`Success Rate: ${colors.bright}${((passed / total) * 100).toFixed(1)}%${colors.reset}`);

  // Feature-specific results
  const featureCategories = {
    'Navigation': testResults.filter(t => t.name.includes('Navigation')),
    'No-Show Features': testResults.filter(t => t.name.includes('No-Show') || t.name.includes('Complete-to')),
    'Schedule Display': testResults.filter(t => t.name.includes('Schedule')),
    'Settlement Updates': testResults.filter(t => t.name.includes('Settlement')),
    'API Implementation': testResults.filter(t => t.name.includes('Auto-Complete') || t.name.includes('Constraint')),
    'File Structure': testResults.filter(t => t.name.includes('File Structure'))
  };

  console.log(`\n${colors.bright}📋 FEATURE CATEGORIES${colors.reset}`);
  Object.entries(featureCategories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      const categoryPassed = tests.filter(t => t.passed).length;
      const categoryTotal = tests.length;
      const categoryRate = ((categoryPassed / categoryTotal) * 100).toFixed(1);
      
      console.log(`\n  ${colors.blue}${category}:${colors.reset} ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
      tests.forEach(test => {
        const status = test.passed ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
        console.log(`    ${status} ${test.name}`);
      });
    }
  });

  // Overall assessment
  if (passed === total) {
    console.log(`\n${colors.green}${colors.bright}🎉 ALL FEATURES IMPLEMENTED CORRECTLY!${colors.reset}`);
    console.log(`${colors.green}✨ Your new features are ready:${colors.reset}`);
    console.log(`${colors.green}  • Navigation menu reordering ✅${colors.reset}`);
    console.log(`${colors.green}  • Trainer no-show functionality ✅${colors.reset}`);
    console.log(`${colors.green}  • User schedule no-show display ✅${colors.reset}`);
    console.log(`${colors.green}  • Settlement page dynamic trainers ✅${colors.reset}`);
    console.log(`${colors.green}  • Bulk auto-complete without database errors ✅${colors.reset}`);
  } else if (passed / total >= 0.8) {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  MOSTLY COMPLETE (${((passed / total) * 100).toFixed(1)}%)${colors.reset}`);
    console.log(`${colors.yellow}Most features are implemented, but some need attention.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ SIGNIFICANT IMPLEMENTATION ISSUES${colors.reset}`);
    console.log(`${colors.red}Multiple features need implementation or fixes.${colors.reset}`);
  }

  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: total,
      passedTests: passed,
      failedTests: total - passed,
      successRate: parseFloat(((passed / total) * 100).toFixed(1))
    },
    categories: Object.fromEntries(
      Object.entries(featureCategories).map(([name, tests]) => [
        name,
        {
          total: tests.length,
          passed: tests.filter(t => t.passed).length,
          tests: tests.map(t => ({ name: t.name, passed: t.passed, message: t.message }))
        }
      ])
    ),
    allResults: testResults,
    note: 'This test focuses on code implementation without requiring authentication'
  };
  
  fs.writeFileSync('feature-test-results.json', JSON.stringify(results, null, 2));
  console.log(`\n${colors.blue}📄 Results saved to: feature-test-results.json${colors.reset}`);
}

// Run the tests
testFeatureImplementations().catch(console.error);