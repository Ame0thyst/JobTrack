'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Layers, Mail, Lock, ArrowRight, Loader2, Sparkles, TrendingUp, Target } from 'lucide-react';

const FEATURES = [
  { icon: Target, text: 'Track every application in one place' },
  { icon: TrendingUp, text: 'Visualize your hiring pipeline' },
  { icon: Sparkles, text: 'Never miss a follow-up again' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password. Please try again.');
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
      {/* Animated background orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      {/* Grid overlay */}
      <div className="auth-grid" />

      <div className={`auth-container ${mounted ? 'auth-container--visible' : ''}`}>
        {/* Left panel — brand / feature list */}
        <div className="auth-left">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Layers size={28} className="text-white" />
            </div>
            <span className="auth-logo-text">JobTrack</span>
          </div>

          <div className="auth-headline">
            <h1>Your career,<br /><span className="auth-headline-accent">organized.</span></h1>
            <p>A calm, structured workspace for every stage of your job search. No spreadsheets, no chaos.</p>
          </div>

          <ul className="auth-features">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="auth-feature-item">
                <span className="auth-feature-icon"><Icon size={16} /></span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="auth-stat-row">
            <div className="auth-stat">
              <span className="auth-stat-number">10k+</span>
              <span className="auth-stat-label">Applications tracked</span>
            </div>
            <div className="auth-stat-divider" />
            <div className="auth-stat">
              <span className="auth-stat-number">94%</span>
              <span className="auth-stat-label">Never miss a deadline</span>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2>Welcome back</h2>
              <p>Sign in to your workspace</p>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
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
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?{' '}
              <Link href="/register">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
