import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ElderDashboard from '@/components/elder/ElderDashboard';
import CaregiverDashboard from '@/components/caregiver/CaregiverDashboard';
import { supabase } from '@/integrations/supabase/client';
import type { Memory, Question } from '@/types';
import { Loader2 } from 'lucide-react';

export default function ElderPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get the elder ID (self if elder, elder_id from profile if caregiver)
      const elderId = profile?.role === 'caregiver' && profile?.elder_id 
        ? profile.elder_id 
        : user.id;

      const [memoriesRes, questionsRes] = await Promise.all([
        supabase
          .from('memories')
          .select('*')
          .eq('elder_id', elderId)
          .order('created_at', { ascending: false }),
        supabase
          .from('questions')
          .select('*')
          .eq('elder_id', elderId)
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

  if (!user || !profile) {
    return null;
  }

  // Render appropriate dashboard based on user role
  if (profile.role === 'caregiver') {
    return (
      <CaregiverDashboard
        memories={memories}
        questions={questions}
        onRefresh={fetchData}
      />
    );
  }

  return (
    <ElderDashboard
      recentQuestions={questions}
      onRefresh={fetchData}
    />
  );
}
