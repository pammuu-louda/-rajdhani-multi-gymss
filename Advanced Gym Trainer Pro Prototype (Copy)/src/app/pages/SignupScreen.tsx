import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../utils/supabase';
import { supabase } from '../utils/supabase';
import { Dumbbell, Mail, Lock, User, UserCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupScreen() {
  const navigate = useNavigate();
  
  const [role, setRole] = useState<'member' | 'owner'>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('=== STARTING SIGNUP PROCESS ===');
      
      // Skip health check - it's causing 401 errors with Supabase Edge Functions
      // Create user account via backend
      console.log('Creating account via backend...');
      try {
        const signupResponse = await api.signup(email, password, role, name);
        console.log('✓ Account created:', signupResponse);
      } catch (signupError: any) {
        console.error('✗ Signup failed:', signupError);
        // If signup fails with 400, it might be user already exists
        if (signupError.message?.includes('already') || signupError.message?.includes('exists')) {
          throw new Error('An account with this email already exists. Please login instead.');
        }
        throw signupError;
      }
      
      // Wait for data to be persisted
      console.log('Waiting for data persistence...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sign in the user
      console.log('Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('✗ Sign in error after signup:', error);
        throw new Error(error.message);
      }

      if (!data.session) {
        console.error('✗ Failed to create session');
        throw new Error('Failed to create session');
      }

      console.log('✓ Sign in successful, session created');
      toast.success('Account created successfully!');

      // CRITICAL: Wait for auth state change to ensure session is persisted
      console.log('Waiting for session to be fully persisted...');
      await new Promise<void>((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state change event:', event);
          if (event === 'SIGNED_IN' && session) {
            console.log('✓ Session persisted to storage');
            subscription.unsubscribe();
            resolve();
          }
        });
        
        // Fallback: resolve after 2 seconds
        setTimeout(() => {
          console.log('Session persistence timeout, proceeding anyway');
          subscription.unsubscribe();
          resolve();
        }, 2000);
      });
      
      // Double-check session is available
      const { data: { session: verifySession } } = await supabase.auth.getSession();
      console.log('Session verification before navigation:', {
        hasSession: !!verifySession,
        hasToken: !!verifySession?.access_token,
        userId: verifySession?.user?.id
      });

      // Navigate based on role
      if (role === 'member') {
        console.log('Navigating to onboarding...');
        navigate('/onboarding');
      } else {
        console.log('Navigating to owner dashboard...');
        navigate('/owner/dashboard');
      }
      
      console.log('=== SIGNUP PROCESS COMPLETE ===');
    } catch (error: any) {
      console.error('=== SIGNUP PROCESS FAILED ===');
      console.error('Error details:', error);
      const errorMessage = error.message || 'Signup failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
              <Dumbbell size={40} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-center text-white mb-2">
            Create Account
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Join Gym Trainer Pro today
          </p>

          {/* Role Selection */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('member')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                role === 'member'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <User className="inline mr-2" size={18} />
              Member
            </button>
            <button
              type="button"
              onClick={() => setRole('owner')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                role === 'owner'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <UserCircle className="inline mr-2" size={18} />
              Owner
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Name {role === 'member' && '(optional)'}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-lg bg-green-500 hover:bg-green-600 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-green-500 font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}