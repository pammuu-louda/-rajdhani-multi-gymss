import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../utils/supabase';
import { Search, Plus, User, LogOut, Dumbbell, X, Check, Calendar, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Sparkles } from 'lucide-react';
import { Lock } from 'lucide-react';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const [userType, setUserType] = useState<'member' | 'owner' | null>(null);
  const [userName, setUserName] = useState('');
  const [userDOB, setUserDOB] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [hasCheckedAttendance, setHasCheckedAttendance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if member is logged in via localStorage
      const memberLoggedIn = localStorage.getItem('memberLoggedIn');
      const memberName = localStorage.getItem('memberName');
      const memberDOB = localStorage.getItem('memberDOB');

      if (memberLoggedIn === 'true' && memberName && memberDOB) {
        // Member authentication via localStorage
        console.log('Member authenticated via localStorage');
        setUserType('member');
        setUserName(memberName);
        setUserDOB(memberDOB);
        
        // Check attendance for today
        const attendanceToday = localStorage.getItem(`attendance_${new Date().toDateString()}`);
        setHasCheckedAttendance(attendanceToday === 'true');
        
        // Show attendance popup if not checked
        if (attendanceToday !== 'true') {
          setTimeout(() => setShowAttendancePopup(true), 1000);
        }
        
        setLoading(false);
        return;
      }

      // Check for demo owner mode
      const isDemoOwner = localStorage.getItem('demoOwner') === 'true';
      if (isDemoOwner) {
        console.log('Demo owner authenticated');
        setUserType('owner');
        setUserName('Demo Owner');
        setLoading(false);
        return;
      }

      // Check for owner authentication via Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Owner authenticated via Supabase');
        setUserType('owner');
        setUserName('Owner'); // We could fetch the actual name from API if needed
        setLoading(false);
        return;
      }

      // No authentication found - redirect to splash
      console.log('No authentication found, redirecting to splash');
      navigate('/');
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setWorkouts([]);
      return;
    }

    try {
      // Search owner-uploaded machines
      const ownerMachines = JSON.parse(localStorage.getItem('gymMachines') || '[]');
      
      // Get member age for filtering
      const memberDOB = localStorage.getItem('memberDOB');
      let memberAge = 0;
      if (memberDOB) {
        memberAge = new Date().getFullYear() - new Date(memberDOB).getFullYear();
      }

      // Filter machines by search query and age limit
      const filtered = ownerMachines.filter((machine: any) => {
        const matchesSearch = machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          machine.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          machine.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        // Check age limit
        if (!machine.ageLimit || machine.ageLimit === 'All Ages') {
          return true;
        }
        
        // Parse age limit
        if (machine.ageLimit === '18+') {
          return memberAge >= 18;
        } else if (machine.ageLimit.includes('-')) {
          const [min, max] = machine.ageLimit.split('-').map((n: string) => parseInt(n));
          return memberAge >= min && memberAge <= max;
        } else {
          const requiredAge = parseInt(machine.ageLimit.replace('+', ''));
          return memberAge >= requiredAge;
        }
      });
      
      setWorkouts(filtered);
      
      if (filtered.length === 0) {
        toast.info('No machines found matching your search');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search machines');
    }
  };

  const handleAttendance = async (present: boolean) => {
    if (present) {
      try {
        // Store attendance in localStorage
        const today = new Date().toDateString();
        const timestamp = new Date().toISOString();
        localStorage.setItem(`attendance_${today}`, 'true');
        localStorage.setItem(`attendance_${today}_time`, timestamp);
        
        // Get member face photo
        const memberFacePhoto = localStorage.getItem('memberFacePhoto') || '';
        
        // Store attendance with face photo for owner to see
        const ownerAttendance = JSON.parse(localStorage.getItem('ownerAttendanceRecords') || '[]');
        ownerAttendance.push({
          userId: Date.now().toString(),
          userName: userName,
          userDOB: userDOB,
          date: today,
          timestamp: timestamp,
          facePhoto: memberFacePhoto
        });
        localStorage.setItem('ownerAttendanceRecords', JSON.stringify(ownerAttendance));
        
        // For members, we'll just store locally. For owners, we'd call API
        if (userType === 'member') {
          toast.success('Attendance marked! Have a great workout! 💪');
        }
        
        setHasCheckedAttendance(true);
      } catch (error: any) {
        console.error('Attendance error:', error);
        toast.error('Failed to log attendance');
      }
    }
    setShowAttendancePopup(false);
  };

  const handleLogout = async () => {
    if (userType === 'member') {
      // Clear member localStorage
      localStorage.removeItem('memberLoggedIn');
      localStorage.removeItem('memberName');
      localStorage.removeItem('memberDOB');
    } else {
      // Sign out from Supabase for owners
      await supabase.auth.signOut();
    }
    navigate('/');
  };

  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Don't stop when you're tired. Stop when you're done.",
      "The only bad workout is the one that didn't happen.",
      "Your body can stand almost anything. It's your mind you have to convince.",
      "Success starts with self-discipline.",
      "The pain you feel today will be the strength you feel tomorrow.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 pb-24 rounded-b-[2rem] shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
              <Dumbbell size={28} />
            </div>
            <h1 className="text-2xl font-black">Gym Trainer Pro</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-xl hover:bg-white/30 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Owner Dashboard Button */}
            {userType === 'owner' && (
              <button
                onClick={() => navigate('/owner/dashboard')}
                className="bg-amber-500 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors"
              >
                Dashboard
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-xl hover:bg-white/30 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div className="mb-6">
          <p className="text-white/80 text-sm mb-1">Welcome back,</p>
          <h2 className="text-3xl font-black">{userName}</h2>
          {userDOB && (
            <p className="text-white/70 text-sm mt-1">
              Age: {new Date().getFullYear() - new Date(userDOB).getFullYear()} years
            </p>
          )}
          {hasCheckedAttendance && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Check size={16} className="text-green-300" />
              <span className="text-white/90">Attendance logged for today</span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search workouts (e.g., 'leg workout')..."
            className="w-full bg-white text-gray-900 rounded-2xl py-4 pl-12 pr-4 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          className="w-full mt-3 bg-white/20 backdrop-blur-sm text-white py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Content */}
      <div className="px-6 -mt-12">
        {/* Motivational Quote Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 mb-6"
        >
          <p className="text-gray-300 text-base italic leading-relaxed mb-3">
            "{getMotivationalQuote()}"
          </p>
          <button
            onClick={() => navigate('/quotes')}
            className="text-green-400 text-sm font-semibold hover:underline"
          >
            View all quotes →
          </button>
        </motion.div>

        {/* Browse Machines Button (Member Only) */}
        {userType === 'member' && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/member/machines')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-2xl font-bold mb-6 flex items-center justify-between shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <Dumbbell size={24} />
              <span>Browse Available Machines</span>
            </div>
            <span>→</span>
          </motion.button>
        )}

        {/* Add Machine Button (Owner Only) */}
        {userType === 'owner' && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => navigate('/owner/add-machine')}
            className="fixed bottom-6 right-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5 rounded-full shadow-2xl hover:shadow-amber-500/50 hover:scale-110 transition-all z-40"
          >
            <Plus size={28} strokeWidth={3} />
          </motion.button>
        )}

        {/* Workout Results */}
        {workouts.length > 0 ? (
          <div className="space-y-4 pb-24">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Search Results ({workouts.length})
            </h3>
            {workouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/machine/${workout.id}`)}
                className="bg-card border border-border rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-98"
              >
                {workout.photo && (
                  <img
                    src={workout.photo}
                    alt={workout.name}
                    className="w-full h-40 object-cover rounded-xl mb-3"
                  />
                )}
                
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{workout.name}</h4>
                    {workout.description && (
                      <p className="text-sm text-muted-foreground">{workout.description}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500">
                    {workout.type}
                  </span>
                </div>

                {workout.ageLimit && workout.ageLimit !== 'All Ages' && (
                  <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold">
                    <Lock size={16} />
                    Age {workout.ageLimit}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No workouts found. Try a different search.</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Dumbbell size={64} className="text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-bold text-foreground mb-2">Ready to Train?</h3>
            <p className="text-muted-foreground mb-6">
              Search for a workout to get started
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['leg workout', 'chest day', 'back & biceps', 'full body'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    // Trigger search after a brief delay to update the query
                    setTimeout(() => {
                      const mockWorkouts = [
                        {
                          id: '1',
                          name: 'Leg Blast Workout',
                          description: 'Complete leg day routine',
                          difficulty: 'Intermediate',
                          duration: 45,
                          exercises: ['Squats', 'Leg Press', 'Lunges'],
                          available: true,
                        },
                        {
                          id: '2',
                          name: 'Chest & Arms Power',
                          description: 'Upper body strength training',
                          difficulty: 'Beginner',
                          duration: 35,
                          exercises: ['Bench Press', 'Bicep Curls', 'Tricep Dips'],
                          available: true,
                        },
                      ];
                      const filtered = mockWorkouts.filter(w => 
                        w.name.toLowerCase().includes(term.toLowerCase()) ||
                        w.description.toLowerCase().includes(term.toLowerCase())
                      );
                      setWorkouts(filtered.length > 0 ? filtered : mockWorkouts);
                    }, 50);
                  }}
                  className="bg-green-500/20 text-green-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-500/30 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Popup */}
      <AnimatePresence>
        {showAttendancePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-green-500 p-4 rounded-full">
                  <Calendar size={40} className="text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-center text-foreground mb-2">
                Mark Attendance
              </h2>
              <p className="text-center text-muted-foreground mb-6">
                Today is <span className="font-semibold text-green-500">{getDayOfWeek()}</span>
                <br />
                Are you present at the gym?
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleAttendance(true)}
                  className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Yes, I'm Here
                </button>
                <button
                  onClick={() => handleAttendance(false)}
                  className="w-full bg-gray-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Not Today
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Your attendance is saved locally
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}