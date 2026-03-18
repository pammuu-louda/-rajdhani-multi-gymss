import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import { seedMachines } from "./seed.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Seed initial data
seedMachines();

// Helper to create Supabase admin client
const getSupabaseAdmin = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
};

// Helper to get Supabase client for user operations
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );
};

// Helper to verify user authentication
const verifyUser = async (authHeader: string | null) => {
  console.log('=== VERIFY USER ===');
  console.log('Auth header received:', authHeader ? `Bearer ${authHeader.substring(7, 37)}...` : 'null');
  console.log('Full auth header length:', authHeader?.length || 0);
  
  if (!authHeader) {
    console.log('❌ No auth header provided');
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.log('❌ Auth header does not start with "Bearer "');
    console.log('Auth header starts with:', authHeader.substring(0, 20));
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('❌ No token in auth header after "Bearer "');
    return null;
  }
  
  console.log('Token extracted (length):', token.length);
  console.log('Token preview:', `${token.substring(0, 30)}...${token.substring(token.length - 10)}`);
  
  // Check if it's the anon key (which shouldn't be used for protected routes)
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (token === anonKey) {
    console.log('⚠️ WARNING: Anon key detected, not a user token!');
    return null;
  }
  
  try {
    const supabase = getSupabaseAdmin();
    console.log('Calling supabase.auth.getUser()...');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.log('❌ Error verifying token:', error.message);
      console.log('Error details:', JSON.stringify(error));
      return null;
    }
    
    if (!user) {
      console.log('❌ No user found for token');
      return null;
    }
    
    console.log('✅ User verified successfully:', user.id, user.email);
    console.log('User metadata:', user.user_metadata);
    return user;
  } catch (error) {
    console.log('❌ Exception during token verification:', error);
    return null;
  }
};

// Health check endpoint
app.get("/make-server-4a08cb90/health", (c) => {
  return c.json({ status: "ok" });
});

// Debug endpoint to list all users (for testing only)
app.get("/make-server-4a08cb90/debug/users", async (c) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    
    // Return only safe info
    const users = data.users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.user_metadata?.role,
      created_at: u.created_at,
      confirmed_at: u.confirmed_at,
    }));
    
    return c.json({ users, count: users.length });
  } catch (error) {
    return c.json({ error: `Error listing users: ${error}` }, 500);
  }
});

// Sign up endpoint
app.post("/make-server-4a08cb90/signup", async (c) => {
  try {
    const { email, password, role, name, dob } = await c.req.json();
    
    console.log(`Signup request received for email: ${email}, role: ${role}`);
    
    if (!email || !password || !role) {
      console.log('Signup error: Missing required fields');
      return c.json({ error: "Email, password, and role are required" }, 400);
    }

    const supabase = getSupabaseAdmin();
    
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email === email);
    
    if (userExists) {
      console.log(`User already exists with email: ${email}`);
      return c.json({ error: "A user with this email address has already been registered" }, 400);
    }
    
    // Create user with admin privileges
    console.log(`Creating user with email: ${email}, password length: ${password.length}`);
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role, name, dob },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error creating user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    console.log(`User created successfully with ID: ${data.user.id}`);

    // Store user info in KV store
    const userData = {
      id: data.user.id,
      email,
      role,
      name: name || '',
      dob: dob || '',
      onboarded: role === 'owner', // Owners don't need onboarding
      createdAt: new Date().toISOString()
    };
    
    console.log(`Saving user data to KV store:`, userData);
    await kv.set(`user:${data.user.id}`, userData);
    
    // Verify the data was saved
    const savedData = await kv.get(`user:${data.user.id}`);
    console.log(`Verified saved data:`, savedData);

    return c.json({ 
      user: data.user, 
      profile: userData,
      message: "User created successfully" 
    });
  } catch (error) {
    console.log(`Signup error: ${error}`);
    console.error('Full signup error:', error);
    return c.json({ error: `Internal server error during signup: ${error.message || error}` }, 500);
  }
});

// Get current user profile
app.get("/make-server-4a08cb90/profile", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    console.log(`Profile fetch request with auth header: ${authHeader ? 'present' : 'missing'}`);
    
    const user = await verifyUser(authHeader);
    if (!user) {
      console.log('Profile fetch error: User not authenticated');
      return c.json({ error: "Unauthorized - Please log in again" }, 401);
    }

    console.log(`Fetching profile for user ID: ${user.id}`);
    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      console.log(`No user data found in KV store for user: ${user.id}`);
      // Create default user data if it doesn't exist
      const defaultUserData = {
        id: user.id,
        email: user.email || '',
        role: user.user_metadata?.role || 'member',
        name: user.user_metadata?.name || '',
        dob: user.user_metadata?.dob || '',
        onboarded: user.user_metadata?.role === 'owner',
        createdAt: new Date().toISOString()
      };
      
      console.log(`Creating default user data:`, defaultUserData);
      await kv.set(`user:${user.id}`, defaultUserData);
      
      return c.json({ user: defaultUserData });
    }
    
    console.log(`Profile fetched successfully for user: ${user.id}`);
    return c.json({ user: userData });
  } catch (error) {
    console.log(`Error fetching profile: ${error}`);
    console.error('Full profile fetch error:', error);
    return c.json({ error: `Internal server error fetching profile: ${error.message || error}` }, 500);
  }
});

// Update user profile (for onboarding)
app.post("/make-server-4a08cb90/profile/update", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      console.log('Profile update error: User not authenticated');
      return c.json({ error: "Unauthorized" }, 401);
    }

    console.log(`Updating profile for user: ${user.id}`);
    const { name, dob } = await c.req.json();
    
    if (!name || !dob) {
      console.log('Profile update error: Missing name or dob');
      return c.json({ error: "Name and date of birth are required" }, 400);
    }

    const userData = await kv.get(`user:${user.id}`);
    console.log(`Existing user data:`, userData);
    
    // Create updated user object with fallback values
    const updatedUser = {
      id: user.id,
      email: user.email || userData?.email || '',
      role: userData?.role || 'member',
      name,
      dob,
      onboarded: true,
      createdAt: userData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log(`Saving updated user data:`, updatedUser);
    await kv.set(`user:${user.id}`, updatedUser);
    
    console.log('Profile updated successfully');
    return c.json({ user: updatedUser });
  } catch (error) {
    console.log(`Error updating profile: ${error}`);
    console.error('Full error details:', error);
    return c.json({ error: `Internal server error updating profile: ${error.message || error}` }, 500);
  }
});

// Get all machines
app.get("/make-server-4a08cb90/machines", async (c) => {
  try {
    const machines = await kv.getByPrefix('machine:');
    return c.json({ machines: machines || [] });
  } catch (error) {
    console.log(`Error fetching machines: ${error}`);
    return c.json({ error: "Internal server error fetching machines" }, 500);
  }
});

// Add a new machine (Owner only)
app.post("/make-server-4a08cb90/machines", async (c) => {
  try {
    console.log('=== ADD MACHINE ENDPOINT ===');
    console.log('Request received at:', new Date().toISOString());
    
    const authHeader = c.req.header('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    const user = await verifyUser(authHeader);
    if (!user) {
      console.log('❌ No user - authentication failed');
      return c.json({ error: "Unauthorized" }, 401);
    }

    console.log('✅ User authenticated:', user.id, user.email);
    
    console.log('Fetching user data from KV store...');
    const userData = await kv.get(`user:${user.id}`);
    console.log('User data from KV:', userData);
    
    if (!userData) {
      console.log('❌ User data not found in KV store');
      return c.json({ error: "User profile not found" }, 404);
    }
    
    console.log('User role:', userData.role);
    
    if (userData.role !== 'owner') {
      console.log('❌ User is not an owner, rejecting request');
      return c.json({ error: "Only owners can add machines" }, 403);
    }

    console.log('✅ User is owner, proceeding to add machine');
    
    console.log('Parsing request body...');
    const body = await c.req.json();
    console.log('Request body:', body);
    
    const { name, photo, type } = body;
    console.log('Machine details:', { name, photo: photo || '(empty)', type });
    
    if (!name || !type) {
      console.log('❌ Missing required fields');
      return c.json({ error: "Machine name and type are required" }, 400);
    }
    
    const machineId = `machine_${Date.now()}`;
    console.log('Generated machine ID:', machineId);
    
    const machine = {
      id: machineId,
      name,
      photo: photo || '',
      type,
      createdAt: new Date().toISOString()
    };
    
    console.log('Saving machine to KV store:', machine);
    await kv.set(`machine:${machineId}`, machine);
    console.log('✅ Machine saved successfully');
    
    console.log('=== ADD MACHINE COMPLETE ===');
    return c.json({ machine });
  } catch (error) {
    console.log('=== ADD MACHINE ERROR ===');
    console.log(`Error adding machine: ${error}`);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return c.json({ error: `Internal server error adding machine: ${error.message}` }, 500);
  }
});

// Log attendance
app.post("/make-server-4a08cb90/attendance", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const today = new Date().toISOString().split('T')[0];
    const attendanceKey = `attendance:${today}:${user.id}`;

    const attendance = {
      date: today,
      userId: user.id,
      userName: userData?.name || user.email,
      timestamp: new Date().toISOString()
    };

    await kv.set(attendanceKey, attendance);
    return c.json({ attendance, message: "Attendance logged successfully" });
  } catch (error) {
    console.log(`Error logging attendance: ${error}`);
    return c.json({ error: "Internal server error logging attendance" }, 500);
  }
});

// Check if user has logged attendance today
app.get("/make-server-4a08cb90/attendance/today", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const today = new Date().toISOString().split('T')[0];
    const attendanceKey = `attendance:${today}:${user.id}`;
    const attendance = await kv.get(attendanceKey);

    return c.json({ hasAttendance: !!attendance, attendance });
  } catch (error) {
    console.log(`Error checking attendance: ${error}`);
    return c.json({ error: "Internal server error checking attendance" }, 500);
  }
});

// Get all attendance for today (Owner only)
app.get("/make-server-4a08cb90/attendance/all", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'owner') {
      return c.json({ error: "Only owners can view all attendance" }, 403);
    }

    const today = new Date().toISOString().split('T')[0];
    const allAttendance = await kv.getByPrefix(`attendance:${today}:`);
    
    return c.json({ attendance: allAttendance || [], date: today });
  } catch (error) {
    console.log(`Error fetching all attendance: ${error}`);
    return c.json({ error: "Internal server error fetching attendance" }, 500);
  }
});

// Get user's attendance history
app.get("/make-server-4a08cb90/attendance/history", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all attendance records and filter by user
    const allAttendance = await kv.getByPrefix('attendance:');
    const userAttendance = allAttendance?.filter((a: any) => a.userId === user.id) || [];
    
    return c.json({ attendance: userAttendance });
  } catch (error) {
    console.log(`Error fetching attendance history: ${error}`);
    return c.json({ error: "Internal server error fetching attendance history" }, 500);
  }
});

// Search workouts
app.get("/make-server-4a08cb90/workouts/search", async (c) => {
  try {
    const query = c.req.query('q')?.toLowerCase() || '';
    const machines = await kv.getByPrefix('machine:');
    
    // Sample workouts data with machine requirements
    const workouts = [
      {
        id: 'leg_day_1',
        name: 'Leg Day Blast',
        description: 'Comprehensive leg workout',
        machines: ['Leg Press', 'Leg Extension', 'Leg Curl'],
        duration: 45,
        difficulty: 'Intermediate',
        tips: ['Warm up for 5 minutes', 'Keep your back straight', 'Control the movement'],
        exercises: [
          { name: 'Leg Press', sets: 4, reps: 12, machine: 'Leg Press' },
          { name: 'Leg Extension', sets: 3, reps: 15, machine: 'Leg Extension' },
          { name: 'Leg Curl', sets: 3, reps: 15, machine: 'Leg Curl' }
        ]
      },
      {
        id: 'chest_day_1',
        name: 'Chest Builder',
        description: 'Build a strong chest',
        machines: ['Bench Press', 'Chest Press', 'Cable Crossover'],
        duration: 40,
        difficulty: 'Beginner',
        tips: ['Focus on form over weight', 'Breathe properly', 'Squeeze at the top'],
        exercises: [
          { name: 'Flat Bench Press', sets: 4, reps: 10, machine: 'Bench Press' },
          { name: 'Incline Chest Press', sets: 3, reps: 12, machine: 'Chest Press' },
          { name: 'Cable Flies', sets: 3, reps: 15, machine: 'Cable Crossover' }
        ]
      },
      {
        id: 'back_day_1',
        name: 'Back & Biceps',
        description: 'Complete back development',
        machines: ['Lat Pulldown', 'Seated Row', 'Cable Machine'],
        duration: 50,
        difficulty: 'Intermediate',
        tips: ['Pull with your elbows', 'Retract shoulder blades', 'Full range of motion'],
        exercises: [
          { name: 'Lat Pulldown', sets: 4, reps: 12, machine: 'Lat Pulldown' },
          { name: 'Seated Cable Row', sets: 4, reps: 12, machine: 'Seated Row' },
          { name: 'Bicep Curls', sets: 3, reps: 15, machine: 'Cable Machine' }
        ]
      },
      {
        id: 'shoulder_day_1',
        name: 'Shoulder Shaper',
        description: 'Build rounded shoulders',
        machines: ['Shoulder Press', 'Lateral Raise', 'Cable Machine'],
        duration: 35,
        difficulty: 'Beginner',
        tips: ['Don\'t lock out', 'Control the weight', 'Mind-muscle connection'],
        exercises: [
          { name: 'Overhead Press', sets: 4, reps: 10, machine: 'Shoulder Press' },
          { name: 'Lateral Raises', sets: 3, reps: 15, machine: 'Lateral Raise' },
          { name: 'Front Raises', sets: 3, reps: 15, machine: 'Cable Machine' }
        ]
      },
      {
        id: 'arms_day_1',
        name: 'Arm Annihilator',
        description: 'Biceps and triceps focus',
        machines: ['Cable Machine', 'Preacher Curl', 'Tricep Extension'],
        duration: 30,
        difficulty: 'Beginner',
        tips: ['Isolate the muscle', 'No swinging', 'Feel the burn'],
        exercises: [
          { name: 'Cable Curls', sets: 4, reps: 12, machine: 'Cable Machine' },
          { name: 'Preacher Curls', sets: 3, reps: 12, machine: 'Preacher Curl' },
          { name: 'Tricep Pushdown', sets: 4, reps: 15, machine: 'Tricep Extension' }
        ]
      },
      {
        id: 'full_body_1',
        name: 'Full Body Burner',
        description: 'Complete body workout',
        machines: ['Leg Press', 'Chest Press', 'Lat Pulldown', 'Shoulder Press'],
        duration: 60,
        difficulty: 'Advanced',
        tips: ['Stay hydrated', 'Rest between exercises', 'Push your limits safely'],
        exercises: [
          { name: 'Squats', sets: 4, reps: 10, machine: 'Leg Press' },
          { name: 'Bench Press', sets: 4, reps: 10, machine: 'Chest Press' },
          { name: 'Pulldowns', sets: 4, reps: 12, machine: 'Lat Pulldown' },
          { name: 'Overhead Press', sets: 3, reps: 10, machine: 'Shoulder Press' }
        ]
      }
    ];

    // Filter workouts by query
    let filteredWorkouts = workouts.filter(w => 
      w.name.toLowerCase().includes(query) ||
      w.description.toLowerCase().includes(query) ||
      w.machines.some(m => m.toLowerCase().includes(query))
    );

    // Check which machines are available
    const availableMachines = machines?.map((m: any) => m.name.toLowerCase()) || [];
    
    // Mark workouts as available or suggest alternatives
    filteredWorkouts = filteredWorkouts.map(workout => {
      const requiredMachines = workout.machines.map(m => m.toLowerCase());
      const hasAllMachines = requiredMachines.every(m => 
        availableMachines.some(am => am.includes(m) || m.includes(am))
      );
      
      return {
        ...workout,
        available: hasAllMachines,
        missingMachines: hasAllMachines ? [] : requiredMachines.filter(m => 
          !availableMachines.some(am => am.includes(m) || m.includes(am))
        )
      };
    });

    return c.json({ workouts: filteredWorkouts });
  } catch (error) {
    console.log(`Error searching workouts: ${error}`);
    return c.json({ error: "Internal server error searching workouts" }, 500);
  }
});

// Get workout by ID
app.get("/make-server-4a08cb90/workouts/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workoutId = c.req.param('id');
    const userData = await kv.get(`user:${user.id}`);
    
    // This would typically come from a database
    // For now, we'll return a sample workout based on ID
    const workout = {
      id: workoutId,
      name: 'Sample Workout',
      personalized: true,
      userName: userData?.name || 'User',
      userAge: userData?.dob ? new Date().getFullYear() - new Date(userData.dob).getFullYear() : null
    };

    return c.json({ workout });
  } catch (error) {
    console.log(`Error fetching workout: ${error}`);
    return c.json({ error: "Internal server error fetching workout" }, 500);
  }
});

Deno.serve(app.fetch);