const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const TIMESTAMP = Date.now();
const USER_EMAIL = `testuser_${TIMESTAMP}@example.com`;
const USER_PASS = 'TestPass123!';

async function runTest() {
    console.log(`\n🚀 Starting Payment Flow Test (Mock Mode)`);
    console.log(`-----------------------------------------------`);

    try {
        // 1. Register User
        console.log(`\n1️⃣  Registering new user: ${USER_EMAIL}`);
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test User',
            email: USER_EMAIL,
            password: USER_PASS,
            phone: `9${TIMESTAMP.toString().slice(-9)}`
        });
        console.log('   ✅ Registered successfully');

        // 2. Login
        console.log(`\n2️⃣  Logging in to get Token`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASS
        });
        const token = loginRes.data.token;
        console.log('   ✅ Logged in. Token received.');

        const headers = { Authorization: `Bearer ${token}` };

        // 3. Get Services
        console.log(`\n3️⃣  Fetching Services`);
        const servicesRes = await axios.get(`${API_URL}/services`, { headers });
        const service = servicesRes.data[0];
        if (!service) throw new Error('No services found in DB to test with.');
        console.log(`   ✅ Found Service: ${service.name} (ID: ${service.id}, Price: ${service.price})`);

        // 4. Select Service
        console.log(`\n4️⃣  Selecting Service to generate UserServiceId`);
        const selectRes = await axios.post(`${API_URL}/services/select`,
            { serviceId: service.id },
            { headers }
        );
        const userServiceId = selectRes.data.userService.id;
        console.log(`   ✅ Service Selected. UserServiceID: ${userServiceId}`);

        // 5. Create Order
        console.log(`\n5️⃣  Creating Payment Order`);
        const orderRes = await axios.post(`${API_URL}/payments/create-order`,
            { userServiceId },
            { headers }
        );
        const orderData = orderRes.data;

        console.log(`   Ordering ID: ${orderData.id}`);
        console.log(`   Amount: ${orderData.amount}`);

        if (!orderData.id.startsWith('order_mock_')) {
            console.warn('   ⚠️  WARNING: Order ID does not look like a Mock Order! (Expected "order_mock_...")');
        } else {
            console.log('   ✅ Verified Mock Order ID format.');
        }

        // 6. Verify Payment
        console.log(`\n6️⃣  Verifying Mock Payment`);
        const verifyPayload = {
            razorpay_order_id: orderData.id,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'mock_signature', // The controller might check this, but mock logic should bypass or accept it if we set it up right
            userServiceId: userServiceId
        };

        const verifyRes = await axios.post(`${API_URL}/payments/verify`, verifyPayload, { headers });
        console.log(`   Response: ${JSON.stringify(verifyRes.data)}`);

        if (verifyRes.data.status === 'success') {
            console.log('   ✅ Payment Verification SUCCESSFUL');
        } else {
            throw new Error('Payment verification returned non-success status');
        }

        console.log(`\n🎉 TEST COMPLETED SUCCESSFULLY! Mock Payment Flow is working.`);

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
    console.log(`-----------------------------------------------`);
}

runTest();
