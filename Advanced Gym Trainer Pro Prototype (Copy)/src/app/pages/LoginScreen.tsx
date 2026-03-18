import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase, api } from '../utils/supabase';
import { Dumbbell, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginScreen() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoOption, setShowDemoOption] = useState(false);

  const handleDemoLogin = () => {
    // Store demo owner credentials in localStorage
    localStorage.setItem('demoOwner', 'true');
    localStorage.setItem('memberLoggedIn', 'false');
    localStorage.setItem('memberName', 'Demo Owner');
    toast.success('Demo mode activated!');
    navigate('/owner/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('=== STARTING OWNER LOGIN PROCESS ===');
      
      // Check if Supabase is reachable
      try {
        const testResponse = await fetch(`https://${supabase.supabaseUrl.split('//')[1]}/auth/v1/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        console.log('Supabase health check:', testResponse.status);
      } catch (healthError) {
        console.error('Supabase health check failed:', healthError);
        setShowDemoOption(true);
        throw new Error('Unable to connect to authentication server. Please check your internet connection or try demo mode.');
      }

      // Sign in with Supabase
      console.log('Attempting Supabase authentication...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('✗ Supabase auth error:', error);
        
        // If it's a network error, show demo option
        if (error.message.includes('fetch') || error.message.includes('network')) {
          setShowDemoOption(true);
          throw new Error('Connection error. You can try demo mode below.');
        }
        
        throw new Error(error.message);
      }

      if (!data.session) {
        console.error('✗ No session created');
        throw new Error('Login failed - no session created');
      }

      console.log('✓ Supabase authentication successful');
      console.log('User ID:', data.user?.id);

      // Wait for auth state change event to ensure session is persisted
      console.log('Waiting for auth state change event...');
      await new Promise<void>((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event);
          if (event === 'SIGNED_IN' && session) {
            console.log('✓ SIGNED_IN event received, session persisted');
            subscription.unsubscribe();
            resolve();
          }
        });
        
        // Fallback timeout
        setTimeout(() => {
          console.log('⚠️ Auth state timeout, proceeding anyway');
          subscription.unsubscribe();
          resolve();
        }, 3000);
      });
      
      // Verify session
      console.log('Verifying session persistence...');
      const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession();
      
      if (verifyError || !verifySession) {
        console.error('✗ Session could not be retrieved after storage!');
        throw new Error('Session was not properly stored. Please try again.');
      }
      
      console.log('✓ Session verified and retrievable');

      // Clear any demo mode flags
      localStorage.removeItem('demoOwner');

      // Fetch user profile to verify owner role
      console.log('Fetching user profile...');
      try {
        const profileData = await api.getProfile();
        console.log('✓ Profile fetched:', profileData);
        
        if (profileData.user?.role !== 'owner') {
          console.error('✗ Role mismatch: This account is not an owner account');
          toast.error('This account is not registered as an owner');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        console.log('✓ Owner role verified');
        toast.success('Login successful!');
        
        // Navigate to owner dashboard
        console.log('Navigating to owner dashboard...');
        navigate('/owner/dashboard');
      } catch (profileError: any) {
        console.error('✗ Profile fetch failed:', profileError);
        toast.warning('Logged in, but profile data unavailable');
        navigate('/owner/dashboard');
      }
      
      console.log('=== OWNER LOGIN PROCESS COMPLETE ===');
    } catch (error: any) {
      console.error('=== OWNER LOGIN PROCESS FAILED ===');
      console.error('Error details:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-4 rounded-full">
              <Dumbbell size={40} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-center text-white mb-2">
            Owner Login
          </h1>
          <p className="text-white/80 text-center mb-8">
            Secure access for gym owners
          </p>

          {/* Connection Warning */}
          {showDemoOption && (
            <div className="mb-6 bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-200 font-semibold">Connection Issue</p>
                <p className="text-xs text-amber-300 mt-1">
                  Unable to connect to authentication server. You can use demo mode to explore owner features.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full bg-white/20 border border-white/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/20 border border-white/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Mode Button */}
          {showDemoOption && (
            <button
              onClick={handleDemoLogin}
              className="w-full mt-4 bg-white/20 border border-white/30 text-white py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-all active:scale-95"
            >
              Try Demo Mode
            </button>
          )}

          {/* Sign Up Link */}
          <p className="text-center text-sm text-white/70 mt-6">
            Don't have an owner account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-amber-300 font-semibold hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}