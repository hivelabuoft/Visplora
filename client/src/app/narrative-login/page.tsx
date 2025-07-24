'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../../styles/auth.css';

interface LoginFormData {
  username: string;
  password: string;
}

export default function NarrativeLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user session data
        localStorage.setItem('narrativeUser', JSON.stringify(data.user));
        
        // Store authentication token if provided
        if (data.token) {
          localStorage.setItem('narrativeToken', data.token);
        }
        
        // Redirect to narrative page
        router.push('/narrative');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="welcome-badge">
            <span className="icon">🎯</span>
            Welcome Back
          </div>
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">Continue your narrative visualization study</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label primary">
              <span className="icon">🔤</span>
              Username
            </label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label className="form-label secondary">
              <span className="icon">🔒</span>
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="form-input secondary"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="submit-button"
          >
            {isLoading && <span className="loading-spinner"></span>}
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="info-text">
            Don&apos;t have an account?{' '}
            <Link href="/narrative-signup" className="auth-link">
              Sign up here
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
}
