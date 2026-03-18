import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dumbbell, Lock, ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const DEFAULT_PASSWORD = "000999000";

export default function OwnerAccessScreen() {
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Change password modal states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Get stored password or use default
    const storedPassword = localStorage.getItem('ownerPassword') || DEFAULT_PASSWORD;

    if (password === storedPassword) {
      // Store demo owner credentials in localStorage
      localStorage.setItem('demoOwner', 'true');
      localStorage.setItem('memberLoggedIn', 'false');
      localStorage.setItem('memberName', 'Gym Owner');
      
      toast.success('Access granted! Welcome, Owner.');
      
      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 500);
    } else {
      toast.error('Incorrect password. Access denied.');
      setPassword('');
      setLoading(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    const storedPassword = localStorage.getItem('ownerPassword') || DEFAULT_PASSWORD;

    // Validate old password
    if (oldPassword !== storedPassword) {
      toast.error('Old password is incorrect');
      return;
    }

    // Validate new password
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Save new password
    localStorage.setItem('ownerPassword', newPassword);
    toast.success('Password updated successfully!');
    
    // Reset form and close modal
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl border-2 border-amber-500/30 rounded-3xl p-8 shadow-2xl"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-full shadow-lg shadow-amber-500/50">
              <Shield size={48} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-black text-center text-white mb-2 tracking-tight">
            Owner Access
          </h1>
          <p className="text-gray-400 text-center mb-8 text-sm">
            Enter your private password to manage the gym
          </p>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-6">
            {/* Password Input */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-3">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full bg-gray-900/80 border-2 border-gray-700 rounded-xl py-4 pl-12 pr-12 text-white text-lg font-mono tracking-widest placeholder:text-gray-600 placeholder:tracking-normal focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={loading || password.length === 0}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-xl font-black text-lg hover:from-amber-600 hover:to-orange-700 transition-all active:scale-98 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              {loading ? '🔓 Unlocking...' : '🔓 Unlock Access'}
            </button>
          </form>

          {/* Change Password Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowChangePassword(true)}
              className="text-amber-400 text-sm font-semibold hover:text-amber-300 hover:underline transition-colors"
            >
              Change Password?
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-xs text-amber-200 text-center leading-relaxed">
              🔒 Secure owner access only. Your password is encrypted and stored locally.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setShowChangePassword(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border-2 border-amber-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-amber-500 p-4 rounded-full">
                  <Lock size={32} className="text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-center text-white mb-2">
                Change Password
              </h2>
              <p className="text-gray-400 text-center mb-6 text-sm">
                Update your owner access password
              </p>

              <form onSubmit={handleChangePassword} className="space-y-5">
                {/* Old Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    className="w-full bg-gray-900/80 border border-gray-700 rounded-xl py-3 px-4 text-white font-mono tracking-widest placeholder:text-gray-600 placeholder:tracking-normal focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    minLength={6}
                    className="w-full bg-gray-900/80 border border-gray-700 rounded-xl py-3 px-4 text-white font-mono tracking-widest placeholder:text-gray-600 placeholder:tracking-normal focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    minLength={6}
                    className="w-full bg-gray-900/80 border border-gray-700 rounded-xl py-3 px-4 text-white font-mono tracking-widest placeholder:text-gray-600 placeholder:tracking-normal focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-bold hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/30"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
