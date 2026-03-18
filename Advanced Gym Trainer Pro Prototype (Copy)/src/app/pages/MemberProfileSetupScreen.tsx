import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Camera, FolderOpen, User, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function MemberProfileSetupScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [facePhoto, setFacePhoto] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setUploading(true);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFacePhoto(reader.result as string);
        setUploading(false);
        toast.success('Photo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // Trigger the file input which will open camera on mobile devices
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSkip = () => {
    navigate('/home');
  };

  const handleSave = () => {
    if (!facePhoto) {
      toast.error('Please upload your photo first');
      return;
    }

    try {
      // Store face photo in localStorage
      localStorage.setItem('memberFacePhoto', facePhoto);
      
      // Update member record with photo
      const members = JSON.parse(localStorage.getItem('gymMembers') || '[]');
      const memberName = localStorage.getItem('memberName');
      const memberDOB = localStorage.getItem('memberDOB');
      
      const updatedMembers = members.map((m: any) => {
        if (m.name === memberName && m.dob === memberDOB) {
          return { ...m, facePhoto: facePhoto };
        }
        return m;
      });
      
      localStorage.setItem('gymMembers', JSON.stringify(updatedMembers));
      
      toast.success('Profile setup complete! 🎉');
      
      setTimeout(() => {
        navigate('/home');
      }, 500);
    } catch (error) {
      console.error('Failed to save photo:', error);
      toast.error('Failed to save your photo. Please try again.');
    }
  };

  const memberName = localStorage.getItem('memberName') || 'Member';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleSkip}
          className="mb-6 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
          Skip for now
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
              <User size={40} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-center text-white mb-2">
            Setup Your Profile
          </h1>
          <p className="text-white/80 text-center mb-8">
            Hi {memberName}! Add your photo for attendance tracking
          </p>

          {/* Photo Upload Area */}
          <div className="mb-6">
            {facePhoto ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <img
                  src={facePhoto}
                  alt="Profile"
                  className="w-full h-64 object-cover rounded-2xl border-4 border-white/20"
                />
                <button
                  onClick={() => setFacePhoto('')}
                  className="absolute top-3 right-3 bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Change Photo
                </button>
              </motion.div>
            ) : (
              <div className="border-4 border-dashed border-white/30 rounded-2xl p-8 bg-white/5 text-center">
                <div className="bg-white/10 p-6 rounded-full inline-block mb-4">
                  <Camera size={48} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Upload Your Photo
                </h3>
                <p className="text-white/60 text-sm mb-6">
                  Your photo will be shown to the owner when you mark attendance
                </p>

                <div className="space-y-3">
                  <label className="block bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-bold cursor-pointer transition-all active:scale-95">
                    <div className="flex items-center justify-center gap-2">
                      <FolderOpen size={20} />
                      Choose from Gallery
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleCameraCapture}
                    className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Camera size={20} />
                    Take Photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            {facePhoto && (
              <button
                onClick={handleSave}
                disabled={uploading}
                className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Complete Setup
              </button>
            )}

            <button
              onClick={handleSkip}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all"
            >
              Skip for Now
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
            <p className="text-xs text-white/70 text-center leading-relaxed">
              📸 Your photo helps gym staff recognize you and provides visual attendance tracking for the owner.
              <br />
              You can update this anytime from your profile.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
