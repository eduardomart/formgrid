# E2E Tests

This directory contains comprehensive end-to-end tests for the Form API application.

## Test Structure

### Test Files

- **`auth.e2e.test.ts`** - Authentication endpoints (signup, login, logout, password reset)
- **`forms.e2e.test.ts`** - Forms CRUD operations (create, read, update, delete)
- **`submissions.e2e.test.ts`** - Form submission endpoints and validation
- **`spam-protection.e2e.test.ts`** - Spam protection mechanisms (honeypot, reCAPTCHA, rate limiting)
- **`email-webhook.e2e.test.ts`** - Email notifications and webhook functionality
- **`index.test.ts`** - API health checks and basic functionality

### Setup Files

- **`setup.ts`** - Test database setup and cleanup utilities
- **`global-setup.ts`** - Global test environment initialization
- **`global-teardown.ts`** - Global test environment cleanup

## Running Tests

### Prerequisites

1. **Test Database**: Ensure you have a test database configured
2. **Environment Variables**: Create a `.env.test` file with test-specific configuration
3. **Dependencies**: Install all required dependencies

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in watch mode
npm run test:e2e:watch

# Run E2E tests with coverage
npm run test:e2e:coverage

# Run specific test file
npm run test:e2e -- auth.e2e.test.ts

# Run tests matching a pattern
npm run test:e2e -- --testNamePattern="Authentication"
```

## Test Configuration

### Environment Variables

Create a `.env.test` file with the following variables:

```env
NODE_ENV=test
DATABASE_URL=file:./test.db
JWT_SECRET=test-jwt-secret-key
JWT_EXPIRES_IN=1h
EMAIL_PROVIDER=console
EMAIL_FROM=test@example.com
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1
RECAPTCHA_SECRET_KEY=test-recaptcha-secret
RECAPTCHA_SITE_KEY=test-recaptcha-site-key
```

### Database Setup

The tests use a separate test database to avoid conflicts with development data. The test database is automatically cleaned up between test runs.

## Test Coverage

The E2E tests cover:

### Authentication
- ✅ User registration with validation
- ✅ User login with credentials
- ✅ JWT token validation
- ✅ Password reset flow
- ✅ User profile access
- ✅ Logout functionality

### Forms Management
- ✅ Create forms with validation
- ✅ Retrieve forms (all, by ID, by slug)
- ✅ Update forms with authorization
- ✅ Delete forms with authorization
- ✅ Form ownership validation
- ✅ Endpoint slug generation

### Form Submissions
- ✅ Public form submission
- ✅ Submission validation
- ✅ Multiple submission handling
- ✅ Form status checking
- ✅ Submission retrieval and updates

### Spam Protection
- ✅ Honeypot field validation
- ✅ Rate limiting (per-IP, per-form, combined)
- ✅ reCAPTCHA integration
- ✅ Spam detection and blocking
- ✅ Protection configuration

### Email & Webhooks
- ✅ Email notification queuing
- ✅ Auto-reply email functionality
- ✅ Webhook dispatch queuing
- ✅ Error handling and graceful failures
- ✅ Template rendering

## Test Data Management

### Automatic Cleanup

- Test data is automatically cleaned up after each test
- Database is reset between test suites
- No test data persists between runs

### Test Isolation

- Each test runs in isolation
- Database transactions are used where possible
- External dependencies are mocked or configured for testing

## Debugging Tests

### Verbose Output

```bash
npm run test:e2e -- --verbose
```

### Debug Mode

```bash
npm run test:e2e -- --detectOpenHandles --forceExit
```

### Individual Test Debugging

```bash
# Run a specific test with detailed output
npm run test:e2e -- --testNamePattern="should create a new form successfully" --verbose
```

## Best Practices

### Test Writing

1. **Descriptive Test Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Test Isolation**: Each test should be independent
4. **Clean Data**: Always clean up test data
5. **Error Scenarios**: Test both success and failure cases

### Performance

1. **Parallel Execution**: Tests run sequentially to avoid database conflicts
2. **Database Optimization**: Use transactions where possible
3. **Mock External Services**: Mock email and webhook services for faster tests

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure test database is accessible
2. **Environment Variables**: Verify `.env.test` configuration
3. **Port Conflicts**: Ensure test port doesn't conflict with development
4. **Redis Connection**: Ensure Redis is running for rate limiting tests

### Debug Commands

```bash
# Check test database connection
npm run test:e2e -- --testNamePattern="should return API information"

# Verify environment setup
npm run test:e2e -- --verbose --detectOpenHandles
```

## Contributing

When adding new E2E tests:

1. Follow the existing test structure
2. Use the `e2eSetup` utility for database operations
3. Clean up test data in `afterEach` hooks
4. Add appropriate error handling
5. Update this README with new test coverage
