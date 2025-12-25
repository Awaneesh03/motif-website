// Service for managing ideas/startups

import { supabase } from './supabase';

export interface Idea {
  id: string;
  title: string;
  name?: string;
  stage: string;
  status: string;
  created_by: string;
  created_at: string;
}

// Get ideas for the logged-in user that have pitches (startups)
export const getUserIdeas = async (userId: string): Promise<Idea[]> => {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        id,
        title,
        name,
        stage,
        status,
        created_by,
        created_at,
        pitches!inner(id)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter out the pitches data from response (we only need it for the join)
    const ideas = (data || []).map(({ pitches, ...idea }: any) => idea);
    return ideas;
  } catch (error) {
    console.error('Error fetching user ideas:', error);
    return [];
  }
};

// Get single idea by ID
export const getIdeaById = async (id: string): Promise<Idea | null> => {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching idea:', error);
    return null;
  }
};
