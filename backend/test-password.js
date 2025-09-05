const bcrypt = require('bcryptjs');

// The Demo Teacher's hash from database
const storedHash = '$2a$12$TuR3/GGN40nc4OW5DXF7FOLobXERyGAYtXfkhvZViJ9ghLPoEjGxe';

// Common passwords to try
const passwords = [
  'teacher123hash',
  'teacher123',
  'password',
  'demo123',
  'teacher',
  'demoteacher',
  'teacher@demo.com',
  'demo',
  '123456',
  'admin123'
];

async function testPasswords() {
  console.log('Testing passwords for Demo Teacher...\n');
  
  for (const password of passwords) {
    try {
      const isMatch = await bcrypt.compare(password, storedHash);
      console.log(`Password: "${password}" - ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
      
      if (isMatch) {
        console.log(`\n🎉 Found it! The password is: "${password}"`);
        break;
      }
    } catch (error) {
      console.log(`Password: "${password}" - ❌ Error: ${error.message}`);
    }
  }
}

testPasswords();
