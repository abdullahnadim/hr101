'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@fal.com.bd');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false, // Handle redirect manually for smoother UX
      });

      if (res?.error) {
        setError('Invalid credentials. Please try again.');
      } else {
        // Force routing to the admin dashboard on success
        router.push('/');
router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-100 p-8">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">HR Admin Portal</h1>
          <p className="text-sm text-neutral-500 mt-1">Sign in to manage employees and workspaces.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm"
              placeholder="admin@fal.com" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm"
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full mt-2 bg-black text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Secure Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}