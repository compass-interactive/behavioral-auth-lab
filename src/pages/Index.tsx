import React, { useState, useEffect } from 'react';
import { BehavioralCollector, NaiveBayesAuthenticator, BehavioralData } from '@/lib/behavioralAuth';
import { BehavioralForm } from '@/components/BehavioralForm';
import { ReferenceCard } from '@/components/ReferenceCard';
import { TrainingDashboard } from '@/components/TrainingDashboard';
import { AuthenticationResults } from '@/components/AuthenticationResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Brain, Shield, Zap, Info } from 'lucide-react';

type AppMode = 'welcome' | 'training' | 'testing';

interface AuthenticationResult {
  isAuthentic: boolean;
  confidence: number;
  timestamp: number;
  sessionId: string;
}

const Index = () => {
  const [mode, setMode] = useState<AppMode>('welcome');
  const [currentSession, setCurrentSession] = useState(1);
  const [collector] = useState(() => new BehavioralCollector());
  const [authenticator] = useState(() => new NaiveBayesAuthenticator());
  const [authResults, setAuthResults] = useState<AuthenticationResult[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    // Load existing data on component mount
    const loaded = authenticator.loadFromLocalStorage();
    if (loaded && authenticator.isReadyForTesting()) {
      setCurrentSession(11); // Training complete
    }
  }, [authenticator]);

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleTrainingSubmit = (formData: any) => {
    const sessionId = generateSessionId();
    const behavioralData = collector.getCollectedData(sessionId);
    
    authenticator.addTrainingData(behavioralData);
    authenticator.saveToLocalStorage();

    toast({
      title: "Training Session Complete",
      description: `Session ${currentSession}/10 data recorded successfully.`,
    });

    if (currentSession < 10) {
      setCurrentSession(prev => prev + 1);
      collector.reset();
      setIsFormVisible(false);
      
      // Show form again after a brief delay
      setTimeout(() => setIsFormVisible(true), 1000);
    } else {
      setCurrentSession(11);
      setIsFormVisible(false);
      toast({
        title: "Training Complete!",
        description: "The behavioral authentication system is now ready for testing.",
      });
    }
  };

  const handleAuthenticationTest = (formData: any) => {
    const sessionId = generateSessionId();
    const behavioralData = collector.getCollectedData(sessionId);
    
    const result = authenticator.authenticate(behavioralData);
    
    const authResult: AuthenticationResult = {
      isAuthentic: result.isAuthentic,
      confidence: result.confidence,
      timestamp: Date.now(),
      sessionId
    };

    setAuthResults(prev => [...prev, authResult]);
    collector.reset();
    setIsFormVisible(false);

    toast({
      title: result.isAuthentic ? "Authentication Successful" : "Authentication Failed",
      description: `Confidence: ${(result.confidence * 100).toFixed(1)}%`,
      variant: result.isAuthentic ? "default" : "destructive",
    });
  };

  const handleStartTraining = () => {
    setMode('training');
    setCurrentSession(1);
    collector.reset();
    authenticator.reset();
    setIsFormVisible(true);
  };

  const handleStartTesting = () => {
    setMode('testing');
    collector.reset();
    setIsFormVisible(true);
  };

  const handleNewTest = () => {
    collector.reset();
    setIsFormVisible(true);
  };

  const handleReset = () => {
    setMode('welcome');
    setCurrentSession(1);
    collector.reset();
    authenticator.reset();
    setAuthResults([]);
    setIsFormVisible(false);
    
    toast({
      title: "System Reset",
      description: "All training data and results have been cleared.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-neural border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Behavioral Auth Lab
                </h1>
                <p className="text-muted-foreground">
                  Advanced biometric authentication using behavioral patterns
                </p>
              </div>
            </div>
            {mode !== 'welcome' && (
              <Button
                variant="outline"
                onClick={() => setMode('welcome')}
                className="border-border hover:bg-secondary"
              >
                Back to Home
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {mode === 'welcome' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-foreground">
                Next-Generation Authentication
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience cutting-edge behavioral biometrics that learns your unique typing patterns, 
                mouse movements, and touch gestures to provide seamless, secure authentication.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-card border-border shadow-neural hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <Zap className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-foreground">Keystroke Dynamics</CardTitle>
                  <CardDescription>
                    Analyzes typing rhythm, dwell time, and flight time between keystrokes
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card border-border shadow-neural hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <Shield className="h-8 w-8 text-accent mb-2" />
                  <CardTitle className="text-foreground">Mouse Biometrics</CardTitle>
                  <CardDescription>
                    Tracks mouse movement patterns, velocity, and clicking behavior
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card border-border shadow-neural hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <Brain className="h-8 w-8 text-primary-glow mb-2" />
                  <CardTitle className="text-foreground">AI Recognition</CardTitle>
                  <CardDescription>
                    Uses Naive Bayes machine learning for pattern recognition and authentication
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Alert className="bg-muted/50 border-border">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-muted-foreground">
                This demonstration runs entirely in your browser. All behavioral data is stored locally 
                and never transmitted to any servers. Your privacy is completely protected.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleStartTraining}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow px-8 py-6 text-lg"
              >
                Start Training (10 Sessions)
              </Button>
              {authenticator.isReadyForTesting() && (
                <Button
                  onClick={handleStartTesting}
                  variant="outline"
                  className="border-border hover:bg-secondary px-8 py-6 text-lg"
                >
                  Test Authentication
                </Button>
              )}
            </div>
          </div>
        )}

        {mode === 'training' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <TrainingDashboard
              currentSession={currentSession}
              totalSessions={10}
              progress={authenticator.getTrainingProgress()}
              isTrainingComplete={currentSession > 10}
              onReset={handleReset}
              onStartTesting={handleStartTesting}
            />
            
            {isFormVisible && currentSession <= 10 && (
              <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:order-2">
                  <ReferenceCard />
                </div>
                <div className="lg:col-span-2 lg:order-1">
                  <BehavioralForm
                    collector={collector}
                    onSubmit={handleTrainingSubmit}
                    sessionNumber={currentSession}
                    isTraining={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'testing' && (
          <div className="max-w-6xl mx-auto space-y-8">
            {authResults.length > 0 && (
              <AuthenticationResults
                results={authResults}
                onNewTest={handleNewTest}
                onReset={handleReset}
              />
            )}
            
            {isFormVisible && (
              <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:order-2">
                  <ReferenceCard />
                </div>
                <div className="lg:col-span-2 lg:order-1">
                  <BehavioralForm
                    collector={collector}
                    onSubmit={handleAuthenticationTest}
                    isTraining={false}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;