import { describe, expect, it, beforeEach, vi } from 'vitest'

const { postModel, PostMessageMock } = vi.hoisted(() => {
  const postModel = {
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndRemove: vi.fn(),
    save: vi.fn(),
  }

  class PostMessageMock {
    constructor(data) {
      Object.assign(this, data)
      this.save = postModel.save
    }

    static countDocuments(...args) {
      return postModel.countDocuments(...args)
    }

    static aggregate(...args) {
      return postModel.aggregate(...args)
    }

    static find(...args) {
      return postModel.find(...args)
    }

    static findById(...args) {
      return postModel.findById(...args)
    }

    static findByIdAndUpdate(...args) {
      return postModel.findByIdAndUpdate(...args)
    }

    static findByIdAndRemove(...args) {
      return postModel.findByIdAndRemove(...args)
    }
  }

  return { postModel, PostMessageMock }
})

vi.mock('../../models/postMessage.js', () => ({
  default: PostMessageMock,
}))

vi.mock('mongoose', () => ({
  default: {
    isValidObjectId: vi.fn((id) => id === 'valid-id'),
  },
}))

const {
  getPosts,
  createPost,
  getPostsBySearch,
  getPost,
  updatePost,
  deletePost,
} = await import('../../controllers/posts.js')

const response = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
})

describe('post controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets paginated posts', async () => {
    postModel.countDocuments.mockReturnValue({
      exec: vi.fn().mockResolvedValue(10),
    })

    postModel.aggregate.mockResolvedValue([{ _id: '1' }])

    const res = response()

    await getPosts(
      {
        query: {
          limit: '2',
          page: '2',
        },
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(200)

    expect(res.json).toHaveBeenCalledWith({
      totalPosts: 10,
      next: {
        page: 3,
        limit: 2,
      },
      previous: {
        page: 1,
        limit: 2,
      },
      results: [{ _id: '1' }],
    })
  })

  it('returns an error when getting posts fails', async () => {
    postModel.countDocuments.mockReturnValue({
      exec: vi.fn().mockRejectedValue(
        new Error('database failure')
      ),
    })

    const res = response()

    await getPosts(
      {
        query: {},
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'database failure',
    })
  })

  it('creates a post', async () => {
    const saved = {
      _id: '1',
      title: 'Hello',
    }

    postModel.save.mockResolvedValue(saved)

    const res = response()

    await createPost(
      {
        body: {
          title: 'Hello',
        },
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(201)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Hello',
      })
    )
  })

  it('handles create-post errors', async () => {
    postModel.save.mockRejectedValue(
      new Error('save failed')
    )

    const res = response()

    await createPost(
      {
        body: {
          title: 'Hello',
        },
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(409)

    expect(res.json).toHaveBeenCalledWith({
      message: 'save failed',
    })
  })

  it('searches posts and paginates results', async () => {
    postModel.find.mockResolvedValue([
      { title: 'first' },
      { title: 'second' },
      { title: 'third' },
    ])

    const res = response()

    await getPostsBySearch(
      {
        query: {
          searchQuery: 'first',
          tags: 'tech,node',
          limit: '2',
          page: '1',
        },
      },
      res
    )

    expect(res.json).toHaveBeenCalledWith({
      totalPosts: 3,
      next: {
        page: 2,
        limit: 2,
      },
      results: [
        { title: 'first' },
        { title: 'second' },
      ],
    })
  })

  it('sets previous page when searching from page 2', async () => {
    postModel.find.mockResolvedValue([
      { title: 'first' },
      { title: 'second' },
      { title: 'third' },
    ])

    const res = response()

    await getPostsBySearch(
      {
        query: {
          searchQuery: 'first',
          tags: 'tech,node',
          limit: '2',
          page: '2',
        },
      },
      res
    )

    expect(res.json).toHaveBeenCalledWith({
      totalPosts: 3,
      previous: {
        page: 1,
        limit: 2,
      },
      results: [{ title: 'third' }],
    })
  })

  it('returns an error when search fails', async () => {
    postModel.find.mockRejectedValue(
      new Error('search failure')
    )

    const res = response()

    await getPostsBySearch(
      {
        query: {
          searchQuery: 'first',
          tags: 'tech',
        },
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'search failure',
    })
  })

  it('rejects an invalid post id', async () => {
    const res = response()

    await getPost(
      {
        params: {
          id: 'bad-id',
        },
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'No Post with id found!',
    })
  })

  it('gets a post by id', async () => {
    postModel.findById.mockResolvedValue({
      _id: 'valid-id',
      title: 'Hello',
    })

    const res = response()

    await getPost(
      {
        params: {
          id: 'valid-id',
        },
      },
      res
    )

    expect(res.json).toHaveBeenCalledWith({
      _id: 'valid-id',
      title: 'Hello',
    })
  })

  it('handles get-post database errors', async () => {
    postModel.findById.mockRejectedValue(
      new Error('lookup failed')
    )

    const res = response()

    await getPost(
      {
        params: {
          id: 'valid-id',
        },
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'lookup failed',
    })
  })

  it('updates a post', async () => {
    postModel.findByIdAndUpdate.mockResolvedValue({
      _id: 'valid-id',
      title: 'Updated',
    })

    const res = response()

    await updatePost(
      {
        params: {
          id: 'valid-id',
        },
        body: {
          title: 'Updated',
        },
      },
      res
    )

    expect(
      postModel.findByIdAndUpdate
    ).toHaveBeenCalledWith(
      'valid-id',
      { title: 'Updated' },
      { new: true }
    )

    expect(res.json).toHaveBeenCalledWith({
      _id: 'valid-id',
      title: 'Updated',
    })
  })

  it('rejects an invalid id when updating a post', async () => {
    postModel.findByIdAndUpdate.mockResolvedValue({
      _id: 'bad-id',
    })

    const res = response()

    await updatePost(
      {
        params: {
          id: 'bad-id',
        },
        body: {
          title: 'Updated',
        },
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'No Post with id found!',
    })
  })

  it('deletes a post', async () => {
    postModel.findByIdAndRemove.mockResolvedValue({
      _id: 'valid-id',
    })

    const res = response()

    await deletePost(
      {
        params: {
          id: 'valid-id',
        },
      },
      res
    )

    expect(
      postModel.findByIdAndRemove
    ).toHaveBeenCalledWith('valid-id')

    expect(res.json).toHaveBeenCalledWith({
      message: 'Post Deleted Successfully!',
    })
  })

  it('rejects an invalid id when deleting a post', async () => {
    postModel.findByIdAndRemove.mockResolvedValue({
      _id: 'bad-id',
    })

    const res = response()

    await deletePost(
      {
        params: {
          id: 'bad-id',
        },
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'No Post with id found!',
    })
  })
})