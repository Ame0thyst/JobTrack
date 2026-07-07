'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Layers, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all required fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Register the user
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed.');
        return;
      }

      // 2. Auto sign-in after successful registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Account created! Please sign in.');
        router.push('/login');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />
      <div className="auth-grid" />

      <div className={`auth-container auth-container--register ${mounted ? 'auth-container--visible' : ''}`}>
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Layers size={28} className="text-white" />
            </div>
            <span className="auth-logo-text">JobTrack</span>
          </div>

          <div className="auth-headline">
            <h1>Start your<br /><span className="auth-headline-accent">focused search.</span></h1>
            <p>Join thousands of job seekers who turned chaos into a structured, winning workflow.</p>
          </div>

          <ul className="auth-features">
            {[
              'Free to use, always',
              'No credit card required',
              'Your data stays private',
              'Cancel anytime',
            ].map(text => (
              <li key={text} className="auth-feature-item">
                <span className="auth-feature-icon"><CheckCircle2 size={16} /></span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right panel — form */}
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2>Create account</h2>
              <p>Start tracking opportunities today</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="name">Your Name</label>
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>Create Account <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{' '}
              <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
