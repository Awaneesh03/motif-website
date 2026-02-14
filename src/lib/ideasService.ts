// Service for managing ideas/startups
// Uses idea_analyses table which stores analyzed startup ideas

import { supabase } from './supabase';

export interface Idea {
  id: string;
  title: string;
  name?: string;
  stage: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  score?: number;
  idea_title?: string;
  idea_description?: string;
  description?: string;
  target_market?: string;
  problem?: string;
  solution?: string;
  industry?: string;
}

// Get ideas for the logged-in user from idea_analyses table
export const getUserIdeas = async (userId: string): Promise<Idea[]> => {
  try {
    // Get analyzed ideas for the specific user from idea_analyses table
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user ideas from idea_analyses:', error);
      // Return empty array instead of throwing - table might not exist yet
      return [];
    }

    // Transform data - map idea_analyses columns to Idea interface
    const ideas = (data || []).map((idea: any) => ({
      id: idea.id,
      title: idea.idea_title || 'Untitled',
      name: idea.idea_title || 'Untitled',
      stage: 'idea',
      status: 'draft',
      user_id: idea.user_id || userId,
      created_at: idea.created_at || new Date().toISOString(),
      updated_at: idea.created_at,
      score: idea.score,
      idea_title: idea.idea_title,
      idea_description: idea.idea_description,
      description: idea.idea_description,
      target_market: idea.target_market,
      problem: idea.idea_description,
      solution: idea.idea_description,
      industry: idea.target_market,
    }));
    return ideas;
  } catch (error) {
    console.error('Error fetching user ideas:', error);
    return [];
  }
};

// Get single idea by ID from idea_analyses table
export const getIdeaById = async (id: string): Promise<Idea | null> => {
  try {
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching idea:', error);
      return null;
    }
    return {
      id: data.id,
      title: data.idea_title || 'Untitled',
      name: data.idea_title || 'Untitled',
      stage: 'idea',
      status: 'draft',
      user_id: data.user_id,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.created_at,
      score: data.score,
      idea_title: data.idea_title,
      idea_description: data.idea_description,
      description: data.idea_description,
      target_market: data.target_market,
      problem: data.idea_description,
      solution: data.idea_description,
      industry: data.target_market,
    };
  } catch (error) {
    console.error('Error fetching idea:', error);
    return null;
  }
};

// Update idea status in idea_analyses table
// NOTE: idea_analyses does not have a 'status' column.
// This function fetches the idea and returns it with the requested status
// for UI compatibility. Actual status management should be handled by the backend.
export const updateIdeaStatus = async (
  id: string,
  status: string,
  _options?: { skipValidation?: boolean }
): Promise<Idea | null> => {
  try {
    const { data, error } = await supabase
      .from('idea_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.idea_title || 'Untitled',
      name: data.idea_title || 'Untitled',
      stage: 'idea',
      status: status,
      user_id: data.user_id,
      created_at: data.created_at || new Date().toISOString(),
      score: data.score,
      idea_title: data.idea_title,
      idea_description: data.idea_description,
    };
  } catch (error) {
    console.error('Error updating idea status:', error);
    throw error;
  }
};
