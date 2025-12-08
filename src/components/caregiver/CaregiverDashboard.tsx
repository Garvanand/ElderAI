import { useState, useMemo } from 'react';
import { 
  Brain, LogOut, Calendar, Tag, Filter, MessageCircle, 
  Clock, User, Heart, Pill, Star, HelpCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import type { Memory, Question } from '@/types';
import { format } from 'date-fns';

interface CaregiverDashboardProps {
  memories: Memory[];
  questions: Question[];
  onRefresh: () => void;
}

const memoryTypeIcons: Record<string, React.ReactNode> = {
  story: <Star className="w-5 h-5" />,
  person: <User className="w-5 h-5" />,
  event: <Calendar className="w-5 h-5" />,
  medication: <Pill className="w-5 h-5" />,
  routine: <Clock className="w-5 h-5" />,
  preference: <Heart className="w-5 h-5" />,
  other: <HelpCircle className="w-5 h-5" />,
};

const memoryTypeColors: Record<string, string> = {
  story: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  person: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  event: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  medication: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  routine: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  preference: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

export default function CaregiverDashboard({ memories, questions, onRefresh }: CaregiverDashboardProps) {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'memories' | 'questions'>('memories');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    memories.forEach(m => m.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [memories]);

  // Filter memories
  const filteredMemories = useMemo(() => {
    return memories.filter(m => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (tagFilter && !m.tags?.includes(tagFilter)) return false;
      if (searchQuery && !m.raw_text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [memories, typeFilter, tagFilter, searchQuery]);

  // Group memories by date
  const groupedMemories = useMemo(() => {
    const groups: Record<string, Memory[]> = {};
    filteredMemories.forEach(m => {
      const date = format(new Date(m.created_at), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  }, [filteredMemories]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Memory Friend</h1>
              <p className="text-sm text-muted-foreground">Caregiver Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{memories.length}</p>
                <p className="text-sm text-muted-foreground">Total Memories</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions Asked</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allTags.length}</p>
                <p className="text-sm text-muted-foreground">Unique Tags</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'memories' ? 'default' : 'outline'}
            onClick={() => setActiveTab('memories')}
          >
            <Brain className="w-4 h-4 mr-2" />
            Memories
          </Button>
          <Button
            variant={activeTab === 'questions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('questions')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Questions & Answers
          </Button>
        </div>

        {activeTab === 'memories' && (
          <>
            {/* Filters */}
            <Card className="p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="story">Stories</option>
                  <option value="person">People</option>
                  <option value="event">Events</option>
                  <option value="medication">Medications</option>
                  <option value="routine">Routines</option>
                  <option value="preference">Preferences</option>
                  <option value="other">Other</option>
                </select>

                {allTags.length > 0 && (
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border bg-background text-sm"
                  >
                    <option value="">All Tags</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                )}

                <Input
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </Card>

            {/* Timeline */}
            <div className="space-y-6">
              {Object.entries(groupedMemories)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, dayMemories]) => (
                  <div key={date}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <div className="space-y-3 pl-7 border-l-2 border-border">
                      {dayMemories.map(memory => (
                        <Card key={memory.id} variant="memory" className="ml-4 relative">
                          <div className="absolute -left-[1.65rem] top-4 w-3 h-3 rounded-full bg-primary" />
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${memoryTypeColors[memory.type]}`}>
                                {memoryTypeIcons[memory.type]}
                                {memory.type}
                              </span>
                              {memory.tags?.map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-full bg-muted text-xs">
                                  {tag}
                                </span>
                              ))}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {format(new Date(memory.created_at), 'h:mm a')}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground">{memory.raw_text}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              
              {filteredMemories.length === 0 && (
                <Card className="p-8 text-center">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">No memories found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters or check back later
                  </p>
                </Card>
              )}
            </div>
          </>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4">
            {questions.length > 0 ? (
              questions.map(q => (
                <Card key={q.id} variant="memory">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        {q.question_text}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(q.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {q.answer_text ? (
                      <div className="bg-secondary/50 rounded-lg p-4">
                        <p className="text-secondary-foreground">{q.answer_text}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">Awaiting answer...</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No questions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Questions asked by the elder will appear here
                </p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
