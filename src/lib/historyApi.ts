import { supabase } from '@/integrations/supabase/client';

export const historyApi = {
  async saveInteraction(query: string, response: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');

    // Generate a title from the first few words of the query
    const title = query.slice(0, 50) + (query.length > 50 ? '...' : '');

    const { data, error } = await supabase
      .from('ai_history')
      .insert({
        user_id: user.id,
        title,
        query,
        response,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
