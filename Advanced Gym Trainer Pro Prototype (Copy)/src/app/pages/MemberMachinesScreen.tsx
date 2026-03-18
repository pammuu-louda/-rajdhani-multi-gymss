import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Dumbbell, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function MemberMachinesScreen() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState<any[]>([]);
  const [memberAge, setMemberAge] = useState(0);
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    // Get member info
    const dob = localStorage.getItem('memberDOB');
    const name = localStorage.getItem('memberName');
    
    if (!dob || !name) {
      toast.error('Please log in as a member first');
      navigate('/member/entry');
      return;
    }

    setMemberName(name);
    
    // Calculate age
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    setMemberAge(age);

    // Load machines from localStorage (only owner-added ones)
    const ownerMachines = JSON.parse(localStorage.getItem('gymMachines') || '[]');
    
    // Filter by age limit
    const availableMachines = ownerMachines.filter((machine: any) => {
      if (!machine.ageLimit || machine.ageLimit === 'All Ages') {
        return true;
      }
      
      // Extract number from age limit (e.g., "18+" -> 18)
      const requiredAge = parseInt(machine.ageLimit.replace('+', ''));
      return age >= requiredAge;
    });

    setMachines(availableMachines);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 pb-12 shadow-xl">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={24} />
          <span className="font-semibold">Back</span>
        </button>

        <h1 className="text-4xl font-black mb-2 tracking-tight">Available Machines</h1>
        <p className="text-white/90 font-medium">Browse equipment available for your age group</p>
      </div>

      <div className="px-6 -mt-6">
        {/* Member Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/80 backdrop-blur-xl border-2 border-green-500/30 rounded-2xl p-5 shadow-lg mb-6"
        >
          <p className="text-white font-semibold">Welcome, {memberName}</p>
          <p className="text-gray-400 text-sm">Your age: {memberAge} years</p>
        </motion.div>

        {/* Machines List */}
        {machines.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">
              {machines.length} Machine{machines.length !== 1 ? 's' : ''} Available
            </h3>
            
            {machines.map((machine, index) => (
              <motion.div
                key={machine.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800/80 backdrop-blur-xl border-2 border-gray-700 rounded-2xl p-5 shadow-lg"
              >
                {machine.photo && (
                  <img
                    src={machine.photo}
                    alt={machine.name}
                    className="w-full h-48 object-cover rounded-xl mb-4"
                  />
                )}
                
                <h4 className="text-xl font-bold text-white mb-2">{machine.name}</h4>
                
                {machine.brand && (
                  <p className="text-sm text-gray-400 mb-1">Brand: {machine.brand}</p>
                )}
                
                <p className="text-sm text-gray-400 mb-2">Type: {machine.type}</p>
                
                {machine.description && (
                  <p className="text-gray-300 text-sm mb-3">{machine.description}</p>
                )}
                
                {machine.ageLimit && machine.ageLimit !== 'All Ages' && (
                  <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                    <Lock size={14} />
                    Age {machine.ageLimit}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Dumbbell size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Machines Available</h3>
            <p className="text-gray-400 mb-4">
              {memberAge < 18 
                ? "Some machines may have age restrictions. Contact the gym owner for more information."
                : "The gym owner hasn't added any machines yet."}
            </p>
          </div>
        )}

        {/* Age Restricted Notice */}
        {memberAge < 18 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-5"
          >
            <p className="text-orange-400 text-sm font-semibold mb-1">
              ⚠️ Age Restrictions Apply
            </p>
            <p className="text-orange-200 text-xs leading-relaxed">
              Some machines may not be visible due to age limitations. 
              Machines with age requirements higher than {memberAge} are hidden from your view.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
