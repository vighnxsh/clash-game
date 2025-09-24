import { useState } from 'react';
import { API_BASE_URL } from './config';

interface LoginProps {
  onLogin: (token: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          type: 'user'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isSignup) {
        // After signup, automatically sign in
        const signinResponse = await fetch(`${API_BASE_URL}/api/v1/signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        });

        const signinData = await signinResponse.json();
        if (!signinResponse.ok) {
          throw new Error(signinData.message || 'Sign in failed');
        }

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-300 rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">
              {isSignup ? 'Welcome to 2D Metaverse' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 text-sm">
              {isSignup ? 'Create your account to start exploring' : 'Sign in to continue your journey'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-black mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-red-700 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-base font-semibold bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-black"
            >
              {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-gray-600 hover:text-black text-sm font-medium"
              >
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
