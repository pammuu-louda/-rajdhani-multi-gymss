import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dumbbell, Lock, User, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

const MEMBER_PASSWORD = "12345###";

export default function MemberEntryScreen() {
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check password
    if (password !== MEMBER_PASSWORD) {
      toast.error('Incorrect password. Please try again.');
      setLoading(false);
      return;
    }

    // Validate name and DOB
    if (!name.trim()) {
      toast.error('Please enter your name');
      setLoading(false);
      return;
    }

    if (!dob) {
      toast.error('Please enter your date of birth');
      setLoading(false);
      return;
    }

    // Store in localStorage
    try {
      localStorage.setItem('memberLoggedIn', 'true');
      localStorage.setItem('memberName', name.trim());
      localStorage.setItem('memberDOB', dob);
      
      // Also add to members list for owner to manage
      const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
      const existingMember = members.find((m: any) => m.name === name.trim() && m.dob === dob);
      
      if (!existingMember) {
        members.push({
          id: Date.now().toString(),
          name: name.trim(),
          dob: dob,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('gymMembers', JSON.stringify(members));
      }
      
      toast.success(`Welcome, ${name}!`);
      
      // Navigate to profile setup
      setTimeout(() => {
        navigate('/member/profile-setup');
      }, 500);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      toast.error('Failed to save your information. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-6">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-500 p-4 rounded-full">
              <Dumbbell size={40} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-center text-white mb-2">
            Member Entry
          </h1>
          <p className="text-white/80 text-center mb-8">
            Enter your details to access the gym
          </p>

          {/* Form */}
          <form onSubmit={handleEntry} className="space-y-5">
            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Access Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/20 border border-white/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/50 transition-all"
                />
              </div>
              <p className="text-xs text-white/60 mt-1">
                Use the gym's access password
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full bg-white/20 border border-white/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/50 transition-all"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white/20 border border-white/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/50 transition-all [color-scheme:dark]"
                />
              </div>
              <p className="text-xs text-white/60 mt-1">
                For personalized workout recommendations
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entering...' : 'Enter Gym'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
            <p className="text-xs text-white/70 text-center">
              🔒 Your information is stored locally on this device.
              <br />
              You won't need to enter this again on your next visit.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}