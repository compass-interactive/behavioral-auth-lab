// Behavioral Authentication Engine
// Client-side Naive Bayes implementation for behavioral biometrics

export interface BehavioralData {
  keystrokeDynamics: KeystrokeEvent[];
  mouseMovements: MouseMovementEvent[];
  touchEvents: TouchEvent[];
  timingData: TimingData;
  sessionId: string;
  timestamp: number;
}

export interface KeystrokeEvent {
  key: string;
  keyDown: number;
  keyUp: number;
  dwellTime: number;
  flightTime?: number;
  pressure?: number;
}

export interface MouseMovementEvent {
  x: number;
  y: number;
  timestamp: number;
  type: 'move' | 'click' | 'scroll';
  velocity?: number;
  acceleration?: number;
}

export interface TouchEvent {
  x: number;
  y: number;
  timestamp: number;
  pressure: number;
  size: number;
  type: 'start' | 'move' | 'end';
}

export interface TimingData {
  totalTime: number;
  pauseCount: number;
  averagePauseTime: number;
  typingSpeed: number;
  backspaceCount: number;
  formSubmissionTime: number;
}

export interface BehavioralFeatures {
  avgKeystrokeDwell: number;
  avgKeystrokeFlight: number;
  keystrokeRhythm: number;
  mouseVelocityMean: number;
  mouseVelocityStd: number;
  mouseAcceleration: number;
  typingSpeed: number;
  pauseFrequency: number;
  backspaceRate: number;
  totalFormTime: number;
  touchPressureMean?: number;
  touchSizeMean?: number;
}

export class BehavioralCollector {
  private keyEvents: KeystrokeEvent[] = [];
  private mouseEvents: MouseMovementEvent[] = [];
  private touchEvents: TouchEvent[] = [];
  private startTime: number = 0;
  private lastKeyTime: number = 0;
  private backspaceCount: number = 0;
  private pauseCount: number = 0;
  private totalPauseTime: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  recordKeystroke(key: string, keyDown: number, keyUp: number, pressure?: number) {
    const dwellTime = keyUp - keyDown;
    const flightTime = this.lastKeyTime ? keyDown - this.lastKeyTime : undefined;
    
    this.keyEvents.push({
      key,
      keyDown,
      keyUp,
      dwellTime,
      flightTime,
      pressure
    });

    if (key === 'Backspace') {
      this.backspaceCount++;
    }

    // Detect pauses (> 500ms between keystrokes)
    if (flightTime && flightTime > 500) {
      this.pauseCount++;
      this.totalPauseTime += flightTime;
    }

    this.lastKeyTime = keyUp;
  }

  recordMouseMovement(x: number, y: number, type: 'move' | 'click' | 'scroll') {
    const timestamp = Date.now();
    let velocity, acceleration;

    if (this.mouseEvents.length > 0 && type === 'move') {
      const lastEvent = this.mouseEvents[this.mouseEvents.length - 1];
      const distance = Math.sqrt(Math.pow(x - lastEvent.x, 2) + Math.pow(y - lastEvent.y, 2));
      const timeDiff = timestamp - lastEvent.timestamp;
      velocity = distance / timeDiff;

      if (this.mouseEvents.length > 1) {
        const prevEvent = this.mouseEvents[this.mouseEvents.length - 2];
        const prevVelocity = lastEvent.velocity || 0;
        acceleration = (velocity - prevVelocity) / timeDiff;
      }
    }

    this.mouseEvents.push({
      x,
      y,
      timestamp,
      type,
      velocity,
      acceleration
    });
  }

  recordTouchEvent(x: number, y: number, pressure: number, size: number, type: 'start' | 'move' | 'end') {
    this.touchEvents.push({
      x,
      y,
      timestamp: Date.now(),
      pressure,
      size,
      type
    });
  }

  getCollectedData(sessionId: string): BehavioralData {
    const totalTime = Date.now() - this.startTime;
    const typingSpeed = this.keyEvents.filter(k => k.key.length === 1).length / (totalTime / 60000);
    const avgPauseTime = this.pauseCount > 0 ? this.totalPauseTime / this.pauseCount : 0;

    return {
      keystrokeDynamics: this.keyEvents,
      mouseMovements: this.mouseEvents,
      touchEvents: this.touchEvents,
      timingData: {
        totalTime,
        pauseCount: this.pauseCount,
        averagePauseTime: avgPauseTime,
        typingSpeed,
        backspaceCount: this.backspaceCount,
        formSubmissionTime: totalTime
      },
      sessionId,
      timestamp: Date.now()
    };
  }

  reset() {
    this.keyEvents = [];
    this.mouseEvents = [];
    this.touchEvents = [];
    this.startTime = Date.now();
    this.lastKeyTime = 0;
    this.backspaceCount = 0;
    this.pauseCount = 0;
    this.totalPauseTime = 0;
  }
}

export class NaiveBayesAuthenticator {
  private trainingData: BehavioralFeatures[] = [];
  private meanFeatures: BehavioralFeatures | null = null;
  private varianceFeatures: BehavioralFeatures | null = null;
  private isTrained: boolean = false;

  extractFeatures(data: BehavioralData): BehavioralFeatures {
    const keystrokeDwells = data.keystrokeDynamics.map(k => k.dwellTime);
    const keystrokeFlights = data.keystrokeDynamics.filter(k => k.flightTime).map(k => k.flightTime!);
    const mouseVelocities = data.mouseMovements.filter(m => m.velocity).map(m => m.velocity!);
    const mouseAccelerations = data.mouseMovements.filter(m => m.acceleration).map(m => m.acceleration!);
    const touchPressures = data.touchEvents.map(t => t.pressure);
    const touchSizes = data.touchEvents.map(t => t.size);

    return {
      avgKeystrokeDwell: this.calculateMean(keystrokeDwells),
      avgKeystrokeFlight: this.calculateMean(keystrokeFlights),
      keystrokeRhythm: this.calculateStandardDeviation(keystrokeFlights),
      mouseVelocityMean: this.calculateMean(mouseVelocities),
      mouseVelocityStd: this.calculateStandardDeviation(mouseVelocities),
      mouseAcceleration: this.calculateMean(mouseAccelerations),
      typingSpeed: data.timingData.typingSpeed,
      pauseFrequency: data.timingData.pauseCount / (data.timingData.totalTime / 60000),
      backspaceRate: data.timingData.backspaceCount / data.keystrokeDynamics.length,
      totalFormTime: data.timingData.totalTime,
      touchPressureMean: touchPressures.length > 0 ? this.calculateMean(touchPressures) : undefined,
      touchSizeMean: touchSizes.length > 0 ? this.calculateMean(touchSizes) : undefined
    };
  }

  addTrainingData(data: BehavioralData) {
    const features = this.extractFeatures(data);
    this.trainingData.push(features);
    
    if (this.trainingData.length >= 10) {
      this.train();
    }
  }

  private train() {
    const features = this.trainingData;
    const featureKeys = Object.keys(features[0]) as (keyof BehavioralFeatures)[];
    
    this.meanFeatures = {} as BehavioralFeatures;
    this.varianceFeatures = {} as BehavioralFeatures;

    // Calculate mean for each feature
    for (const key of featureKeys) {
      const values = features.map(f => f[key]).filter(v => v !== undefined) as number[];
      this.meanFeatures[key] = this.calculateMean(values) as any;
    }

    // Calculate variance for each feature
    for (const key of featureKeys) {
      const values = features.map(f => f[key]).filter(v => v !== undefined) as number[];
      this.varianceFeatures[key] = this.calculateVariance(values, this.meanFeatures[key] as number) as any;
    }

    this.isTrained = true;
  }

  authenticate(data: BehavioralData): { isAuthentic: boolean; confidence: number } {
    if (!this.isTrained || !this.meanFeatures || !this.varianceFeatures) {
      return { isAuthentic: false, confidence: 0 };
    }

    const features = this.extractFeatures(data);
    let logProbability = 0;
    let featureCount = 0;

    const featureKeys = Object.keys(features) as (keyof BehavioralFeatures)[];
    
    for (const key of featureKeys) {
      const value = features[key];
      const meanValue = this.meanFeatures[key];
      const varianceValue = this.varianceFeatures[key];

      if (value !== undefined && meanValue !== undefined && varianceValue !== undefined) {
        const mean = meanValue as number;
        const variance = varianceValue as number;
        
        if (variance > 0) {
          const probability = this.gaussianProbability(value, mean, variance);
          logProbability += Math.log(probability + 1e-10); // Add small epsilon to avoid log(0)
          featureCount++;
        }
      }
    }

    const avgLogProbability = logProbability / featureCount;
    const confidence = Math.max(0, Math.min(1, Math.exp(avgLogProbability / 5))); // Normalize
    const isAuthentic = confidence > 0.3; // Threshold can be adjusted

    return { isAuthentic, confidence };
  }

  private gaussianProbability(x: number, mean: number, variance: number): number {
    const coefficient = 1 / Math.sqrt(2 * Math.PI * variance);
    const exponent = -Math.pow(x - mean, 2) / (2 * variance);
    return coefficient * Math.exp(exponent);
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const variance = this.calculateVariance(values, mean);
    return Math.sqrt(variance);
  }

  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const sumSquaredDiffs = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    return sumSquaredDiffs / values.length;
  }

  getTrainingProgress(): number {
    return Math.min(100, (this.trainingData.length / 10) * 100);
  }

  isReadyForTesting(): boolean {
    return this.isTrained;
  }

  saveToLocalStorage(key: string = 'behavioralAuth') {
    const data = {
      trainingData: this.trainingData,
      meanFeatures: this.meanFeatures,
      varianceFeatures: this.varianceFeatures,
      isTrained: this.isTrained
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  loadFromLocalStorage(key: string = 'behavioralAuth'): boolean {
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      this.trainingData = data.trainingData || [];
      this.meanFeatures = data.meanFeatures;
      this.varianceFeatures = data.varianceFeatures;
      this.isTrained = data.isTrained || false;
      return true;
    }
    return false;
  }

  reset() {
    this.trainingData = [];
    this.meanFeatures = null;
    this.varianceFeatures = null;
    this.isTrained = false;
    localStorage.removeItem('behavioralAuth');
  }
}