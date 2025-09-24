"use client";

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/config';

interface LoginProps {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isSignup ? '/api/v1/signup' : '/api/v1/signin';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, type: 'user' }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      if (isSignup) {
        const signinResponse = await fetch(`${API_BASE_URL}/api/v1/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const signinData = await signinResponse.json();
        if (!signinResponse.ok) throw new Error(signinData.message || 'Sign in failed');
        onLogin(signinData.token);
      } else {
        onLogin(data.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-12 py-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
      
      <div className="w-full max-w-md relative z-10 animate-scaleIn">
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 shadow-glow">
              <img 
                src="/avatar.png" 
                alt="2D Metaverse Avatar" 
                className="w-full h-full rounded-2xl object-cover"
                onError={(e) => {
                  // Fallback to gradient circle if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-glow" style={{display: 'none'}}>
                <span className="text-white font-bold text-2xl">2D</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-2">
              {isSignup ? 'Welcome to 2D Metaverse' : 'Welcome Back'}
            </h2>
            <p className="text-muted-foreground">
              {isSignup ? 'Create your account to start exploring' : 'Sign in to continue your journey'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-foreground">Username</label>
                <input 
                  id="username" 
                  name="username" 
                  type="text" 
                  required 
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  placeholder="Enter your username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">Password</label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm text-center animate-slideInLeft">
                <div className="flex items-center justify-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>{isSignup ? '🚀 Create Account' : '🔑 Sign In'}</span>
                </div>
              )}
            </button>

            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setIsSignup(!isSignup)} 
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


