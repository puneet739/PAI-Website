// Script to generate bcrypt password hashes
import bcrypt from 'bcryptjs';

const password = 'password123';
const saltRounds = 10;

const hash = await bcrypt.hash(password, saltRounds);
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nUse this hash in your SQL file:');
console.log(`'${hash}'`);
