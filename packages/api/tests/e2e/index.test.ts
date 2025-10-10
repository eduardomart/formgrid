import request from 'supertest';
import { app } from '../../src/server';

describe('API Health Check E2E Tests', () => {
    describe('GET /', () => {
        it('should return API information', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('endpoints');
            expect(Array.isArray(response.body.endpoints)).toBe(true);
        });
    });

    describe('GET /api', () => {
        it('should return API status', async () => {
            const response = await request(app)
                .get('/api')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('404 Handling', () => {
        it('should return 404 for non-existent routes', async () => {
            await request(app)
                .get('/non-existent-route')
                .expect(404);

            await request(app)
                .get('/api/non-existent-endpoint')
                .expect(404);
        });
    });

    describe('CORS Headers', () => {
        it('should include CORS headers', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.headers).toHaveProperty('access-control-allow-origin');
        });
    });
});
