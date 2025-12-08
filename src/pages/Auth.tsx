import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Heart, Brain, Users } from 'lucide-react';
import type { UserRole } from '@/types';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('elder');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have been signed in successfully.',
          });
          navigate('/');
        }
      } else {
        if (!fullName.trim()) {
          toast({
            title: 'Name required',
            description: 'Please enter your full name.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, fullName, role);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to Memory Friend.',
          });
          navigate('/');
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-button">
              <Brain className="w-9 h-9 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground">Memory Friend</h1>
          <p className="text-muted-foreground text-lg mt-2">Your caring memory companion</p>
        </div>

        <Card variant="elder" className="animate-slide-up">
          <CardHeader className="text-center pb-4">
            <CardTitle elder className="text-2xl">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription elder>
              {isLogin ? 'Sign in to continue' : 'Join Memory Friend today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="text-lg font-medium">Your Name</label>
                    <Input
                      elder
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-lg font-medium">I am a...</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('elder')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          role === 'elder'
                            ? 'border-primary bg-primary/10 shadow-soft'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Heart className={`w-8 h-8 mx-auto mb-2 ${role === 'elder' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-lg font-medium ${role === 'elder' ? 'text-primary' : 'text-foreground'}`}>
                          Memory User
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('caregiver')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          role === 'caregiver'
                            ? 'border-primary bg-primary/10 shadow-soft'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Users className={`w-8 h-8 mx-auto mb-2 ${role === 'caregiver' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-lg font-medium ${role === 'caregiver' ? 'text-primary' : 'text-foreground'}`}>
                          Caregiver
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-lg font-medium">Email</label>
                <Input
                  elder
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-lg font-medium">Password</label>
                <Input
                  elder
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                variant="elder"
                size="elderLg"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-lg text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
