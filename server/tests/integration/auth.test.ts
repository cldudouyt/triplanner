import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import { prisma } from '../setup.js'
import { hashPassword } from '../../src/utils/password.js'

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Jean',
          lastName: 'Dupont',
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.email).toBe('test@example.com')
      expect(res.body.firstName).toBe('Jean')
      expect(res.body).not.toHaveProperty('password')
    })

    it('should reject duplicate email', async () => {
      await prisma.user.create({
        data: {
          email: 'existing@example.com',
          password: await hashPassword('password'),
          firstName: 'Existing',
          lastName: 'User',
        },
      })

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
        })

      expect(res.status).toBe(409)
      expect(res.body.error).toContain('email')
    })

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'Jean',
          lastName: 'Dupont',
        })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await prisma.user.create({
        data: {
          email: 'user@example.com',
          password: await hashPassword('correctpassword'),
          firstName: 'Test',
          lastName: 'User',
        },
      })
    })

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'correctpassword',
        })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('user')
      expect(res.body.user.email).toBe('user@example.com')
      expect(res.headers['set-cookie']).toBeDefined()
    })

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'wrongpassword',
        })

      expect(res.status).toBe(401)
    })

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        })

      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 401 without refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')

      expect(res.status).toBe(401)
      expect(res.body.error).toContain('Refresh token')
    })
  })

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')

      expect(res.status).toBe(401)
    })
  })
})
