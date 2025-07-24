'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../../styles/auth.css';

interface SignupFormData {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export default function NarrativeSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<SignupFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!formData.username || !formData.firstName || !formData.lastName) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          participantId: `participant_${Date.now()}`,
          registrationDate: new Date()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user session data
        localStorage.setItem('narrativeUser', JSON.stringify(data.user));
        
        // Redirect to narrative page
        router.push('/narrative');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
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
            <span className="icon">📊</span>
            Narrative Scaffolding Study
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join our visualization research study</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name Fields */}
          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label primary">
                <span className="icon">👤</span>
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter first name"
              />
            </div>
            <div className="form-group">
              <label className="form-label secondary">
                <span className="icon">👤</span>
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="form-input secondary"
                placeholder="Enter last name"
              />
            </div>
          </div>

          {/* Username */}
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
              placeholder="Choose a unique username"
            />
          </div>

          {/* Password Fields */}
          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label primary">
                <span className="icon">🔒</span>
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter password"
              />
            </div>
            <div className="form-group">
              <label className="form-label secondary">
                <span className="icon">🔒</span>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="form-input secondary"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="submit-button"
          >
            {isLoading && <span className="loading-spinner"></span>}
            {isLoading ? 'Creating Account...' : 'Create Account & Start Study'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="info-text">
            Already have an account?{' '}
            <Link href="/narrative-login" className="auth-link">
              Sign in here
            </Link>
          </p>
        
        </div>
      </div>
    </div>
  );
}
