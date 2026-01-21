import { User, TimeRecord, UserRole } from '../types';
import { supabase } from './supabase';

const SESSION_KEY = 'ponto_amd_session';

// Helper to map DB user to App User
const mapDbUserToUser = (dbUser: any): User => ({
  id: dbUser.id,
  username: dbUser.username,
  fullName: dbUser.full_name,
  role: dbUser.role as UserRole,
  password: '' // Keep empty in frontend
});

export const storageService = {
  // --- AUTH METHODS (CUSTOM) ---

  login: async (username: string, password: string): Promise<User> => {
    // 1. Check if user exists with matching password
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .eq('password', password) // In a real app, compare hashes!
      .single();

    if (error || !data) {
      throw new Error('Usuário ou senha incorretos');
    }

    const user = mapDbUserToUser(data);
    
    // 2. Persist session locally
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    
    return user;
  },

  register: async (username: string, password: string, fullName: string, role: UserRole = UserRole.EMPLOYEE): Promise<User> => {
    // 1. Check if username exists
    const { data: existing } = await supabase
      .from('app_users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      throw new Error('Este CPF/Usuário já está cadastrado');
    }

    // 2. Create user
    const { data, error } = await supabase
      .from('app_users')
      .insert({
        username,
        password,
        full_name: fullName,
        role
      })
      .select()
      .single();

    if (error) throw error;

    const user = mapDbUserToUser(data);
    
    // 3. Auto login
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    
    return user;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentSession: async (): Promise<User | null> => {
    const json = localStorage.getItem(SESSION_KEY);
    if (!json) return null;
    try {
      return JSON.parse(json) as User;
    } catch {
      return null;
    }
  },

  // --- DATA METHODS ---

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('full_name');
    
    if (error) throw error;
    return data.map(mapDbUserToUser);
  },
  
  updateUserRole: async (userId: string, role: UserRole): Promise<void> => {
    const { error } = await supabase
      .from('app_users')
      .update({ role })
      .eq('id', userId);
      
    if (error) throw error;
  },

  // Record Methods
  saveRecord: async (record: TimeRecord): Promise<void> => {
    const { error } = await supabase
      .from('time_records')
      .insert({
        id: record.id,
        user_id: record.userId,
        timestamp: record.timestamp,
        type: record.type,
        photo_url: record.photoUrl,
        latitude: record.latitude,
        longitude: record.longitude
      });
    
    if (error) {
      console.error('Error saving record:', error);
      throw error;
    }
  },

  updateRecord: async (record: TimeRecord): Promise<void> => {
    const { error } = await supabase
      .from('time_records')
      .update({
        timestamp: record.timestamp,
        type: record.type,
      })
      .eq('id', record.id);

    if (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  getUserRecords: async (userId: string): Promise<TimeRecord[]> => {
    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      timestamp: r.timestamp,
      type: r.type,
      photoUrl: r.photo_url,
      latitude: r.latitude,
      longitude: r.longitude
    }));
  },

  // Reporting
  getRecordsByRange: async (startDate: number, endDate: number): Promise<TimeRecord[]> => {
    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      timestamp: r.timestamp,
      type: r.type,
      photoUrl: r.photo_url,
      latitude: r.latitude,
      longitude: r.longitude
    }));
  }
};