import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';

export default function Signup({ onSignupSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await api.signup(formData.name, formData.email, formData.password);
      if (res.error) throw new Error(res.error);
      
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      onSignupSuccess(res.user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="auth-header">
          <img src="/favicon.png" alt="RequestLab Logo" className="brand-logo-large" />
          <h1>Create Account</h1>
        </div>
        <p>Join RequestLab today</p>
        
        {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '16px' }}>
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              required 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              placeholder="John Doe"
            />
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Email</label>
            <input 
              type="email" 
              required 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
              placeholder="name@company.com"
            />
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })} 
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '24px' }} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <p style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '500' }}>Log In</Link>
        </p>
      </div>
    </div>
  );
}
