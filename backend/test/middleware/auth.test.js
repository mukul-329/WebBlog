import { describe, expect, it, beforeEach, vi } from 'vitest'

const { verify, decode } = vi.hoisted(() => ({
  verify: vi.fn(),
  decode: vi.fn(),
}))

vi.mock('jsonwebtoken', () => ({
  default: { verify, decode },
}))

const auth = (await import('../../middleware/auth.js')).default

const response = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
})

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET_KEY = 'test-secret'
  })

  it('rejects requests without a bearer token', async () => {
    const res = response()
    const next = vi.fn()

    await auth({ headers: {} }, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('verifies custom bearer tokens', async () => {
    verify.mockReturnValue({ id: 'user-1' })
    const req = { headers: { authorization: 'Bearer abc' } }
    const res = response()
    const next = vi.fn()

    await auth(req, res, next)

    expect(req.userId).toBe('user-1')
    expect(next).toHaveBeenCalled()
  })

  it('decodes long social tokens', async () => {
    decode.mockReturnValue({ sub: 'social-user' })
    const token = 'x'.repeat(501)
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = response()
    const next = vi.fn()

    await auth(req, res, next)

    expect(req.userId).toBe('social-user')
    expect(next).toHaveBeenCalled()
  })

  it('rejects invalid tokens', async () => {
    verify.mockImplementation(() => {
      throw new Error('invalid token')
    })

    const req = { headers: { authorization: 'Bearer abc' } }
    const res = response()
    const next = vi.fn()

    await auth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})
