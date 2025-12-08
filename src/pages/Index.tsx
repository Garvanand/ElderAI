import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Heart, Users, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect to appropriate dashboard
      if (profile.role === 'caregiver') {
        navigate('/caregiver');
      } else {
        navigate('/elder');
      }
    }
  }, [user, profile, loading, navigate]);

  const features = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Easy to Use',
      description: 'Large buttons and simple interface designed for comfort and ease.',
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered',
      description: 'Smart assistance helps recall memories and answer questions naturally.',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Caregiver Support',
      description: 'Family and caregivers can view memories and monitor wellbeing.',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Safe & Private',
      description: 'Your memories are securely stored and only shared with trusted people.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-button">
              <Brain className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">Memory Friend</span>
          </div>
          <Link to="/auth">
            <Button variant="caregiver">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
            Your Caring<br />
            <span className="text-primary">Memory Companion</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            A gentle, easy-to-use app that helps you record memories, 
            ask questions, and stay connected with loved ones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button variant="elder" size="elderLg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="elderOutline" size="elderLg" className="w-full sm:w-auto">
                I'm a Caregiver
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              variant="elder"
              className="text-center animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-3xl font-display font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Record Memories</h3>
              <p className="text-muted-foreground">
                Share stories, people's names, important events - anything you want to remember.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Ask Questions</h3>
              <p className="text-muted-foreground">
                When you need to remember something, just ask and get helpful answers.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Stay Connected</h3>
              <p className="text-muted-foreground">
                Caregivers can view memories and provide support when needed.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-muted-foreground">
        <p>Memory Friend - Helping you remember what matters most</p>
      </footer>
    </div>
  );
};

export default Index;
