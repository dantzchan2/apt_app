#!/usr/bin/env node

// Generate Password Hash for Database Setup
// This script generates the bcrypt hash for "password!" to use in SQL scripts

const bcrypt = require('bcrypt');

async function generatePasswordHash() {
    const password = 'password!';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Password:', password);
        console.log('Bcrypt Hash:', hash);
        console.log('\nUse this hash in your SQL script:');
        console.log(`'${hash}'`);
        
        // Verify the hash works
        const isValid = await bcrypt.compare(password, hash);
        console.log('\nVerification:', isValid ? '✅ Hash is valid' : '❌ Hash is invalid');
        
    } catch (error) {
        console.error('Error generating hash:', error);
    }
}

generatePasswordHash();