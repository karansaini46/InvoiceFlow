import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { testApp, testUser, prisma } from './setup';

describe('Auth Endpoints', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'newpassword123'
      };

      const response = await request(testApp)
        .post('/auth/register')
        .send(newUser)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.name).toBe(newUser.name);
      expect(response.body.user.plan).toBe('free');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 409 when registering with duplicate email', async () => {
      const response = await request(testApp)
        .post('/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 when registering with invalid email', async () => {
      const invalidUser = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'password123'
      };

      const response = await request(testApp)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when registering with short password', async () => {
      const invalidUser = {
        email: 'test2@example.com',
        name: 'Test User',
        password: '123'
      };

      const response = await request(testApp)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(testApp)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when login with wrong password', async () => {
      const response = await request(testApp)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('incorrect');
    });

    it('should return 401 when login with non-existent email', async () => {
      const response = await request(testApp)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('incorrect');
    });

    it('should return 400 when login with invalid email format', async () => {
      const response = await request(testApp)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First login to get refresh token
      const loginResponse = await request(testApp)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const cookies = (loginResponse.headers['set-cookie'] as unknown) as string[] | undefined;
      const refreshTokenCookie = cookies?.find((cookie: string) => cookie.startsWith('refreshToken='));

      expect(refreshTokenCookie).toBeDefined();

      const response = await request(testApp)
        .post('/auth/refresh')
        .set('Cookie', refreshTokenCookie!)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
    });

    it('should return 401 when refreshing without token', async () => {
      const response = await request(testApp)
        .post('/auth/refresh')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Refresh token is required');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(testApp)
        .post('/auth/logout')
        .expect(204);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });
  });

  describe('Protected Routes', () => {
    it('should return 401 when accessing protected route without token', async () => {
      const response = await request(testApp)
        .get('/payment/status')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Authorization token is required');
    });

    it('should return 401 when accessing protected route with invalid token', async () => {
      const response = await request(testApp)
        .get('/payment/status')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Authorization token is invalid');
    });

    it('should access protected route with valid token', async () => {
      // Import the test access token from setup
      const { testAccessToken } = await import('./setup');
      
      const response = await request(testApp)
        .get('/payment/status')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('plan');
    });

    it('should reject a validly signed token when the user no longer exists', async () => {
      const staleAccessToken = jwt.sign(
        {
          id: 'deleted-user-id',
          email: 'deleted@example.com',
          plan: 'free',
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '15m' },
      );

      const response = await request(testApp)
        .get('/payment/status')
        .set('Authorization', `Bearer ${staleAccessToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('sign in again');
    });
  });
});
