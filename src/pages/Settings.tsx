import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/providers/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiStyle, setAiStyle] = useState<'concise' | 'detailed'>('concise');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setAiStyle(data.ai_response_style as 'concise' | 'detailed');
          setLanguage(data.language);
        }
      }
    };
    
    loadSettings();
  }, [user]);

  const handleAiStyleChange = async (value: string) => {
    setAiStyle(value as 'concise' | 'detailed');
    
    if (user) {
      await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, ai_response_style: value });
      
      toast({
        title: 'Settings updated',
        description: 'AI response style preference saved',
      });
    }
  };

  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    
    if (user) {
      await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, language: value });
      
      toast({
        title: 'Settings updated',
        description: 'Language preference saved',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark theme
                </p>
              </div>
              <Switch
                id="theme"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>Select your preferred language</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Configure AI response preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="ai-style">Response Style</Label>
              <Select value={aiStyle} onValueChange={handleAiStyleChange}>
                <SelectTrigger id="ai-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose how detailed AI responses should be
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
