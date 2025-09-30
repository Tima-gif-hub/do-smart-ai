import { supabase } from "@/integrations/supabase/client";
import { Task, User } from '@/types';

// Task CRUD operations
export const tasksApi = {
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      dueDate: task.due_date,
      priority: task.priority as 'low' | 'medium' | 'high',
      status: task.status as 'todo' | 'in-progress' | 'completed',
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      userId: task.user_id
    }));
  },

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.dueDate,
        priority: taskData.priority,
        status: taskData.status,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      dueDate: data.due_date,
      priority: data.priority as 'low' | 'medium' | 'high',
      status: data.status as 'todo' | 'in-progress' | 'completed',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id
    };
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      dueDate: data.due_date,
      priority: data.priority as 'low' | 'medium' | 'high',
      status: data.status as 'todo' | 'in-progress' | 'completed',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id
    };
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Authentication operations
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; session: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    if (!data.user || !data.session) throw new Error('Login failed');
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.email!
      },
      session: data.session
    };
  },

  async register(email: string, password: string, name: string): Promise<{ user: User; session: any }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('Registration failed');
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: name
      },
      session: data.session
    };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!
    };
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// AI Assistant operations
export const aiApi = {
  async askAssistant(message: string, tasks: Task[]): Promise<string> {
    // For now, keeping the mock logic until we implement real AI
    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('priority') || lowercaseMessage.includes('first') || lowercaseMessage.includes('important')) {
      const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
      if (highPriorityTasks.length > 0) {
        return `I recommend focusing on these high-priority tasks: ${highPriorityTasks.map(t => `\"${t.title}\"`).join(', ')}. Start with the ones due soonest!`;
      }
      return "You're doing great! Focus on your medium-priority tasks or take a well-deserved break.";
    }
    
    if (lowercaseMessage.includes('overdue') || lowercaseMessage.includes('late')) {
      const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < new Date();
      });
      if (overdueTasks.length > 0) {
        return `You have ${overdueTasks.length} overdue task(s): ${overdueTasks.map(t => `\"${t.title}\"`).join(', ')}. Consider prioritizing these!`;
      }
      return "Great news! You don't have any overdue tasks. Keep up the excellent work!";
    }
    
    if (lowercaseMessage.includes('progress') || lowercaseMessage.includes('status')) {
      const completedCount = tasks.filter(t => t.status === 'completed').length;
      const totalCount = tasks.length;
      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      return `You've completed ${completedCount} out of ${totalCount} tasks (${percentage}%). ${percentage >= 75 ? "Excellent progress!" : percentage >= 50 ? "Good momentum!" : "Keep going!"}`;
    }
    
    const responses = [
      "Based on your current tasks, I suggest tackling the high-priority items first. They'll give you the biggest impact!",
      "Consider breaking down larger tasks into smaller, manageable chunks. It makes progress feel more achievable.",
      "Don't forget to take breaks between tasks. Productivity isn't just about doing more—it's about sustainable focus.",
      "Try time-blocking your tasks. Assign specific time slots to each task to maintain focus and momentum.",
      "Review your completed tasks regularly. It's a great way to see your progress and stay motivated!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
};
