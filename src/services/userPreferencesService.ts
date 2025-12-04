import { supabase } from '@/lib/supabase/client';
import type { UserPreferences } from '@/types/feed';

export interface DBUserPreferences {
  id: string;
  interests: string[];
  learning_style: 'visual' | 'auditory' | 'theoretical';
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found
        return null;
      }
      throw error;
    }

    return {
      interests: data.interests,
      learningStyle: data.learning_style,
      onboarded: data.onboarded
    };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
};

export const saveUserPreferences = async (
  userId: string,
  preferences: UserPreferences
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        id: userId,
        interests: preferences.interests,
        learning_style: preferences.learningStyle,
        onboarded: preferences.onboarded,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
};

export const checkUserOnboarded = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('onboarded')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }

    return data?.onboarded || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};