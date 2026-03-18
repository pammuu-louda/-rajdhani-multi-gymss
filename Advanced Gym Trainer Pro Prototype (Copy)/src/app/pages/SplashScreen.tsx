import { useState } from 'react';
import { useNavigate } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { Dumbbell, QrCode, X } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { motion } from 'motion/react';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const appUrl = window.location.origin;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1741156229623-da94e6d7977d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjB3b3Jrb3V0JTIwZml0bmVzcyUyMG1vdGl2YXRpb258ZW58MXx8fHwxNzcxNjc1NzM3fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Gym background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center justify-between min-h-screen p-6 text-white"
      >
        {/* Logo & Title */}
        <motion.div 
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          <div className="bg-green-500 p-6 rounded-full mb-6 shadow-2xl">
            <Dumbbell size={64} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-6xl font-black mb-4 tracking-tight">
            Gym Trainer <span className="text-green-500">Pro</span>
          </h1>
          <p className="text-xl text-gray-300 mb-2 font-medium">
            Your Personal Training Companion
          </p>
          <p className="text-sm text-gray-400 italic max-w-xs">
            "The only bad workout is the one that didn't happen"
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div 
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md space-y-4"
        >
          {/* QR Code Button */}
          <button
            onClick={() => setShowQR(true)}
            className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/20 transition-all active:scale-95"
          >
            <QrCode size={24} />
            Generate Share Code
          </button>

          {/* Member Entry - NEW */}
          <button
            onClick={() => navigate('/member/entry')}
            className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-600 transition-all active:scale-95 shadow-lg"
          >
            Member Entry
          </button>

          {/* Owner Login */}
          <button
            onClick={() => navigate('/owner/access')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all active:scale-95 shadow-lg"
          >
            Owner Login
          </button>
        </motion.div>
      </motion.div>

      {/* QR Code Modal */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          onClick={() => setShowQR(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full relative"
          >
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">
              Share App Access
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Scan this QR code to download and access Gym Trainer Pro
            </p>

            <div className="bg-white p-6 rounded-2xl shadow-inner flex items-center justify-center">
              <QRCodeSVG 
                value={appUrl}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              {appUrl}
            </p>

            <button
              onClick={() => {
                navigator.clipboard.writeText(appUrl);
                alert('Link copied to clipboard!');
              }}
              className="w-full mt-4 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
            >
              Copy Link
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}