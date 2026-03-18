import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Heart, Share2, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const DEFAULT_QUOTES = [
  "The body achieves what the mind believes.",
  "Every drop of sweat is a step toward a stronger you.",
  "Comfort zones don't build muscle.",
  "Rise. Grind. Repeat.",
  "Failure fuels growth.",
  "Strong today, stronger tomorrow.",
  "The only way to define your limits is by going beyond them.",
  "Do something today that your future self will thank you for.",
  "Work hard in silence, let success be the noise.",
  "Pain is temporary, pride is forever.",
  "Your only limit is you.",
  "Sweat is just fat crying.",
  "Train insane or remain the same.",
  "Discipline is the bridge between goals and accomplishment.",
  "The hard days are the ones that make you stronger.",
  "Be stronger than your excuses.",
  "Progress, not perfection.",
  "Lift heavy, live happy.",
  "Champions are made when no one is watching.",
  "You don't get the ass you want by sitting on it.",
  "Embrace the pain, enjoy the gain.",
  "Your fitness journey starts with a single rep.",
  "Make yourself proud.",
  "The struggle you're in today is developing the strength you need tomorrow.",
  "Don't wish for it, work for it.",
  "Strive for progress, not perfection.",
  "Believe in yourself and all that you are.",
  "Push yourself because no one else is going to do it for you.",
];

const BACKGROUND_GRADIENTS = [
  'from-purple-600 to-pink-600',
  'from-blue-600 to-cyan-600',
  'from-green-600 to-emerald-600',
  'from-red-600 to-orange-600',
  'from-amber-600 to-yellow-600',
  'from-indigo-600 to-purple-600',
  'from-teal-600 to-green-600',
  'from-rose-600 to-pink-600',
];

export default function QuotesScreen() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<string[]>([]);
  const [likedQuotes, setLikedQuotes] = useState<Set<number>>(new Set());
  const [featuredQuote, setFeaturedQuote] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuote, setNewQuote] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Check if user is owner
    const isDemoOwner = localStorage.getItem('demoOwner') === 'true';
    setIsOwner(isDemoOwner);
    
    loadQuotes();
  }, []);

  const loadQuotes = () => {
    // Load custom quotes from localStorage
    const customQuotes = JSON.parse(localStorage.getItem('customQuotes') || '[]');
    const allQuotes = [...DEFAULT_QUOTES, ...customQuotes];
    setQuotes(allQuotes);

    // Load liked quotes
    const liked = JSON.parse(localStorage.getItem('likedQuotes') || '[]');
    setLikedQuotes(new Set(liked));

    // Set daily featured quote (changes daily)
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('featuredQuoteDate');
    const savedQuote = localStorage.getItem('featuredQuote');

    if (savedDate === today && savedQuote) {
      setFeaturedQuote(savedQuote);
    } else {
      const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];
      setFeaturedQuote(randomQuote);
      localStorage.setItem('featuredQuote', randomQuote);
      localStorage.setItem('featuredQuoteDate', today);
    }
  };

  const toggleLike = (index: number) => {
    const newLiked = new Set(likedQuotes);
    if (newLiked.has(index)) {
      newLiked.delete(index);
      toast.success('Removed from favorites');
    } else {
      newLiked.add(index);
      toast.success('Added to favorites ❤️');
    }
    setLikedQuotes(newLiked);
    localStorage.setItem('likedQuotes', JSON.stringify([...newLiked]));
  };

  const shareQuote = async (quote: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: `💪 "${quote}" - Gym Trainer Pro`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(quote);
      toast.success('Quote copied to clipboard!');
    }
  };

  const addCustomQuote = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newQuote.trim()) {
      toast.error('Please enter a quote');
      return;
    }

    const customQuotes = JSON.parse(localStorage.getItem('customQuotes') || '[]');
    customQuotes.push(newQuote.trim());
    localStorage.setItem('customQuotes', JSON.stringify(customQuotes));

    toast.success('Quote added successfully! 🎉');
    setNewQuote('');
    setShowAddModal(false);
    loadQuotes();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 pb-12 shadow-xl">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={24} />
          <span className="font-semibold">Back</span>
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={32} className="text-yellow-300" />
          <h1 className="text-4xl font-black tracking-tight">Motivation</h1>
        </div>
        <p className="text-white/90 font-medium">Fuel your fitness journey with powerful quotes</p>
      </div>

      <div className="px-6 -mt-6">
        {/* Featured Daily Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl p-8 shadow-2xl mb-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-white" />
              <span className="text-white/90 font-bold text-sm uppercase tracking-wide">
                Quote of the Day
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-white mb-6 leading-tight">
              "{featuredQuote}"
            </h2>
            
            <div className="flex gap-3">
              <button
                onClick={() => shareQuote(featuredQuote)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2"
              >
                <Share2 size={18} />
                Share
              </button>
            </div>
          </div>
        </motion.div>

        {/* Add Quote Button */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-white">All Quotes ({quotes.length})</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            Add Quote
          </button>
        </div>

        {/* Quotes Grid */}
        <div className="space-y-4">
          {quotes.map((quote, index) => (
            isOwner ? (
              // Owner view: Fancy cards with gradients and interactions
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-gradient-to-br ${BACKGROUND_GRADIENTS[index % BACKGROUND_GRADIENTS.length]} rounded-2xl p-6 shadow-lg relative overflow-hidden group`}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                
                <div className="relative z-10">
                  <p className="text-white text-lg font-bold mb-4 leading-relaxed">
                    "{quote}"
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLike(index)}
                      className={`${
                        likedQuotes.has(index)
                          ? 'bg-white text-red-500'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      } backdrop-blur-sm px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 flex items-center gap-2`}
                    >
                      <Heart
                        size={18}
                        fill={likedQuotes.has(index) ? 'currentColor' : 'none'}
                      />
                      {likedQuotes.has(index) ? 'Liked' : 'Like'}
                    </button>
                    
                    <button
                      onClick={() => shareQuote(quote)}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Share2 size={18} />
                      Share
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Member view: Simple, clean text cards
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-gray-800/60 border border-gray-700 rounded-xl p-5"
              >
                <p className="text-gray-200 text-base leading-relaxed">
                  "{quote}"
                </p>
              </motion.div>
            )
          ))}
        </div>
      </div>

      {/* Add Quote Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setShowAddModal(false)}
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
                  <Plus size={32} className="text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-center text-white mb-2">
                Add Your Quote
              </h2>
              <p className="text-gray-400 text-center mb-6 text-sm">
                Share your own motivational message
              </p>

              <form onSubmit={addCustomQuote} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Your Motivational Quote
                  </label>
                  <textarea
                    value={newQuote}
                    onChange={(e) => setNewQuote(e.target.value)}
                    placeholder="Enter your inspirational quote..."
                    rows={4}
                    required
                    className="w-full bg-gray-900/80 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
                  >
                    Add Quote
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