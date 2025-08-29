const fetch = require('node-fetch');

async function testExportEndpoints() {
  const baseUrl = 'http://localhost:4000/api';
  
  // First, let's test the academic years endpoint
  console.log('Testing academic years endpoint...');
  try {
    const response = await fetch(`${baseUrl}/export/academic-years`);
    const data = await response.json();
    console.log('Academic years response:', data);
  } catch (error) {
    console.error('Academic years error:', error.message);
  }

  // Test CSV export (this will need authentication)
  console.log('\nTesting CSV export endpoint...');
  try {
    const response = await fetch(`${baseUrl}/export/csv?academicYear=2024-25`);
    console.log('CSV export status:', response.status);
    const text = await response.text();
    console.log('CSV export response:', text.substring(0, 200) + '...');
  } catch (error) {
    console.error('CSV export error:', error.message);
  }
}

testExportEndpoints();
