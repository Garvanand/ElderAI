import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CaregiverDashboard from '@/components/caregiver/CaregiverDashboard';
import { supabase } from '@/integrations/supabase/client';
import type { Memory, Question } from '@/types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CaregiverPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [elderId, setElderId] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && profile && profile.role !== 'caregiver') {
      navigate('/elder');
    }
  }, [user, profile, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find elders linked to this caregiver via join table
      const { data: links, error: linksError } = await supabase
        .from('caregiver_elder_links')
        .select('*')
        .eq('caregiver_user_id', user.id);

      if (linksError) {
        console.error('Error fetching caregiver links:', linksError);
        setError('Could not load linked elders. Please try again.');
        setLoading(false);
        return;
      }

      if (!links || links.length === 0) {
        setElderId(null);
        setMemories([]);
        setQuestions([]);
        setLoading(false);
        return;
      }

      const currentElderId = links[0].elder_user_id as string;
      setElderId(currentElderId);

      const [memoriesRes, questionsRes] = await Promise.all([
        supabase
          .from('memories')
          .select('*')
          .eq('elder_id', currentElderId)
          .order('created_at', { ascending: false }),
        supabase
          .from('questions')
          .select('*')
          .eq('elder_id', currentElderId)
          .order('created_at', { ascending: false }),
      ]);

      if (memoriesRes.data) {
        setMemories(memoriesRes.data as Memory[]);
      }
      if (questionsRes.data) {
        setQuestions(questionsRes.data as Question[]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Something went wrong while loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkElder = async () => {
    if (!user || !linkEmail.trim()) {
      return;
    }
    setLinking(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('link_caregiver_to_elder_by_email', {
        caregiver_uid: user.id,
        elder_email: linkEmail.trim(),
      } as any);

      if (rpcError) {
        console.error('Error linking elder:', rpcError);
        setError(rpcError.message || 'Failed to link elder. Please check the email and try again.');
        setLinking(false);
        return;
      }

      setLinkEmail('');
      await fetchData();
    } catch (err) {
      console.error('Error linking elder:', err);
      setError('Failed to link elder. Please try again.');
    } finally {
      setLinking(false);
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

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <section className="border rounded-lg p-6">
          <h1 className="text-2xl font-display font-bold mb-2">Caregiver Dashboard</h1>
          <p className="text-muted-foreground mb-4">
            Link to an elder to view their memories and questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Input
              type="email"
              placeholder="elder@example.com"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              className="sm:max-w-xs"
            />
            <Button onClick={handleLinkElder} disabled={linking} className="w-full sm:w-auto">
              {linking ? 'Linking…' : 'Link Elder'}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          {!elderId && !loading && !error && (
            <p className="mt-3 text-sm text-muted-foreground">
              No elder linked yet. Once linked, you&apos;ll see their activity below.
            </p>
          )}
        </section>

        {elderId && (
          <CaregiverDashboard
            memories={memories}
            questions={questions}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
}
