import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

// Configure Supabase client with localStorage persistence
// Supabase v2 uses the format: sb-<project-ref>-auth-token
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Don't override storage or storageKey - let Supabase use defaults
  },
});

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4a08cb90`;

console.log('Supabase configured:', { supabaseUrl, API_BASE });

// Helper to get auth headers
export const getAuthHeaders = async () => {
  try {
    console.log('🔑 Getting auth headers...');
    
    // Check ALL localStorage keys for debugging
    const allKeys = Object.keys(localStorage);
    console.log('📦 All localStorage keys:', allKeys);
    
    // Log the actual values of Supabase keys
    const supabaseKeys = allKeys.filter(key => key.includes('supabase') || key.includes('sb-'));
    console.log('🔐 Supabase-related keys:', supabaseKeys);
    
    supabaseKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log(`  ${key}:`, {
            hasAccessToken: !!parsed.access_token,
            hasRefreshToken: !!parsed.refresh_token,
            hasUser: !!parsed.user,
            expiresAt: parsed.expires_at,
            tokenPreview: parsed.access_token ? `${parsed.access_token.substring(0, 30)}...` : 'none'
          });
        } catch {
          console.log(`  ${key}:`, 'String value (length:', value.length, ')');
        }
      }
    });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    const token = session?.access_token;
    
    console.log('Session retrieval result:', { 
      hasSession: !!session, 
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'none',
      userId: session?.user?.id || 'none',
      userEmail: session?.user?.email || 'none',
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'none'
    });
    
    if (!token) {
      console.error('❌ CRITICAL: No session token available!');
      console.error('❌ User must login to access this resource');
      throw new Error('No active session. Please login to continue.');
    }
    
    // Double-check it's not the anon key
    if (token === publicAnonKey) {
      console.error('❌ CRITICAL: Token is the anon key, not a user session token!');
      throw new Error('Invalid session token. Please login again.');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    console.log('✅ Using session token for auth');
    console.log('✅ Token length:', token.length);
    return headers;
  } catch (error) {
    console.error('❌ Error getting auth headers:', error);
    // DO NOT fallback to anon key - throw the error so the UI can handle it
    throw error;
  }
};

// API methods
export const api = {
  async testConnection() {
    try {
      console.log('Testing connection to:', `${API_BASE}/health`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Don't send Authorization header for health check
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('Health check response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Health check error response:', errorText);
        throw new Error(`Health check failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Health check successful:', data);
      return data;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      if (error.name === 'AbortError') {
        throw new Error('Server connection timeout - please try again');
      }
      throw new Error(`Cannot connect to server: ${error.message}`);
    }
  },

  async signup(email: string, password: string, role: string, name?: string, dob?: string) {
    try {
      console.log('Signup API call to:', `${API_BASE}/signup`);
      console.log('Signup data:', { email, role, name: name || 'not provided' });
      
      const response = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, role, name, dob }),
      });

      console.log('Signup response status:', response.status);
      
      const responseText = await response.text();
      console.log('Signup response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid response from server: ${responseText}`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Signup failed with status ${response.status}`);
      }
      
      console.log('Signup successful:', data);
      return data;
    } catch (error: any) {
      console.error('Signup API error:', error);
      throw error;
    }
  },

  async getProfile() {
    try {
      const headers = await getAuthHeaders();
      console.log('Getting profile from:', `${API_BASE}/profile`);
      console.log('With headers:', headers);
      
      const response = await fetch(`${API_BASE}/profile`, { 
        method: 'GET',
        headers 
      });

      console.log('Profile response status:', response.status);
      
      const responseText = await response.text();
      console.log('Profile response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid response from server: ${responseText}`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch profile: ${response.status}`);
      }
      
      console.log('Profile fetched successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Get profile API error:', error);
      throw error;
    }
  },

  async updateProfile(name: string, dob: string) {
    try {
      const headers = await getAuthHeaders();
      console.log('Updating profile at:', `${API_BASE}/profile/update`);
      
      const response = await fetch(`${API_BASE}/profile/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, dob }),
      });

      console.log('Update profile response status:', response.status);
      
      const responseText = await response.text();
      console.log('Update profile response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid response from server: ${responseText}`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to update profile: ${response.status}`);
      }
      
      console.log('Profile updated successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Update profile API error:', error);
      throw error;
    }
  },

  async getMachines() {
    try {
      console.log('Getting machines...');
      const headers = await getAuthHeaders();
      console.log('Headers prepared for machines request');
      
      const response = await fetch(`${API_BASE}/machines`, { headers });
      console.log('Machines response status:', response.status);
      
      const data = await response.json();
      console.log('Machines response data:', data);
      
      if (!response.ok) {
        const errorMsg = data.error || 'Failed to fetch machines';
        console.error('Machines fetch failed:', errorMsg, 'Status:', response.status);
        throw new Error(errorMsg);
      }
      
      return data;
    } catch (error: any) {
      console.error('Get machines API error:', error);
      throw error;
    }
  },

  async addMachine(name: string, photo: string, type: string) {
    try {
      console.log('=== ADD MACHINE API CALL ===');
      console.log('Machine data:', { name, photo: photo || '(empty)', type });
      
      const headers = await getAuthHeaders();
      console.log('Auth headers prepared for add machine');
      
      const requestBody = { name, photo, type };
      console.log('Request body:', JSON.stringify(requestBody));
      
      console.log('Sending POST request to:', `${API_BASE}/machines`);
      const response = await fetch(`${API_BASE}/machines`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
      
      console.log('Add machine response status:', response.status);
      console.log('Add machine response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('Add machine response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Invalid server response: ${responseText}`);
      }
      
      if (!response.ok) {
        const errorMsg = data.error || data.message || `Failed to add machine (${response.status})`;
        console.error('❌ Add machine failed:', errorMsg);
        console.error('Full error data:', data);
        throw new Error(errorMsg);
      }
      
      console.log('✅ Machine added successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Add machine API error:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  async logAttendance() {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to log attendance');
      return data;
    } catch (error: any) {
      console.error('Log attendance API error:', error);
      throw error;
    }
  },

  async checkTodayAttendance() {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/attendance/today`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to check attendance');
      return data;
    } catch (error: any) {
      console.error('Check attendance API error:', error);
      throw error;
    }
  },

  async getAllAttendance() {
    try {
      console.log('Getting all attendance...');
      const headers = await getAuthHeaders();
      console.log('Headers prepared for attendance request');
      
      const response = await fetch(`${API_BASE}/attendance/all`, { headers });
      console.log('Attendance response status:', response.status);
      
      const data = await response.json();
      console.log('Attendance response data:', data);
      
      if (!response.ok) {
        const errorMsg = data.error || 'Failed to fetch attendance';
        console.error('Attendance fetch failed:', errorMsg, 'Status:', response.status);
        throw new Error(errorMsg);
      }
      
      return data;
    } catch (error: any) {
      console.error('Get all attendance API error:', error);
      throw error;
    }
  },

  async getAttendanceHistory() {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/attendance/history`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch attendance history');
      return data;
    } catch (error: any) {
      console.error('Get attendance history API error:', error);
      throw error;
    }
  },

  async searchWorkouts(query: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/workouts/search?q=${encodeURIComponent(query)}`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to search workouts');
      return data;
    } catch (error: any) {
      console.error('Search workouts API error:', error);
      throw error;
    }
  },

  async getWorkout(id: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/workouts/${id}`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch workout');
      return data;
    } catch (error: any) {
      console.error('Get workout API error:', error);
      throw error;
    }
  },
};