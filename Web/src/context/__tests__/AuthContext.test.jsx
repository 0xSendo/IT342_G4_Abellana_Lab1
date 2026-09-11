import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import AuthContext, { AuthProvider } from '../AuthContext'

const API_BASE = 'http://localhost:8081'

const mockFetch = (impl) => {
  const mock = vi.fn(impl)
  vi.stubGlobal('fetch', mock)
  return mock
}

function renderProbe() {
  let ctx
  function Probe() {
    ctx = useContext(AuthContext)
    return null
  }
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  )
  return () => ctx
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('exposes unauthenticated state when nothing is stored', () => {
    const getCtx = renderProbe()
    const ctx = getCtx()
    expect(ctx.isAuthenticated).toBe(false)
    expect(ctx.currentUser).toBeNull()
  })

  it('restores currentUser from localStorage on init', () => {
    localStorage.setItem(
      'internmatch_currentUser',
      JSON.stringify({ email: 'alice@internmatch.com', role: 'STUDENT' })
    )
    const getCtx = renderProbe()
    expect(getCtx().currentUser.email).toBe('alice@internmatch.com')
  })

  it('login stores token and current user', async () => {
    const user = { token: 'abc123', email: 'alice@internmatch.com', name: 'Alice', role: 'STUDENT' }
    mockFetch(async (url) => {
      if (url.includes('/api/auth/login')) {
        return { ok: true, json: async () => user }
      }
      return { ok: true, json: async () => user }
    })
    const getCtx = renderProbe()
    const result = await act(async () => getCtx().login({ email: 'alice@internmatch.com', password: 'pw' }))
    expect(result.ok).toBe(true)
    expect(localStorage.getItem('internmatch_token')).toBe('abc123')
    expect(JSON.parse(localStorage.getItem('internmatch_currentUser')).email).toBe('alice@internmatch.com')
    await waitFor(() => expect(getCtx().isAuthenticated).toBe(true))
  })

  it('login surfaces server error message', async () => {
    mockFetch(async () => ({ ok: false, text: async () => 'Invalid email or password.' }))
    const getCtx = renderProbe()
    const result = await act(async () => getCtx().login({ email: 'x@x.com', password: 'bad' }))
    expect(result.ok).toBe(false)
    expect(result.message).toBe('Invalid email or password.')
    expect(localStorage.getItem('internmatch_token')).toBeNull()
  })

  it('login handles network failure', async () => {
    mockFetch(async () => {
      throw new Error('network down')
    })
    const getCtx = renderProbe()
    const result = await act(async () => getCtx().login({ email: 'a@b.com', password: 'pw' }))
    expect(result).toEqual({ ok: false, message: 'Could not connect to server. Please try again.' })
  })

  it('register posts credentials and returns ok on success', async () => {
    const fetchMock = mockFetch(async (url, opts) => {
      if (url.includes('/api/auth/register')) {
        expect(JSON.parse(opts.body)).toEqual({ name: 'Alice', email: 'a@b.com', password: 'pw', role: 'STUDENT' })
        return { ok: true, text: async () => 'Registered' }
      }
      return { ok: true, text: async () => 'OK' }
    })
    const getCtx = renderProbe()
    const result = await act(async () =>
      getCtx().register({ name: 'Alice', email: 'a@b.com', password: 'pw', role: 'STUDENT' })
    )
    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalled()
  })

  it('loginWithOAuth normalizes email and stores the user', () => {
    const getCtx = renderProbe()
    let result
    act(() => {
      result = getCtx().loginWithOAuth({ token: 't1', email: 'ALICE@INTERNMATCH.COM', name: 'Alice', role: 'EMPLOYER' })
    })
    expect(result.ok).toBe(true)
    expect(getCtx().currentUser.email).toBe('alice@internmatch.com')
    expect(getCtx().currentUser.role).toBe('EMPLOYER')
    expect(localStorage.getItem('internmatch_token')).toBe('t1')
  })

  it('loginWithOAuth rejects missing token', () => {
    const getCtx = renderProbe()
    const result = getCtx().loginWithOAuth({ email: 'a@b.com' })
    expect(result.ok).toBe(false)
    expect(getCtx().isAuthenticated).toBe(false)
  })

  it('logout clears auth storage', async () => {
    const user = { token: 't', email: 'a@b.com', role: 'STUDENT' }
    mockFetch(async () => ({ ok: true, json: async () => user }))
    const getCtx = renderProbe()
    await act(async () => getCtx().login({ email: 'a@b.com', password: 'pw' }))
    act(() => getCtx().logout())
    expect(getCtx().currentUser).toBeNull()
    expect(localStorage.getItem('internmatch_token')).toBeNull()
    expect(localStorage.getItem('internmatch_currentUser')).toBeNull()
  })

  it('updateProfile echoes fresh /me sync back into state', async () => {
    localStorage.setItem(
      'internmatch_currentUser',
      JSON.stringify({ email: 'a@b.com', name: 'Alice', role: 'STUDENT', token: 't' })
    )
    localStorage.setItem('internmatch_token', 't')
    mockFetch(async (url) => {
      if (url.includes('/api/auth/profile')) {
        return { ok: true, json: async () => ({ email: 'a@b.com', name: 'Alice Updated', bio: 'x' }) }
      }
      if (url.includes('/api/auth/me')) {
        return { ok: true, json: async () => ({ email: 'a@b.com', name: 'Alice Updated', bio: 'x', role: 'STUDENT' }) }
      }
      return { ok: true, json: async () => ({}) }
    })
    const getCtx = renderProbe()
    await waitFor(() => expect(getCtx().currentUser).not.toBeNull())
    const result = await act(async () => getCtx().updateProfile({ name: 'Alice Updated' }))
    expect(result.ok).toBe(true)
    await waitFor(() => expect(getCtx().currentUser.name).toBe('Alice Updated'))
    expect(JSON.parse(localStorage.getItem('internmatch_currentUser')).bio).toBe('x')
  })

  it('updateProfile reports server rejection message', async () => {
    localStorage.setItem(
      'internmatch_currentUser',
      JSON.stringify({ email: 'a@b.com', name: 'Alice', role: 'STUDENT' })
    )
    localStorage.setItem('internmatch_token', 't')
    mockFetch(async () => ({
      ok: false,
      text: async () => JSON.stringify({ message: 'MODERATION_ERROR' }),
    }))
    const getCtx = renderProbe()
    const result = await act(async () => getCtx().updateProfile({ bio: 'bad' }))
    expect(result).toEqual({ ok: false, message: 'MODERATION_ERROR' })
  })

  it('getUsers returns empty array when call fails', async () => {
    mockFetch(async () => ({ ok: false }))
    const getCtx = renderProbe()
    const users = await act(async () => getCtx().getUsers())
    expect(users).toEqual([])
  })

  it('uploadResume reports upload failure message', async () => {
    mockFetch(async () => ({ ok: false, text: async () => 'Upload denied' }))
    const getCtx = renderProbe()
    const result = await act(async () => getCtx().uploadResume(new File(['x'], 'r.pdf')))
    expect(result).toEqual({ ok: false, message: 'Upload denied' })
  })
})