import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CaregiverDashboard from '@/components/caregiver/CaregiverDashboard';
import { supabase } from '@/integrations/supabase/client';
import type { Memory, Question } from '@/types';
import { Loader2 } from 'lucide-react';

export default function CaregiverPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && profile && profile.role !== 'caregiver') {
      navigate('/elder');
    }
  }, [user, profile, authLoading, navigate]);

  const fetchData = async () => {
    if (!user || !profile?.elder_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [memoriesRes, questionsRes] = await Promise.all([
        supabase
          .from('memories')
          .select('*')
          .eq('elder_id', profile.elder_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('questions')
          .select('*')
          .eq('elder_id', profile.elder_id)
          .order('created_at', { ascending: false }),
      ]);

      if (memoriesRes.data) {
        setMemories(memoriesRes.data as Memory[]);
      }
      if (questionsRes.data) {
        setQuestions(questionsRes.data as Question[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      fetchData();
    }
  }, [user, profile]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'caregiver') {
    return null;
  }

  if (!profile.elder_id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-display font-bold mb-4">No Elder Connected</h1>
          <p className="text-muted-foreground mb-6">
            You need to be connected to an elder's account to view their memories and questions.
            Please contact the elder to get connected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CaregiverDashboard
      memories={memories}
      questions={questions}
      onRefresh={fetchData}
    />
  );
}
