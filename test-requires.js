// Simple script to test all requires to identify crash causes
console.log('Testing requires...');

try {
    require('./src/config/db');
    console.log('✅ DB Config loaded');
} catch (e) {
    console.error('❌ DB Config failed:', e.message);
}

try {
    require('./src/utils/logger');
    console.log('✅ Logger loaded');
} catch (e) {
    console.error('❌ Logger failed:', e.message);
}

try {
    require('./src/middleware/authMiddleware');
    console.log('✅ Auth Middleware loaded');
} catch (e) {
    console.error('❌ Auth Middleware failed:', e.message);
}

try {
    require('./src/middleware/adminMiddleware');
    console.log('✅ Admin Middleware loaded');
} catch (e) {
    console.error('❌ Admin Middleware failed:', e.message);
}

try {
    require('./src/controllers/authController');
    console.log('✅ Auth Controller loaded');
} catch (e) {
    console.error('❌ Auth Controller failed:', e.message);
}

try {
    require('./src/controllers/adminController');
    console.log('✅ Admin Controller loaded');
} catch (e) {
    console.error('❌ Admin Controller failed:', e.message);
}

try {
    require('./src/controllers/adminAuthController');
    console.log('✅ Admin Auth Controller loaded');
} catch (e) {
    console.error('❌ Admin Auth Controller failed:', e.message);
}

try {
    require('./src/services/documentGenerator');
    console.log('✅ Document Generator loaded');
} catch (e) {
    console.error('❌ Document Generator failed:', e.message);
}

try {
    require('./src/routes/adminRoutes');
    console.log('✅ Admin Routes loaded');
} catch (e) {
    console.error('❌ Admin Routes failed:', e.message);
}

console.log('Tests complete.');
