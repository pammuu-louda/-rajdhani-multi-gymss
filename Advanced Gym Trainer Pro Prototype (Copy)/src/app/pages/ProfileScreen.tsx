import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api, supabase } from '../utils/supabase';
import { ArrowLeft, Calendar, TrendingUp, Award, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function ProfileScreen() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await api.getProfile();
      setUser(profileData.user);

      const attendanceData = await api.getAttendanceHistory();
      setAttendance(attendanceData.attendance);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const calculateStreak = () => {
    if (attendance.length === 0) return 0;

    const sortedDates = attendance
      .map(a => new Date(a.date).getTime())
      .sort((a, b) => b - a);

    let streak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const dayDiff = (sortedDates[i] - sortedDates[i + 1]) / (1000 * 60 * 60 * 24);
      if (dayDiff <= 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getAge = () => {
    if (!user?.dob) return null;
    return new Date().getFullYear() - new Date(user.dob).getFullYear();
  };

  const getMotivationalMessage = () => {
    const total = attendance.length;
    if (total === 0) return "Let's start your fitness journey!";
    if (total < 5) return "Great start! Keep it up!";
    if (total < 10) return "You're building momentum!";
    if (total < 20) return "Impressive dedication!";
    return "You're a fitness champion!";
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const streak = calculateStreak();
  const age = getAge();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 pb-12">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={24} />
          <span className="font-semibold">Back</span>
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
            <UserIcon size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black">{user?.name || 'Member'}</h1>
            <p className="text-white/80">{user?.email}</p>
            {age && <p className="text-white/80">{age} years old</p>}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 -mt-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Workouts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-lg"
          >
            <Calendar size={32} className="text-green-500 mb-3" />
            <p className="text-3xl font-black text-foreground">{attendance.length}</p>
            <p className="text-sm text-muted-foreground">Total Days</p>
          </motion.div>

          {/* Current Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-lg"
          >
            <TrendingUp size={32} className="text-amber-500 mb-3" />
            <p className="text-3xl font-black text-foreground">{streak}</p>
            <p className="text-sm text-muted-foreground">Day Streak 🔥</p>
          </motion.div>
        </div>

        {/* Motivational Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Award size={28} className="text-green-500" />
            <h3 className="text-xl font-bold text-foreground">Keep it up!</h3>
          </div>
          <p className="text-muted-foreground">{getMotivationalMessage()}</p>
        </motion.div>

        {/* Attendance History */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={24} className="text-green-500" />
            Attendance History
          </h3>

          {attendance.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendance
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((record, index) => {
                  const date = new Date(record.date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <motion.div
                      key={`${record.date}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        isToday 
                          ? 'bg-green-500/20 border border-green-500/30' 
                          : 'bg-background'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {date.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.timestamp).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      {isToday && (
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          TODAY
                        </span>
                      )}
                    </motion.div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar size={48} className="text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No attendance records yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Mark your first attendance from the home screen!
              </p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/');
          }}
          className="w-full mt-6 bg-red-500/20 text-red-500 border border-red-500/30 py-4 rounded-xl font-bold hover:bg-red-500/30 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}