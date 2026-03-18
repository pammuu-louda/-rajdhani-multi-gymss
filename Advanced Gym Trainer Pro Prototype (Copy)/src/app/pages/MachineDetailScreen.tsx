import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Dumbbell, Tag, FileText, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function MachineDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [machine, setMachine] = useState<any>(null);

  useEffect(() => {
    // Load machine details
    const machines = JSON.parse(localStorage.getItem('gymMachines') || '[]');
    const foundMachine = machines.find((m: any) => m.id === id);
    
    if (!foundMachine) {
      toast.error('Machine not found');
      navigate('/home');
      return;
    }
    
    setMachine(foundMachine);
  }, [id, navigate]);

  if (!machine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

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

        <h1 className="text-4xl font-black mb-2 tracking-tight">{machine.name}</h1>
        <p className="text-white/90 font-medium">Machine Details</p>
      </div>

      <div className="px-6 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/80 backdrop-blur-xl border-2 border-green-500/30 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Media Display */}
          {machine.photo && (
            <div className="relative">
              {machine.photo.includes('video') || machine.uploadedFile?.type?.startsWith('video/') ? (
                <video
                  src={machine.photo}
                  controls
                  className="w-full h-80 object-cover"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={machine.photo}
                  alt={machine.name}
                  className="w-full h-80 object-cover"
                />
              )}
              
              {/* Overlay gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-800/80 to-transparent"></div>
            </div>
          )}

          {/* Details */}
          <div className="p-6 space-y-5">
            {/* Machine Type */}
            <div className="flex items-start gap-3">
              <div className="bg-green-500/20 p-3 rounded-xl">
                <Tag size={24} className="text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">Category</p>
                <p className="text-white text-lg font-bold">{machine.type}</p>
              </div>
            </div>

            {/* Description */}
            {machine.description && (
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-3 rounded-xl">
                  <FileText size={24} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">Description</p>
                  <p className="text-gray-300 text-base leading-relaxed">{machine.description}</p>
                </div>
              </div>
            )}

            {/* Age Limit */}
            {machine.ageLimit && machine.ageLimit !== 'All Ages' && (
              <div className="flex items-start gap-3">
                <div className="bg-orange-500/20 p-3 rounded-xl">
                  <Lock size={24} className="text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">Age Requirement</p>
                  <p className="text-orange-400 text-lg font-bold">{machine.ageLimit}</p>
                </div>
              </div>
            )}

            {/* Created Date */}
            {machine.createdAt && (
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                  Added on {new Date(machine.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-5"
        >
          <p className="text-green-400 text-sm font-semibold mb-1">
            💪 Ready to Use
          </p>
          <p className="text-green-200 text-xs leading-relaxed">
            This machine is available for your workout. Ask gym staff if you need guidance on proper form and usage.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
