import { Dumbbell } from 'lucide-react';
import { motion } from 'motion/react';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        animate={{ 
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 p-6 rounded-full">
          <Dumbbell size={48} className="text-white" strokeWidth={2.5} />
        </div>
      </motion.div>
    </div>
  );
}
