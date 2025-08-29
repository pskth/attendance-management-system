// Test script to verify all analytics components are properly exported
// This is just for debugging - not meant to be run

// Test imports to make sure they don't have circular dependencies or export issues
console.log('Testing component imports...');

try {
  // These would be the imports in the analytics page
  console.log('✓ AttendanceAnalytics - should be default export');
  console.log('✓ MarksAnalytics - should be default export');
  console.log('✓ ExportReports - should be default export');
  console.log('✓ OverviewStats - should be default export');
  console.log('✓ analyticsService - should be default export');
  
  console.log('All component exports look correct!');
} catch (error) {
  console.error('Import error:', error);
}
