import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, waitFor, screen } from '@testing-library/react'
import { ToastProvider } from '../ToastContext'
import AuthContext from '../AuthContext'
import { ChatProvider, useChat } from '../ChatContext'
import { useToast } from '../ToastContext'
import * as fs from 'firebase/firestore'
import * as fb from 'firebase/auth'

vi.mock('../../firebase', () => ({
  db: { projectId: 'test' },
  auth: { app: {} },
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ name: 'messages' })),
  query: vi.fn(() => ({ q: true })),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  doc: vi.fn(() => ({ isDoc: true })),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => ({}) })),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  addDoc: vi.fn(async () => ({ id: 'msg-1' })),
  serverTimestamp: vi.fn(() => 'timestamp'),
}))

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(async () => ({ user: {} })),
}))

const alice = { email: 'alice@internmatch.com', name: 'Alice', role: 'STUDENT' }
const bob = { email: 'bob@internmatch.com', name: 'Bob', role: 'STUDENT' }

function renderChat() {
  let chat
  let toast
  function Probe() {
    chat = useChat()
    toast = useToast()
    return null
  }
  render(
    <ToastProvider>
      <AuthContext.Provider value={{ currentUser: alice }}>
        <ChatProvider>
          <Probe />
        </ChatProvider>
      </AuthContext.Provider>
    </ToastProvider>
  )
  return () => ({ chat: () => chat, toast: () => toast })
}

describe('ChatContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('opens a chat and sets it active', () => {
    const api = renderChat()
    act(() => api().chat().openChatWith(bob))
    expect(api().chat().openChats).toHaveLength(1)
    expect(api().chat().openChats[0].email).toBe('bob@internmatch.com')
    expect(api().chat().activeChat.email).toBe('bob@internmatch.com')
  })

  it('does not duplicate an already-open chat (case-insensitive)', () => {
    const api = renderChat()
    act(() => api().chat().openChatWith(bob))
    act(() => api().chat().openChatWith({ email: 'Bob@InternMatch.com', name: 'Bob' }))
    expect(api().chat().openChats).toHaveLength(1)
  })

  it('closeChat removes only the targeted chat', () => {
    const carol = { email: 'carol@internmatch.com', name: 'Carol' }
    const api = renderChat()
    act(() => api().chat().openChatWith(bob))
    act(() => api().chat().openChatWith(carol))
    expect(api().chat().openChats).toHaveLength(2)
    act(() => api().chat().closeChat(bob.email))
    expect(api().chat().openChats).toHaveLength(1)
    expect(api().chat().openChats[0].email).toBe('carol@internmatch.com')
  })

  it('sends a message and persists chat + message doc', async () => {
    const api = renderChat()
    await act(async () => {
      await api().chat().sendMessage(bob, 'Hello Bob')
    })
    expect(fs.setDoc).toHaveBeenCalledTimes(1)
    const chatData = fs.setDoc.mock.calls[0][1]
    expect(chatData.lastMessage).toBe('Hello Bob')
    expect(chatData.participants).toEqual(['alice@internmatch.com', 'bob@internmatch.com'])
    expect(chatData.unreadCount['bob@internmatch.com']).toBe(1)
    expect(chatData.unreadCount['alice@internmatch.com']).toBe(0)
    expect(fs.addDoc).toHaveBeenCalledTimes(1)
    expect(fs.addDoc.mock.calls[0][1]).toMatchObject({ text: 'Hello Bob', sender: 'alice@internmatch.com' })
  })

  it('blocks duplicate messages', async () => {
    localStorage.setItem('last_msg_bob@internmatch.com', 'hello')
    const api = renderChat()
    await act(async () => {
      await api().chat().sendMessage(bob, 'hello')
    })
    expect(fs.setDoc).not.toHaveBeenCalled()
    expect(await screen.findByText('Duplicate message detected.')).toBeInTheDocument()
  })

  it('blocks direct links', async () => {
    const api = renderChat()
    await act(async () => {
      await api().chat().sendMessage(bob, 'See https://evil-site.com now')
    })
    expect(fs.setDoc).not.toHaveBeenCalled()
    expect(await screen.findByText('Links are prohibited')).toBeInTheDocument()
  })

  it('blocks obfuscated links', async () => {
    const api = renderChat()
    await act(async () => {
      await api().chat().sendMessage(bob, 'visit google [dot] com')
    })
    expect(fs.setDoc).not.toHaveBeenCalled()
    expect(await screen.findByText('Links are prohibited')).toBeInTheDocument()
  })

  it('rate limits after 5 messages within the threshold window', async () => {
    const api = renderChat()
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await api().chat().sendMessage(bob, `message number ${i}`)
      })
    }
    await act(async () => {
      await api().chat().sendMessage(bob, 'one too many')
    })
    expect(await screen.findByText('Slow down! You are sending messages too fast.')).toBeInTheDocument()
  })

  it('authenticates anonymously with Firebase once the user is known', async () => {
    renderChat()
    await waitFor(() => expect(fb.signInAnonymously).toHaveBeenCalled())
  })
})