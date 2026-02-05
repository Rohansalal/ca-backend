const crypto = require('crypto');

console.log('🔐 Generating JWT Secrets for Production\n');
console.log('Copy these to your .env file:\n');
console.log('═'.repeat(80));

// Generate JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\nJWT_SECRET=' + jwtSecret);

// Generate Admin JWT secret
const adminJwtSecret = crypto.randomBytes(64).toString('hex');
console.log('ADMIN_JWT_SECRET=' + adminJwtSecret);

console.log('\n' + '═'.repeat(80));
console.log('\n⚠️  IMPORTANT:');
console.log('   - Store these secrets securely');
console.log('   - Never commit them to Git');
console.log('   - Use different secrets for production vs development');
console.log('   - Each secret is 128 characters (64 bytes in hex)\n');

// Generate Razorpay webhook secret
const webhookSecret = crypto.randomBytes(32).toString('hex');
console.log('Bonus - Razorpay Webhook Secret:');
console.log('RAZORPAY_WEBHOOK_SECRET=' + webhookSecret);
console.log('\n✅ Done!\n');
