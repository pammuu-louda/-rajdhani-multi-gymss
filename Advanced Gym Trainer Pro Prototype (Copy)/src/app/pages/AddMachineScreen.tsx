import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Upload, Camera, FolderOpen, X, CheckCircle, Image as ImageIcon, Film, FileText, Tag, Type } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function AddMachineScreen() {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ageLimit, setAgeLimit] = useState('All Ages');
  const [customAgeLimit, setCustomAgeLimit] = useState('');
  const [showCustomAge, setShowCustomAge] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setUploadedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success(`${file.name} uploaded successfully!`);
    }
  };

  const handleCameraCapture = () => {
    // In a real app, this would open the device camera
    // For demo purposes, we'll show a message
    toast.info('Camera feature would open here in production app');
  };

  const removeFile = () => {
    setUploadedFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !type) {
      toast.error('Please fill in Machine Name and Type');
      return;
    }

    setLoading(true);

    try {
      // In a real app, you would upload the file to server/storage here
      // For demo, we'll just simulate success
      
      // Store machine in localStorage for demo
      const machines = JSON.parse(localStorage.getItem('gymMachines') || '[]');
      machines.push({
        id: Date.now().toString(),
        name,
        brand,
        description,
        price,
        type,
        photo: previewUrl,
        createdAt: new Date().toISOString(),
        ageLimit: ageLimit === 'Other' ? customAgeLimit : ageLimit
      });
      localStorage.setItem('gymMachines', JSON.stringify(machines));

      // Show success animation
      setShowSuccess(true);
      
      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to add machine:', error);
      toast.error('Failed to add machine');
      setLoading(false);
    }
  };

  const machineTypes = [
    'Cardio',
    'Strength',
    'Free Weights',
    'Cable Machine',
    'Leg Equipment',
    'Chest Equipment',
    'Back Equipment',
    'Shoulder Equipment',
    'Arm Equipment',
    'Core Equipment',
    'Other'
  ];

  const getFileIcon = () => {
    if (!uploadedFile) return <ImageIcon size={24} />;
    
    if (uploadedFile.type.startsWith('video/')) {
      return <Film size={24} />;
    } else if (uploadedFile.type === 'application/pdf') {
      return <FileText size={24} />;
    } else {
      return <ImageIcon size={24} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 pb-12 shadow-xl">
        <button
          onClick={() => navigate('/owner/dashboard')}
          className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={24} />
          <span className="font-semibold">Back to Dashboard</span>
        </button>

        <h1 className="text-4xl font-black mb-2 tracking-tight">Add New Machine</h1>
        <p className="text-white/90 font-medium">Expand your gym's equipment arsenal</p>
      </div>

      <div className="px-6 -mt-6">
        <div className="bg-gray-800/80 backdrop-blur-xl border-2 border-amber-500/30 rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Area */}
            <div>
              <label className="block text-lg font-black text-white mb-4">
                📸 Machine Photo or Video
              </label>
              
              {!uploadedFile ? (
                <div className="border-4 border-dashed border-amber-500/40 rounded-2xl p-8 bg-gray-900/50 hover:border-amber-500/60 transition-all">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="bg-amber-500/20 p-6 rounded-full mb-4">
                      <Upload size={48} className="text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Upload Machine Media
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                      Images, Videos, or PDF documents (Max 10MB)
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                      <label className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 px-6 rounded-xl font-bold cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2">
                        <FolderOpen size={20} />
                        Choose File
                        <input
                          type="file"
                          accept="image/*,video/*,.pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      
                      <button
                        type="button"
                        onClick={handleCameraCapture}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Camera size={20} />
                        Open Camera
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative border-2 border-amber-500/50 rounded-2xl overflow-hidden bg-gray-900"
                >
                  {/* Preview */}
                  {previewUrl && (
                    <div className="relative">
                      {uploadedFile.type.startsWith('image/') ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-64 object-cover"
                        />
                      ) : uploadedFile.type.startsWith('video/') ? (
                        <video
                          src={previewUrl}
                          controls
                          className="w-full h-64"
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center bg-gray-800">
                          <div className="text-center">
                            <FileText size={64} className="text-amber-500 mx-auto mb-4" />
                            <p className="text-white font-bold">{uploadedFile.name}</p>
                            <p className="text-gray-400 text-sm">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="p-4 bg-gray-800/90 backdrop-blur-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-500/20 p-2 rounded-lg">
                        {getFileIcon()}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{uploadedFile.name}</p>
                        <p className="text-gray-400 text-xs">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={removeFile}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Machine Name */}
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                Machine Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Leg Press 3000"
                  required
                  className="w-full bg-gray-900/80 border-2 border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
                />
              </div>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Life Fitness, Technogym"
                className="w-full bg-gray-900/80 border-2 border-gray-700 rounded-xl py-3 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
              />
            </div>

            {/* Machine Type */}
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                Machine Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  className="w-full bg-gray-900/80 border-2 border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all appearance-none"
                >
                  <option value="">Select category...</option>
                  {machineTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the machine and its features..."
                rows={3}
                className="w-full bg-gray-900/80 border-2 border-gray-700 rounded-xl py-3 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all resize-none"
              />
            </div>

            {/* Age Limit */}
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                Age Limit <span className="text-red-500">*</span>
              </label>
              <select
                value={ageLimit}
                onChange={(e) => {
                  setAgeLimit(e.target.value);
                  if (e.target.value === 'Other') {
                    setShowCustomAge(true);
                  } else {
                    setShowCustomAge(false);
                  }
                }}
                required
                className="w-full bg-gray-900/80 border-2 border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all appearance-none"
              >
                <option value="All Ages">All Ages</option>
                <option value="15-18">15-18 age</option>
                <option value="18+">18+</option>
                <option value="Other">Other (Custom)</option>
              </select>
              
              {showCustomAge && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <input
                    type="text"
                    value={customAgeLimit}
                    onChange={(e) => setCustomAgeLimit(e.target.value)}
                    placeholder="e.g., 21+, 25-35, 30+"
                    required
                    className="w-full bg-gray-900/80 border-2 border-orange-500 rounded-xl py-3 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    💡 Enter custom age limit (e.g., "21+", "25-30", "35+")
                  </p>
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-5 rounded-xl font-black text-lg hover:from-amber-600 hover:to-orange-700 transition-all active:scale-98 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wide"
            >
              <CheckCircle size={24} />
              {loading ? 'Saving Machine...' : 'Save Machine'}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4">
            <p className="text-sm text-amber-200 leading-relaxed">
              <strong className="text-amber-400">💡 Pro Tip:</strong> High-quality photos help members identify equipment easily. 
              Consider taking photos from multiple angles for the best results!
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-12 max-w-sm w-full text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="bg-white/20 p-6 rounded-full inline-block mb-6"
              >
                <CheckCircle size={64} className="text-white" strokeWidth={3} />
              </motion.div>
              
              <h2 className="text-3xl font-black text-white mb-4">
                Machine Added Successfully!
              </h2>
              <p className="text-white/90 text-lg">
                Redirecting to dashboard...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}