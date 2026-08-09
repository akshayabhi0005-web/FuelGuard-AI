import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mock auth engine
const mockAuth = {
  signUp: async ({ email, password, options }) => {
    const users = JSON.parse(localStorage.getItem('supabase_mock_users') || '[]');
    if (users.some(u => u.email === email)) {
      return { data: { user: null }, error: { message: 'User already exists.' } };
    }
    const newUser = { 
      id: 'mock-uid-' + Math.random().toString(36).substr(2, 9), 
      email, 
      password, 
      user_metadata: options?.options?.data || {} 
    };
    users.push(newUser);
    localStorage.setItem('supabase_mock_users', JSON.stringify(users));
    return { data: { user: newUser, session: { access_token: 'mock-session-token' } }, error: null };
  },

  signInWithPassword: async ({ email, password }) => {
    const users = JSON.parse(localStorage.getItem('supabase_mock_users') || '[]');
    
    // Seed default mock accounts if not exists
    const defaultFuel = { 
      email: 'citizen@fuel.com', 
      password: 'password123', 
      user_metadata: {
        fullName: 'John Doe',
        phone: '9876543210',
        vehicleNumber: 'WP-CAD-8930',
        vehicleType: 'Car',
        district: 'Colombo',
        state: 'Western',
        citizenId: '19983423423V'
      }
    };
    const defaultLpg = { 
      email: 'citizen@lpg.com', 
      password: 'password123', 
      user_metadata: {
        fullName: 'Jane Smith',
        phone: '9876543211',
        address: '123 Main St, Garden City',
        pincode: '110001',
        district: 'New Delhi',
        state: 'Delhi',
        consumerNumber: 'LPG-892301-A',
        preferredDistributor: 'Super Gas Distributors'
      }
    };
    
    if (!users.some(u => u.email === defaultFuel.email)) users.push(defaultFuel);
    if (!users.some(u => u.email === defaultLpg.email)) users.push(defaultLpg);
    localStorage.setItem('supabase_mock_users', JSON.stringify(users));

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      return { data: { user, session: { access_token: 'mock-token' } }, error: null };
    }
    return { data: { user: null, session: null }, error: { message: 'Invalid email or password.' } };
  },

  signOut: async () => {
    return { error: null };
  },

  resetPasswordForEmail: async (email) => {
    return { data: {}, error: null };
  },

  getUser: async () => {
    return { data: { user: null }, error: null };
  }
};

let supabaseInstance;

// Use mock if credentials are not provided
const useMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY';

if (useMock) {
  supabaseInstance = {
    auth: mockAuth,
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          data: [],
          error: null
        }),
        data: [],
        error: null
      }),
      insert: async (data) => ({ data, error: null }),
      update: async (data) => ({ data, error: null })
    })
  };
} else {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
export default supabase;
