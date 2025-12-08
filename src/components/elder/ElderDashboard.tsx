import { useState } from 'react';
import { Plus, MessageCircleQuestion, History, LogOut, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { extractMemoryMetadata, answerQuestion } from '@/lib/ai';
import type { Question } from '@/types';

interface ElderDashboardProps {
  recentQuestions: Question[];
  onRefresh: () => void;
}

export default function ElderDashboard({ recentQuestions, onRefresh }: ElderDashboardProps) {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<'home' | 'addMemory' | 'askQuestion'>('home');
  const [memoryText, setMemoryText] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMemory = async () => {
    if (!memoryText.trim() || !user) return;
    
    setLoading(true);
    try {
      // Extract metadata using AI
      const metadata = await extractMemoryMetadata(memoryText);
      
      // Save memory to database
      const { error } = await supabase
        .from('memories')
        .insert({
          elder_id: user.id,
          raw_text: memoryText,
          type: metadata.type as any,
          tags: metadata.tags,
          structured_json: metadata.structured,
        });

      if (error) throw error;

      toast({
        title: 'Memory saved!',
        description: 'Your memory has been recorded safely.',
      });
      
      setMemoryText('');
      setView('home');
      onRefresh();
    } catch (error) {
      console.error('Error saving memory:', error);
      toast({
        title: 'Could not save',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!questionText.trim() || !user) return;
    
    setLoading(true);
    setAnswer('');
    
    try {
      const response = await answerQuestion(questionText, user.id);
      setAnswer(response.answer);
      onRefresh();
    } catch (error) {
      console.error('Error getting answer:', error);
      toast({
        title: 'Could not get answer',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (view === 'addMemory') {
    return (
      <div className="min-h-screen bg-background p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="elderOutline"
            onClick={() => setView('home')}
            className="mb-6"
          >
            ← Go Back
          </Button>
          
          <Card variant="elder">
            <CardHeader>
              <CardTitle elder className="text-3xl flex items-center gap-3">
                <Plus className="w-8 h-8 text-primary" />
                Add a Memory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-xl text-muted-foreground">
                Share something you'd like to remember. It could be a story, a person's name, 
                an important event, or anything else.
              </p>
              
              <Textarea
                elder
                placeholder="Type your memory here..."
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                rows={6}
              />
              
              <Button
                variant="elderSuccess"
                size="elderLg"
                onClick={handleAddMemory}
                disabled={loading || !memoryText.trim()}
                className="w-full"
              >
                {loading ? 'Saving...' : 'Save Memory'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (view === 'askQuestion') {
    return (
      <div className="min-h-screen bg-background p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="elderOutline"
            onClick={() => {
              setView('home');
              setQuestionText('');
              setAnswer('');
            }}
            className="mb-6"
          >
            ← Go Back
          </Button>
          
          <Card variant="elder">
            <CardHeader>
              <CardTitle elder className="text-3xl flex items-center gap-3">
                <MessageCircleQuestion className="w-8 h-8 text-primary" />
                Ask a Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-xl text-muted-foreground">
                Ask me anything about your memories. I'll help you remember!
              </p>
              
              <Textarea
                elder
                placeholder="What would you like to know?"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={4}
              />
              
              <Button
                variant="elder"
                size="elderLg"
                onClick={handleAskQuestion}
                disabled={loading || !questionText.trim()}
                className="w-full"
              >
                {loading ? 'Thinking...' : 'Get Answer'}
              </Button>
              
              {answer && (
                <div className="mt-6 p-6 bg-secondary rounded-2xl animate-slide-up">
                  <h3 className="text-xl font-semibold mb-3 text-secondary-foreground">Answer:</h3>
                  <p className="text-xl leading-relaxed text-secondary-foreground">{answer}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-button">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Memory Friend</h1>
              <p className="text-lg text-muted-foreground">Hello, {profile?.full_name || 'Friend'}!</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground">
            <LogOut className="w-6 h-6" />
          </Button>
        </header>

        {/* Main Actions */}
        <div className="space-y-4 mb-8">
          <Button
            variant="elder"
            size="elderLg"
            onClick={() => setView('addMemory')}
            className="w-full justify-start gap-4 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <Plus className="w-8 h-8" />
            Add a Memory
          </Button>
          
          <Button
            variant="elderSecondary"
            size="elderLg"
            onClick={() => setView('askQuestion')}
            className="w-full justify-start gap-4 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <MessageCircleQuestion className="w-8 h-8" />
            Ask a Question
          </Button>
        </div>

        {/* Recent Questions */}
        {recentQuestions.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-2xl font-display font-semibold mb-4 flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              Recent Questions
            </h2>
            <div className="space-y-3">
              {recentQuestions.slice(0, 5).map((q) => (
                <Card key={q.id} variant="memory" className="p-4">
                  <p className="text-lg font-medium text-foreground mb-2">
                    Q: {q.question_text}
                  </p>
                  {q.answer_text && (
                    <p className="text-muted-foreground">
                      A: {q.answer_text.slice(0, 100)}...
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
