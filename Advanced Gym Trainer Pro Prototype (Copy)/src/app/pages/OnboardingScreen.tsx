import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api, supabase } from '../utils/supabase';
import { User, Calendar, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function OnboardingScreen() {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !dob) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate date of birth
    const birthDate = new Date(dob);
    const today = new Date();
    if (birthDate > today) {
      toast.error('Date of birth cannot be in the future');
      return;
    }

    setLoading(true);

    try {
      console.log('=== STARTING ONBOARDING ===');
      console.log('Updating profile with:', { name, dob });
      
      // CRITICAL: Verify session exists before making API call
      console.log('Checking for active session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw new Error('Session error. Please login again.');
      }
      
      if (!session) {
        console.error('❌ No active session found');
        throw new Error('No active session. Please login again.');
      }
      
      console.log('✅ Active session found:', {
        userId: session.user.id,
        hasToken: !!session.access_token,
        expiresAt: new Date(session.expires_at! * 1000).toLocaleString()
      });
      
      // Wait a moment to ensure session is fully persisted
      console.log('Ensuring session persistence...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now update profile
      console.log('Calling updateProfile API...');
      const result = await api.updateProfile(name, dob);
      console.log('✓ Profile update result:', result);
      
      toast.success(`Welcome, ${name}! Your profile is ready.`);
      
      // Small delay to show success message before navigation
      setTimeout(() => {
        navigate('/home');
      }, 500);
      
      console.log('=== ONBOARDING COMPLETE ===');
    } catch (error: any) {
      console.error('=== ONBOARDING FAILED ===');
      console.error('Onboarding error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = error.message || 'Failed to update profile. Please try again.';
      
      // If it's an auth error, provide helpful message
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('session')) {
        errorMessage = 'Session expired. Please login again.';
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login?role=member');
        }, 2000);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex justify-center mb-6"
          >
            <div className="p-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
              <User size={48} className="text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-black text-center text-white mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Help us personalize your workout experience
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We'll use this to personalize your workouts
              </p>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Helps us adjust workout intensity for your age
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-lg bg-green-500 hover:bg-green-600 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-8 flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Continue to App'}
              <ArrowRight size={20} />
            </button>
          </form>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
            Your information is used only for personalization and will not be shared.
          </p>
        </div>

        {/* Motivational Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-green-400 italic mt-6 text-sm"
        >
          "Success starts with self-discipline"
        </motion.p>
      </motion.div>
    </div>
  );
}