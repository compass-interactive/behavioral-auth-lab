import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BehavioralCollector } from '@/lib/behavioralAuth';

interface BehavioralFormProps {
  collector: BehavioralCollector;
  onSubmit: (formData: any) => void;
  sessionNumber?: number;
  isTraining?: boolean;
}

export const BehavioralForm: React.FC<BehavioralFormProps> = ({
  collector,
  onSubmit,
  sessionNumber,
  isTraining = false
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    comments: ''
  });

  const formRef = useRef<HTMLFormElement>(null);
  const keyDownTimes = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keyDownTimes.current[e.key] = Date.now();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyDown = keyDownTimes.current[e.key];
      if (keyDown) {
        const keyUp = Date.now();
        const pressure = (e as any).pressure || 0.5; // Some browsers support pressure
        collector.recordKeystroke(e.key, keyDown, keyUp, pressure);
        delete keyDownTimes.current[e.key];
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = form.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      collector.recordMouseMovement(x, y, 'move');
    };

    const handleMouseClick = (e: MouseEvent) => {
      const rect = form.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      collector.recordMouseMovement(x, y, 'click');
    };

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      collector.recordMouseMovement(target.scrollLeft, target.scrollTop, 'scroll');
    };

    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const rect = form.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const pressure = (touch as any).force || 0.5;
        const size = (touch as any).radiusX || 10;
        collector.recordTouchEvent(x, y, pressure, size, 'start');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const rect = form.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const pressure = (touch as any).force || 0.5;
        const size = (touch as any).radiusX || 10;
        collector.recordTouchEvent(x, y, pressure, size, 'move');
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const rect = form.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const pressure = (touch as any).force || 0.5;
        const size = (touch as any).radiusX || 10;
        collector.recordTouchEvent(x, y, pressure, size, 'end');
      }
    };

    form.addEventListener('keydown', handleKeyDown);
    form.addEventListener('keyup', handleKeyUp);
    form.addEventListener('mousemove', handleMouseMove);
    form.addEventListener('click', handleMouseClick);
    form.addEventListener('scroll', handleScroll);
    form.addEventListener('touchstart', handleTouchStart);
    form.addEventListener('touchmove', handleTouchMove);
    form.addEventListener('touchend', handleTouchEnd);

    return () => {
      form.removeEventListener('keydown', handleKeyDown);
      form.removeEventListener('keyup', handleKeyUp);
      form.removeEventListener('mousemove', handleMouseMove);
      form.removeEventListener('click', handleMouseClick);
      form.removeEventListener('scroll', handleScroll);
      form.removeEventListener('touchstart', handleTouchStart);
      form.removeEventListener('touchmove', handleTouchMove);
      form.removeEventListener('touchend', handleTouchEnd);
    };
  }, [collector]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card border-border shadow-neural">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
          {isTraining ? `Training Session ${sessionNumber}/10` : 'Authentication Test'}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isTraining 
            ? 'Fill out this form naturally to train the behavioral authentication system'
            : 'Fill out this form to test authentication against your behavioral patterns'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground font-medium">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              className="bg-input border-border focus:ring-primary transition-all duration-300"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              className="bg-input border-border focus:ring-primary transition-all duration-300"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-foreground font-medium">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="Enter your phone number"
              className="bg-input border-border focus:ring-primary transition-all duration-300"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-foreground font-medium">Address</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your address"
              className="bg-input border-border focus:ring-primary transition-all duration-300"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments" className="text-foreground font-medium">Additional Comments</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              placeholder="Enter any additional comments or feedback..."
              className="bg-input border-border focus:ring-primary transition-all duration-300 min-h-[100px]"
              rows={4}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-3 transition-all duration-300 shadow-glow"
          >
            {isTraining ? 'Complete Training Session' : 'Submit for Authentication'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};