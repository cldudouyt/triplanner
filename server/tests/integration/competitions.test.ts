import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import prisma from '../../src/config/database.js'
import { createTestUser, createTestCompetition, authHeader, type TestUser } from '../helpers.js'

describe('Competitions API', () => {
  let user: TestUser

  beforeEach(async () => {
    user = await createTestUser()
  })

  describe('GET /api/v1/competitions', () => {
    it('should return empty list initially', async () => {
      const res = await request(app)
        .get('/api/v1/competitions')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
      expect(res.body.total).toBe(0)
    })

    it('should return competitions with pagination', async () => {
      await createTestCompetition(user.id, { name: 'Comp 1' })
      await createTestCompetition(user.id, { name: 'Comp 2' })

      const res = await request(app)
        .get('/api/v1/competitions')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.total).toBe(2)
      expect(res.body.page).toBe(1)
    })

    it('should filter by type', async () => {
      await createTestCompetition(user.id, { name: 'Tri', type: 'triathlon' })
      await createTestCompetition(user.id, { name: 'Run', type: 'running', subType: 'marathon' })

      const res = await request(app)
        .get('/api/v1/competitions?type=triathlon')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toBe('Tri')
    })

    it('should filter by priority', async () => {
      await createTestCompetition(user.id, { name: 'Priority A', priority: 'A' })
      await createTestCompetition(user.id, { name: 'Priority B', priority: 'B' })

      const res = await request(app)
        .get('/api/v1/competitions?priority=A')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toBe('Priority A')
    })

    it('should sort by date', async () => {
      await createTestCompetition(user.id, { name: 'Later', date: new Date('2026-12-01') })
      await createTestCompetition(user.id, { name: 'Earlier', date: new Date('2026-06-01') })

      const res = await request(app)
        .get('/api/v1/competitions?sortBy=date&sortOrder=asc')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.data[0].name).toBe('Earlier')
      expect(res.body.data[1].name).toBe('Later')
    })

    it('should not return other users competitions', async () => {
      const otherUser = await createTestUser('other@example.com')
      await createTestCompetition(otherUser.id, { name: 'Other Competition' })

      const res = await request(app)
        .get('/api/v1/competitions')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(0)
    })

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/v1/competitions')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/v1/competitions', () => {
    it('should create a triathlon competition', async () => {
      const res = await request(app)
        .post('/api/v1/competitions')
        .set(authHeader(user.accessToken))
        .send({
          name: 'Triathlon de Paris',
          date: '2026-06-15',
          location: 'Paris',
          type: 'triathlon',
          subType: 'olympic',
          swimDistance: 1500,
          bikeDistance: 40000,
          runDistance: 10000,
          priority: 'A',
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Triathlon de Paris')
      expect(res.body.type).toBe('triathlon')
      expect(res.body.priority).toBe('A')
    })

    it('should create a running competition', async () => {
      const res = await request(app)
        .post('/api/v1/competitions')
        .set(authHeader(user.accessToken))
        .send({
          name: 'Marathon de Paris',
          date: '2026-04-05',
          type: 'running',
          subType: 'marathon',
          runDistance: 42195,
        })

      expect(res.status).toBe(201)
      expect(res.body.subType).toBe('marathon')
    })

    it('should reject invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/competitions')
        .set(authHeader(user.accessToken))
        .send({
          name: '',
          date: '2026-06-15',
          type: 'invalid-type',
          subType: 'sprint',
        })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/competitions/:id', () => {
    it('should return a competition with equipment', async () => {
      const competition = await createTestCompetition(user.id)

      await prisma.equipmentItem.create({
        data: {
          competitionId: competition.id,
          name: 'Combinaison',
          category: 'Natation',
        },
      })

      const res = await request(app)
        .get(`/api/v1/competitions/${competition.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Test Competition')
      expect(res.body.equipmentItems).toHaveLength(1)
      expect(res.body.equipmentItems[0].name).toBe('Combinaison')
    })

    it('should return 404 for non-existent competition', async () => {
      const res = await request(app)
        .get('/api/v1/competitions/99999')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(404)
    })

    it('should not return other users competition', async () => {
      const otherUser = await createTestUser('other@example.com')
      const competition = await createTestCompetition(otherUser.id)

      const res = await request(app)
        .get(`/api/v1/competitions/${competition.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/v1/competitions/:id', () => {
    it('should update competition details', async () => {
      const competition = await createTestCompetition(user.id, { priority: 'B' })

      const res = await request(app)
        .put(`/api/v1/competitions/${competition.id}`)
        .set(authHeader(user.accessToken))
        .send({
          name: 'Updated Name',
          priority: 'A',
          status: 'registered',
        })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Updated Name')
      expect(res.body.priority).toBe('A')
      expect(res.body.status).toBe('registered')
    })

    it('should return 404 for non-existent competition', async () => {
      const res = await request(app)
        .put('/api/v1/competitions/99999')
        .set(authHeader(user.accessToken))
        .send({ name: 'Test' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/competitions/:id', () => {
    it('should delete competition and equipment', async () => {
      const competition = await createTestCompetition(user.id)

      await prisma.equipmentItem.create({
        data: {
          competitionId: competition.id,
          name: 'Item',
        },
      })

      const res = await request(app)
        .delete(`/api/v1/competitions/${competition.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(204)

      // Verify cascade deletion
      const items = await prisma.equipmentItem.findMany({
        where: { competitionId: competition.id },
      })
      expect(items).toHaveLength(0)
    })

    it('should return 404 for non-existent competition', async () => {
      const res = await request(app)
        .delete('/api/v1/competitions/99999')
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(404)
    })
  })

  describe('Equipment Items', () => {
    it('should add equipment item', async () => {
      const competition = await createTestCompetition(user.id)

      const res = await request(app)
        .post(`/api/v1/competitions/${competition.id}/equipment`)
        .set(authHeader(user.accessToken))
        .send({
          name: 'Vélo de course',
          category: 'Cyclisme',
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Vélo de course')
      expect(res.body.checked).toBe(false)
    })

    it('should update equipment item', async () => {
      const competition = await createTestCompetition(user.id)
      const item = await prisma.equipmentItem.create({
        data: {
          competitionId: competition.id,
          name: 'Lunettes',
          checked: false,
        },
      })

      const res = await request(app)
        .put(`/api/v1/competitions/${competition.id}/equipment/${item.id}`)
        .set(authHeader(user.accessToken))
        .send({ checked: true })

      expect(res.status).toBe(200)
      expect(res.body.checked).toBe(true)
    })

    it('should delete equipment item', async () => {
      const competition = await createTestCompetition(user.id)
      const item = await prisma.equipmentItem.create({
        data: {
          competitionId: competition.id,
          name: 'Item to delete',
        },
      })

      const res = await request(app)
        .delete(`/api/v1/competitions/${competition.id}/equipment/${item.id}`)
        .set(authHeader(user.accessToken))

      expect(res.status).toBe(204)
    })
  })
})
