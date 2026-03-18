import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api, supabase } from '../utils/supabase';
import { ArrowLeft, Users, TrendingUp, Plus, Calendar, Download, Edit2, Trash2, Save, X, UserCog, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  
  const [attendance, setAttendance] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingMachine, setEditingMachine] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{type: 'machine' | 'member', id: string} | null>(null);
  const [showMemberManagement, setShowMemberManagement] = useState(false);

  useEffect(() => {
    // Initialize dashboard with proper session handling
    const initDashboard = async () => {
      console.log('=== INITIALIZING DASHBOARD ===');
      
      // Check if in demo mode
      const isDemoOwner = localStorage.getItem('demoOwner') === 'true';
      
      if (isDemoOwner) {
        console.log('✅ Demo mode detected');
        // Load demo data and skip auth check
        loadDemoDashboard();
        return;
      }
      
      // First, check if we have a session (don't refresh yet, just get)
      console.log('Checking for existing session...');
      const { data: { session: existingSession }, error: getError } = await supabase.auth.getSession();
      
      if (getError) {
        console.error('❌ Error getting session:', getError);
        toast.error('Session error. Please login again.');
        navigate('/login');
        return;
      }
      
      if (!existingSession) {
        console.error('❌ No session found');
        toast.error('Please log in to continue.');
        navigate('/login');
        return;
      }
      
      console.log('✅ Session found');
      console.log('User ID:', existingSession.user.id);
      console.log('Token preview:', existingSession.access_token.substring(0, 30) + '...');
      console.log('Session expires:', new Date(existingSession.expires_at! * 1000).toLocaleString());
      
      // Check if session is about to expire (less than 5 minutes left)
      const expiresIn = existingSession.expires_at! * 1000 - Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (expiresIn < fiveMinutes) {
        console.log('⚠️ Session expiring soon, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          console.error('❌ Failed to refresh session:', refreshError);
          toast.error('Session expired. Please login again.');
          navigate('/login');
          return;
        }
        
        console.log('✅ Session refreshed successfully');
      } else {
        console.log('✅ Session is valid, no refresh needed');
        console.log(`Expires in: ${Math.floor(expiresIn / 1000 / 60)} minutes`);
      }
      
      // Wait a moment for everything to be ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Now load the dashboard
      loadDashboard();
    };
    
    initDashboard();
    
    // Poll for updates every 10 seconds for real-time feel
    const interval = setInterval(() => {
      const isDemoOwner = localStorage.getItem('demoOwner') === 'true';
      if (isDemoOwner) {
        loadDemoDashboard();
      } else {
        loadDashboard();
      }
    }, 10000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadDashboard = async () => {
    try {
      console.log('Loading owner dashboard data...');
      
      // Check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session found');
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      console.log('Session valid, user ID:', session.user.id);
      
      console.log('Fetching attendance...');
      try {
        const attendanceData = await api.getAllAttendance();
        console.log('✓ Attendance loaded:', attendanceData);
        setAttendance(attendanceData.attendance || []);
        console.log('Attendance records:', attendanceData.attendance?.length || 0);
      } catch (attendanceError: any) {
        console.error('Attendance fetch error:', attendanceError);
        // Don't fail completely if attendance fails - just set empty array
        setAttendance([]);
        toast.warning('Could not load attendance data');
      }

      console.log('Fetching machines...');
      try {
        const machinesData = await api.getMachines();
        console.log('✓ Machines loaded:', machinesData);
        setMachines(machinesData.machines || []);
        console.log('Machine records:', machinesData.machines?.length || 0);
      } catch (machinesError: any) {
        console.error('Machines fetch error:', machinesError);
        // Don't fail completely if machines fails - just set empty array
        setMachines([]);
        toast.warning('Could not load machines data');
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      
      // Check if it's an auth error
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error(`Failed to load dashboard: ${error.message}`);
        setLoading(false);
      }
    }
  };

  const loadDemoDashboard = () => {
    console.log('Loading demo dashboard data...');
    
    // Load members from localStorage
    const storedMembers = JSON.parse(localStorage.getItem('gymMembers') || '[]');
    setMembers(storedMembers);
    
    // Load attendance with face photos from localStorage
    const attendanceRecords = JSON.parse(localStorage.getItem('ownerAttendanceRecords') || '[]');
    
    // Filter for today's attendance
    const today = new Date().toDateString();
    const todayAttendance = attendanceRecords.filter((record: any) => record.date === today);
    
    setAttendance(todayAttendance);
    console.log('Attendance records:', todayAttendance.length);
    
    // Load machines from localStorage (owner-added ones)
    const ownerMachines = JSON.parse(localStorage.getItem('gymMachines') || '[]');
    setMachines(ownerMachines);
    console.log('Machine records:', ownerMachines.length);
    
    setLoading(false);
  };

  const exportAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    const csv = [
      'Name,Date,Time',
      ...attendance.map(a => 
        `${a.userName},${a.date},${new Date(a.timestamp).toLocaleTimeString()}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${today}.csv`;
    a.click();
    
    toast.success('Attendance exported!');
  };

  const handleDeleteMachine = (id: string) => {
    setShowDeleteConfirm({ type: 'machine', id });
  };

  const confirmDeleteMachine = () => {
    if (!showDeleteConfirm) return;
    
    const updatedMachines = machines.filter(m => m.id !== showDeleteConfirm.id);
    setMachines(updatedMachines);
    localStorage.setItem('gymMachines', JSON.stringify(updatedMachines));
    
    toast.success('Machine deleted successfully');
    setShowDeleteConfirm(null);
  };

  const handleUpdateMachine = (id: string, field: string, value: string) => {
    const updatedMachines = machines.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    );
    setMachines(updatedMachines);
    localStorage.setItem('gymMachines', JSON.stringify(updatedMachines));
  };

  const handleDeleteMember = (id: string) => {
    setShowDeleteConfirm({ type: 'member', id });
  };

  const confirmDeleteMember = () => {
    if (!showDeleteConfirm) return;
    
    const updatedMembers = members.filter(m => m.id !== showDeleteConfirm.id);
    setMembers(updatedMembers);
    localStorage.setItem('gymMembers', JSON.stringify(updatedMembers));
    
    toast.success('Member removed successfully');
    setShowDeleteConfirm(null);
  };

  const handleUpdateMember = (updatedMember: any) => {
    const updatedMembers = members.map(m => 
      m.id === updatedMember.id ? updatedMember : m
    );
    setMembers(updatedMembers);
    localStorage.setItem('gymMembers', JSON.stringify(updatedMembers));
    
    toast.success('Member updated successfully');
    setEditingMember(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 pb-12 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={24} />
            <span className="font-semibold">Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            {/* Edit Mode Toggle */}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`${
                editMode 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-white/20 hover:bg-white/30'
              } backdrop-blur-sm px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2`}
            >
              {editMode ? (
                <>
                  <Save size={18} />
                  Edit Mode ON
                </>
              ) : (
                <>
                  <Edit2 size={18} />
                  Edit Mode
                </>
              )}
            </button>

            <button
              onClick={() => {
                // Clear demo mode if active
                localStorage.removeItem('demoOwner');
                // Sign out from Supabase if logged in
                supabase.auth.signOut().then(() => navigate('/'));
              }}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl font-semibold hover:bg-white/30 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-black mb-2 tracking-tight">Owner Dashboard</h1>
        <p className="text-white/90 font-medium">Manage your gym efficiently</p>
      </div>

      <div className="px-6 -mt-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Today's Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/80 backdrop-blur-xl border-2 border-green-500/30 rounded-2xl p-5 shadow-lg"
          >
            <Users size={32} className="text-green-500 mb-3" />
            <p className="text-3xl font-black text-white">{attendance.length}</p>
            <p className="text-sm text-gray-400">Present Today</p>
          </motion.div>

          {/* Total Machines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/80 backdrop-blur-xl border-2 border-amber-500/30 rounded-2xl p-5 shadow-lg"
          >
            <TrendingUp size={32} className="text-amber-500 mb-3" />
            <p className="text-3xl font-black text-white">{machines.length}</p>
            <p className="text-sm text-gray-400">Total Machines</p>
          </motion.div>
        </div>

        {/* Member Management Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowMemberManagement(!showMemberManagement)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-2xl font-bold mb-6 flex items-center justify-between shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <UserCog size={24} />
            <span>Manage Members ({members.length})</span>
          </div>
          <span className="text-2xl">{showMemberManagement ? '−' : '+'}</span>
        </motion.button>

        {/* Member Management Section */}
        <AnimatePresence>
          {showMemberManagement && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/80 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl p-6 shadow-lg mb-6 overflow-hidden"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <UserCog size={24} className="text-purple-500" />
                All Members
              </h3>

              {members.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {members.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-900/80 rounded-xl border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-500/20 p-3 rounded-full">
                          <Users size={20} className="text-purple-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{member.name}</p>
                          <p className="text-sm text-gray-400">
                            Age: {new Date().getFullYear() - new Date(member.dob).getFullYear()} years
                          </p>
                          <p className="text-xs text-gray-500">Joined: {new Date(member.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {editMode && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingMember(member)}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users size={48} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No members registered yet</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-Time Attendance */}
        <div className="bg-gray-800/80 backdrop-blur-xl border-2 border-green-500/30 rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar size={24} className="text-green-500" />
              Today's Attendance
            </h3>
            <button
              onClick={exportAttendance}
              disabled={attendance.length === 0}
              className="bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              Export
            </button>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>

          {attendance.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendance
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((record, index) => (
                  <motion.div
                    key={`${record.userId}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-900/80 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      {record.facePhoto ? (
                        <img
                          src={record.facePhoto}
                          alt={record.userName}
                          className="w-14 h-14 rounded-full object-cover border-2 border-green-500"
                        />
                      ) : (
                        <div className="bg-green-500/20 p-3 rounded-full">
                          <Users size={20} className="text-green-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{record.userName}</p>
                        <p className="text-sm text-gray-400">
                          Checked in at {new Date(record.timestamp).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      PRESENT
                    </span>
                  </motion.div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No one present yet today</p>
              <p className="text-sm text-gray-500 mt-1">
                Attendance will appear here as members check in
              </p>
            </div>
          )}
        </div>

        {/* Machine Management */}
        <div className="bg-gray-800/80 backdrop-blur-xl border-2 border-amber-500/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={24} className="text-amber-500" />
              Gym Machines
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Owner-Added Only</span>
            </h3>
            <button
              onClick={() => navigate('/owner/add-machine')}
              className="bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add Machine
            </button>
          </div>

          {machines.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {machines.map((machine, index) => (
                <motion.div
                  key={machine.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900/80 rounded-xl p-4 border-2 border-gray-700 relative"
                >
                  {machine.photo && (
                    <img
                      src={machine.photo}
                      alt={machine.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  
                  {editMode && editingMachine === machine.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={machine.name}
                        onChange={(e) => handleUpdateMachine(machine.id, 'name', e.target.value)}
                        className="w-full bg-gray-800 border border-amber-500 rounded px-2 py-1 text-white text-sm"
                        placeholder="Machine Name"
                      />
                      <input
                        type="text"
                        value={machine.brand || ''}
                        onChange={(e) => handleUpdateMachine(machine.id, 'brand', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        placeholder="Brand"
                      />
                      <input
                        type="text"
                        value={machine.price || ''}
                        onChange={(e) => handleUpdateMachine(machine.id, 'price', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        placeholder="Price"
                      />
                      <button
                        onClick={() => setEditingMachine(null)}
                        className="w-full bg-green-500 text-white py-1 rounded text-sm font-semibold"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-white mb-1">{machine.name}</h4>
                          {machine.brand && (
                            <p className="text-xs text-gray-400">Brand: {machine.brand}</p>
                          )}
                          <p className="text-sm text-gray-400">{machine.type}</p>
                          {machine.price && (
                            <p className="text-sm text-amber-400 font-semibold mt-1">{machine.price}</p>
                          )}
                          {machine.ageLimit && (
                            <p className="text-xs text-orange-400 mt-1">Age Limit: {machine.ageLimit}</p>
                          )}
                        </div>
                        
                        {editMode && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingMachine(machine.id)}
                              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteMachine(machine.id)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No machines added yet</p>
              <button
                onClick={() => navigate('/owner/add-machine')}
                className="mt-4 text-amber-500 font-semibold hover:underline"
              >
                Add your first machine
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => navigate('/owner/add-machine')}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-full shadow-2xl hover:shadow-amber-500/50 hover:scale-110 transition-all z-40"
      >
        <Plus size={28} strokeWidth={3} />
      </motion.button>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border-2 border-red-500/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-red-500 p-4 rounded-full">
                  <Trash2 size={32} className="text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-center text-white mb-4">
                Delete {showDeleteConfirm.type === 'machine' ? 'Machine' : 'Member'}?
              </h2>
              <p className="text-gray-400 text-center mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showDeleteConfirm.type === 'machine' ? confirmDeleteMachine : confirmDeleteMember}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setEditingMember(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border-2 border-purple-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-purple-600 p-4 rounded-full">
                  <Edit2 size={32} className="text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-center text-white mb-6">
                Edit Member
              </h2>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateMember(editingMember);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                    className="w-full bg-gray-900/80 border border-gray-700 rounded-xl py-3 px-4 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={editingMember.dob}
                    onChange={(e) => setEditingMember({...editingMember, dob: e.target.value})}
                    className="w-full bg-gray-900/80 border border-gray-700 rounded-xl py-3 px-4 text-white"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg"
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