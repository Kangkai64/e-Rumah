// Role Management Utility Component
// Add this to your app temporarily for testing admin roles

import { useState } from 'react'
import { supabase } from '../config/supabase'
import { useAuth } from './context/AuthContext'

export default function RoleManager() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const updateUserRole = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Find user by email
      const { data: targetUser, error: findError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', email)
        .single()

      if (findError) {
        throw new Error(`User not found: ${findError.message}`)
      }

      // Update role
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', targetUser.id)

      if (updateError) {
        throw new Error(`Failed to update role: ${updateError.message}`)
      }

      setMessage(`Successfully updated ${email} role to ${newRole}`)
      setEmail('')
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const makeCurrentUserAdmin = async () => {
    if (!user) {
      setMessage('No user logged in')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', user.id)

      if (error) throw error

      setMessage(`Made ${user.email} an admin. Please refresh the page.`)
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      padding: '2rem', 
      margin: '1rem', 
      border: '2px solid #ff6b6b', 
      borderRadius: '8px',
      backgroundColor: '#fff5f5',
      fontFamily: 'monospace'
    }}>
      <h3>🛠️ Role Management Utility (Development Only)</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Current User:</strong> {user?.email || 'Not logged in'}</p>
        <button 
          onClick={makeCurrentUserAdmin}
          disabled={loading || !user}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Make Current User Admin
        </button>
      </div>

      <form onSubmit={updateUserRole}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>
            New Role:
            <select 
              value={newRole} 
              onChange={(e) => setNewRole(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="support">Support</option>
            </select>
          </label>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Update Role
        </button>
      </form>

      {message && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem',
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
          border: `1px solid ${message.includes('Error') ? '#f44336' : '#4CAF50'}`,
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
    </div>
  )
}