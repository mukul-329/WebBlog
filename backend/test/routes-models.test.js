import { describe, expect, it } from 'vitest'

describe('backend route modules', () => {
  it('loads the post routes', async () => {
    const module = await import('../routes/posts.js')
    expect(module.default).toBeDefined()
  })

  it('loads the user routes', async () => {
    const module = await import('../routes/user.js')
    expect(module.default).toBeDefined()
  })
})

describe('backend model modules', () => {
  it('loads the post model', async () => {
    const module = await import('../models/postMessage.js')
    expect(module.default).toBeDefined()
  })

  it('loads the user model', async () => {
    const module = await import('..//models/user.js')
    expect(module.default).toBeDefined()
  })
})
