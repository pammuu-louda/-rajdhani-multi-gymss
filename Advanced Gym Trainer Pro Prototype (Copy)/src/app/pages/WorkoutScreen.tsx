import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../utils/supabase';
import { ArrowLeft, Clock, Play, Pause, RotateCcw, CheckCircle, Lightbulb, Target } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function WorkoutScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [workout, setWorkout] = useState<any>(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadWorkout();
  }, [id]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const loadWorkout = async () => {
    try {
      // Check if member is logged in via localStorage
      const memberName = localStorage.getItem('memberName');
      const memberDOB = localStorage.getItem('memberDOB');

      if (memberName && memberDOB) {
        // Member authentication via localStorage
        setUser({
          name: memberName,
          dob: memberDOB,
          role: 'member'
        });
      }

      // Get sample workout data (in real app, this would come from server)
      const workoutData = getSampleWorkout(id!);
      setWorkout(workoutData);
    } catch (error) {
      console.error('Failed to load workout:', error);
      toast.error('Failed to load workout');
    }
  };

  const getSampleWorkout = (workoutId: string) => {
    const workouts: any = {
      'leg_day_1': {
        id: 'leg_day_1',
        name: 'Leg Day Blast',
        description: 'Comprehensive leg workout',
        duration: 45,
        difficulty: 'Intermediate',
        tips: [
          'Warm up for 5-10 minutes with light cardio',
          'Keep your back straight throughout',
          'Control the movement - no jerking',
          'Focus on the muscle you\'re working',
          'Stay hydrated between sets'
        ],
        exercises: [
          { name: 'Leg Press', sets: 4, reps: 12, machine: 'Leg Press', restTime: 90, notes: 'Place feet shoulder-width apart' },
          { name: 'Leg Extension', sets: 3, reps: 15, machine: 'Leg Extension', restTime: 60, notes: 'Squeeze at the top' },
          { name: 'Leg Curl', sets: 3, reps: 15, machine: 'Leg Curl', restTime: 60, notes: 'Control the negative' },
          { name: 'Calf Raises', sets: 4, reps: 20, machine: 'Leg Press', restTime: 45, notes: 'Full range of motion' }
        ]
      },
      'chest_day_1': {
        id: 'chest_day_1',
        name: 'Chest Builder',
        description: 'Build a strong chest',
        duration: 40,
        difficulty: 'Beginner',
        tips: [
          'Focus on form over weight',
          'Breathe properly - exhale on push',
          'Squeeze at the top of each rep',
          'Keep shoulders back and down',
          'Warm up chest and shoulders first'
        ],
        exercises: [
          { name: 'Flat Bench Press', sets: 4, reps: 10, machine: 'Bench Press', restTime: 90, notes: 'Bar touches mid-chest' },
          { name: 'Incline Chest Press', sets: 3, reps: 12, machine: 'Chest Press', restTime: 75, notes: 'Upper chest focus' },
          { name: 'Cable Flies', sets: 3, reps: 15, machine: 'Cable Crossover', restTime: 60, notes: 'Feel the stretch' }
        ]
      }
    };

    return workouts[workoutId] || workouts['leg_day_1'];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExerciseComplete = () => {
    setCompletedExercises(new Set([...completedExercises, currentExercise]));
    toast.success('Exercise completed! 💪');
    
    if (currentExercise < workout.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setTimerSeconds(0);
      setIsTimerRunning(false);
    } else {
      toast.success('Workout completed! Great job!', {
        duration: 5000,
      });
    }
  };

  const getPersonalizedTip = () => {
    if (!user?.dob) return null;
    
    const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
    
    if (age < 25) {
      return 'At your age, focus on building good form and consistency!';
    } else if (age < 40) {
      return 'Perfect age for strength building - push your limits safely!';
    } else if (age < 55) {
      return 'Focus on mobility and proper warm-up to prevent injury.';
    } else {
      return 'Take your time and listen to your body - consistency is key!';
    }
  };

  if (!workout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const exercise = workout.exercises[currentExercise];
  const progress = ((completedExercises.size / workout.exercises.length) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 pb-8">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={24} />
          <span className="font-semibold">Back</span>
        </button>

        <h1 className="text-3xl font-black mb-2">{workout.name}</h1>
        <p className="text-white/80 mb-4">{workout.description}</p>
        
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">⏱️ {workout.duration} min</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">🏋️ {workout.exercises.length} exercises</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{workout.difficulty}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 -mt-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">Progress</span>
            <span className="text-sm font-bold text-green-500">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completedExercises.size} of {workout.exercises.length} exercises completed
          </p>
        </div>
      </div>

      {/* Personalized Greeting */}
      {user?.name && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-4"
        >
          <p className="text-foreground font-semibold">
            💪 Let's go, {user.name}!
          </p>
          {getPersonalizedTip() && (
            <p className="text-sm text-muted-foreground mt-1">
              {getPersonalizedTip()}
            </p>
          )}
        </motion.div>
      )}

      {/* Current Exercise */}
      <div className="px-6 mt-6">
        <motion.div
          key={currentExercise}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">{exercise.name}</h2>
              <p className="text-muted-foreground">Exercise {currentExercise + 1} of {workout.exercises.length}</p>
            </div>
            {completedExercises.has(currentExercise) && (
              <CheckCircle size={32} className="text-green-500" />
            )}
          </div>

          {/* Timer */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 mb-4 text-center">
            <Clock size={40} className="text-green-500 mx-auto mb-2" />
            <div className="text-5xl font-black text-foreground mb-2">
              {formatTime(timerSeconds)}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="bg-green-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
                {isTimerRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => setTimerSeconds(0)}
                className="bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          {/* Exercise Details */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{exercise.sets}</p>
              <p className="text-xs text-muted-foreground">Sets</p>
            </div>
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{exercise.reps}</p>
              <p className="text-xs text-muted-foreground">Reps</p>
            </div>
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{exercise.restTime}s</p>
              <p className="text-xs text-muted-foreground">Rest</p>
            </div>
          </div>

          {/* Notes */}
          {exercise.notes && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <Target size={18} className="text-amber-500 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-500 mb-1">Pro Tip</p>
                  <p className="text-sm text-foreground">{exercise.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Complete Button */}
          <button
            onClick={handleExerciseComplete}
            disabled={completedExercises.has(currentExercise)}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            {completedExercises.has(currentExercise) ? 'Completed' : 'Mark as Complete'}
          </button>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setCurrentExercise(Math.max(0, currentExercise - 1))}
            disabled={currentExercise === 0}
            className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentExercise(Math.min(workout.exercises.length - 1, currentExercise + 1))}
            disabled={currentExercise === workout.exercises.length - 1}
            className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        {/* Workout Tips */}
        <div className="mt-6 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={24} className="text-amber-500" />
            <h3 className="text-lg font-bold text-foreground">Workout Tips</h3>
          </div>
          <ul className="space-y-2">
            {workout.tips.map((tip: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-green-500 mt-0.5">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}