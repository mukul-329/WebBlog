import { describe, expect, it, beforeEach, vi } from 'vitest'

const { userModel, bcryptMock, jwtMock } = vi.hoisted(() => ({
  userModel: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
  bcryptMock: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  jwtMock: {
    sign: vi.fn(),
  },
}))

vi.mock('../../models/user.js', () => ({
  default: userModel,
}))

vi.mock('bcryptjs', () => ({
  default: bcryptMock,
}))

vi.mock('jsonwebtoken', () => ({
  default: jwtMock,
}))

const bcrypt = bcryptMock
const jwt = jwtMock
const { signIn, signUp } = await import('../../controllers/user.js')

const response = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
})

describe('user controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET_KEY = 'test-secret'
  })

  it('signs in an existing user', async () => {
    const user = {
      email: 'user@example.com',
      password: 'hashed',
      _id: 'user-1',
      toObject: () => ({
        email: 'user@example.com',
        password: 'hashed',
        _id: 'user-1',
        name: 'User',
      }),
    }
    userModel.findOne.mockResolvedValue(user)
    bcrypt.compare.mockResolvedValue(true)
    jwt.sign.mockReturnValue('token')

    const res = response()
    await signIn({ body: { email: ' USER@EXAMPLE.COM ', password: 'pass' } }, res)

    expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'hashed')
    expect(jwt.sign).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      result: { email: 'user@example.com', _id: 'user-1', name: 'User' },
      token: 'token',
    })
  })

  it('rejects a missing user', async () => {
    userModel.findOne.mockResolvedValue(null)

    const res = response()
    await signIn({ body: { email: 'missing@example.com', password: 'pass' } }, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('rejects an incorrect password', async () => {
    userModel.findOne.mockResolvedValue({
      email: 'user@example.com',
      password: 'hashed',
    })
    bcrypt.compare.mockResolvedValue(false)

    const res = response()
    await signIn({ body: { email: 'user@example.com', password: 'wrong' } }, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 500 when sign-in fails', async () => {
    userModel.findOne.mockRejectedValue(new Error('database error'))

    const res = response()
    await signIn({ body: { email: 'user@example.com', password: 'pass' } }, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('signs up a new user', async () => {
    userModel.findOne.mockResolvedValue(null)
    bcrypt.hash.mockResolvedValue('hashed-password')
    userModel.create.mockResolvedValue({
      email: 'user@example.com',
      name: 'User',
      password: 'hashed-password',
      _id: 'user-1',
      toObject: () => ({
        email: 'user@example.com',
        name: 'User',
        password: 'hashed-password',
        _id: 'user-1',
      }),
    })
    jwt.sign.mockReturnValue('token')

    const res = response()
    await signUp(
      {
        body: {
          name: ' User ',
          email: ' USER@EXAMPLE.COM ',
          password: 'pass',
          confirmPassword: 'pass',
        },
      },
      res
    )

    expect(bcrypt.hash).toHaveBeenCalledWith('pass', 12)
    expect(userModel.create).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'User',
      password: 'hashed-password',
    })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('rejects an existing user', async () => {
    userModel.findOne.mockResolvedValue({ email: 'user@example.com' })

    const res = response()
    await signUp(
      { body: { name: 'User', email: 'user@example.com', password: 'pass', confirmPassword: 'pass' } },
      res
    )

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('rejects mismatched passwords', async () => {
    userModel.findOne.mockResolvedValue(null)

    const res = response()
    await signUp(
      { body: { name: 'User', email: 'user@example.com', password: 'pass', confirmPassword: 'other' } },
      res
    )

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('rejects missing required fields', async () => {
    userModel.findOne.mockResolvedValue(null)

    const res = response()
    await signUp(
      { body: { name: '', email: '', password: '', confirmPassword: '' } },
      res
    )

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 500 when sign-up fails', async () => {
    userModel.findOne.mockRejectedValue(new Error('database error'))

    const res = response()
    await signUp(
      { body: { name: 'User', email: 'user@example.com', password: 'pass', confirmPassword: 'pass' } },
      res
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
