import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import RequireAuth from '../RequireAuth'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>LoginPage</div>} />
          <Route
            path="/dashboard/student"
            element={
              <RequireAuth>
                <div>StudentDashboard</div>
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/employer"
            element={
              <RequireAuth>
                <div>EmployerDashboard</div>
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <RequireAuth>
                <div>AdminDashboard</div>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

const asUser = (role) =>
  localStorage.setItem('internmatch_currentUser', JSON.stringify({ email: 'u@internmatch.com', role }))

describe('RequireAuth', () => {
  it('redirects unauthenticated users to /login', () => {
    renderAt('/dashboard/student')
    expect(screen.getByText('LoginPage')).toBeInTheDocument()
    expect(screen.queryByText('StudentDashboard')).not.toBeInTheDocument()
  })

  it('lets a student into their own dashboard', () => {
    asUser('STUDENT')
    renderAt('/dashboard/student')
    expect(screen.getByText('StudentDashboard')).toBeInTheDocument()
  })

  it('redirects a student away from an employer dashboard', () => {
    asUser('STUDENT')
    renderAt('/dashboard/employer')
    expect(screen.getByText('StudentDashboard')).toBeInTheDocument()
    expect(screen.queryByText('EmployerDashboard')).not.toBeInTheDocument()
  })

  it('lets an employer into their own dashboard', () => {
    asUser('EMPLOYER')
    renderAt('/dashboard/employer')
    expect(screen.getByText('EmployerDashboard')).toBeInTheDocument()
  })

  it('redirects an employer away from a student dashboard', () => {
    asUser('EMPLOYER')
    renderAt('/dashboard/student')
    expect(screen.getByText('EmployerDashboard')).toBeInTheDocument()
    expect(screen.queryByText('StudentDashboard')).not.toBeInTheDocument()
  })

  it('routes admins to the admin dashboard', () => {
    asUser('ADMIN')
    renderAt('/dashboard/student')
    expect(screen.getByText('AdminDashboard')).toBeInTheDocument()
  })
})