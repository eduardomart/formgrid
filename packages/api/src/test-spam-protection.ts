#!/usr/bin/env node

import { config } from 'dotenv';
import { SpamProtectionService, SpamProtectionConfig } from './services/spamProtectionService';

// Load environment variables
config();

/**
 * Test script for spam protection functionality
 */
async function testSpamProtection() {
    console.log('Testing spam protection functionality...');

    const spamService = new SpamProtectionService();

    // Test 1: Honeypot validation
    console.log('\n1. Testing honeypot validation...');

    const validPayload = { name: 'John Doe', email: 'john@example.com', website: '' };
    const spamPayload = { name: 'John Doe', email: 'john@example.com', website: 'spam-site.com' };

    const honeypotValid = spamService.validateHoneypot(validPayload, 'website');
    const honeypotSpam = spamService.validateHoneypot(spamPayload, 'website');

    console.log(`Valid payload (empty honeypot): ${honeypotValid ? 'PASS' : 'FAIL'}`);
    console.log(`Spam payload (filled honeypot): ${honeypotSpam ? 'FAIL' : 'PASS'}`);

    // Test 2: Rate limiting
    console.log('\n2. Testing rate limiting...');

    const testIp = '192.168.1.100';
    const testFormId = 'test-form-123';

    // Test IP rate limiting
    console.log('Testing IP rate limiting (limit: 3 requests per minute)...');
    for (let i = 1; i <= 5; i++) {
        const allowed = spamService.checkRateLimitByIp(testIp, 3, 1);
        console.log(`Request ${i}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
    }

    // Test form rate limiting
    console.log('\nTesting form rate limiting (limit: 2 requests per minute)...');
    for (let i = 1; i <= 4; i++) {
        const allowed = spamService.checkRateLimitByForm(testFormId, 2, 1);
        console.log(`Request ${i}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
    }

    // Test IP + Form combination
    console.log('\nTesting IP + Form combination (limit: 1 request per minute)...');
    for (let i = 1; i <= 3; i++) {
        const allowed = spamService.checkRateLimitByIpAndForm(testIp, testFormId, 1, 1);
        console.log(`Request ${i}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
    }

    // Test 3: reCAPTCHA verification (if configured)
    console.log('\n3. Testing reCAPTCHA verification...');

    if (process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'your-recaptcha-secret-key') {
        console.log('reCAPTCHA secret key configured, testing verification...');

        // Test with invalid token
        const invalidToken = 'invalid-token';
        const recaptchaResult = await spamService.verifyRecaptcha(invalidToken, process.env.RECAPTCHA_SECRET_KEY);
        console.log(`Invalid token test: ${recaptchaResult ? 'FAIL' : 'PASS'}`);
    } else {
        console.log('reCAPTCHA secret key not configured, skipping verification test');
    }

    // Test 4: Comprehensive spam check
    console.log('\n4. Testing comprehensive spam check...');

    const spamConfig: SpamProtectionConfig = {
        honeypotField: 'website',
        enableRecaptcha: false, // Disable for testing
        rateLimitPerIp: 5,
        rateLimitPerForm: 10,
        rateLimitWindow: 1, // 1 minute
    };

    // Test valid submission
    const validSubmission = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world',
        website: '', // Empty honeypot
    };

    const validResult = await spamService.performSpamCheck(
        validSubmission,
        '192.168.1.200',
        'test-form-456',
        spamConfig
    );
    console.log(`Valid submission: ${validResult.isValid ? 'PASS' : 'FAIL'} - ${validResult.reason || 'OK'}`);

    // Test spam submission (filled honeypot)
    const spamSubmission = {
        name: 'Spam Bot',
        email: 'spam@example.com',
        message: 'Buy my product!',
        website: 'spam-site.com', // Filled honeypot
    };

    const spamResult = await spamService.performSpamCheck(
        spamSubmission,
        '192.168.1.201',
        'test-form-456',
        spamConfig
    );
    console.log(`Spam submission: ${spamResult.isValid ? 'FAIL' : 'PASS'} - ${spamResult.reason || 'OK'}`);

    // Test 5: Rate limit status
    console.log('\n5. Testing rate limit status...');

    const statusKey = 'test-status-key';
    spamService.checkRateLimitByIp('192.168.1.300', 3, 1);
    spamService.checkRateLimitByIp('192.168.1.300', 3, 1);

    const status = spamService.getRateLimitStatus('ip:192.168.1.300');
    if (status) {
        console.log(`Rate limit status: ${status.count}/3 requests, ${Math.ceil(status.remaining / 1000)}s remaining`);
    }

    // Test 6: Cleanup
    console.log('\n6. Testing cleanup...');
    spamService.cleanupExpiredEntries();
    console.log('Cleanup completed');

    console.log('\nSpam protection testing completed!');
}

// Run the test
testSpamProtection().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
});
