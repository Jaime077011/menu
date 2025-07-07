import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '../../stores/characterStore';
import type { PersonalityTraits, EmotionalState } from './PersonalityEngine';

// Animation sequence types
export interface AnimationSequence {
  id: string;
  name: string;
  steps: AnimationStep[];
  duration: number;
  priority: number;
  personality?: string[];
  emotionalContext?: string[];
  triggers?: string[];
}

export interface AnimationStep {
  animation: string;
  duration: number;
  delay?: number;
  parameters?: Record<string, any>;
  transitions?: {
    in: string;
    out: string;
  };
}

export interface CharacterStateContext {
  currentSequence: AnimationSequence | null;
  queuedSequences: AnimationSequence[];
  isPlaying: boolean;
  currentStep: number;
  emotionalInfluence: EmotionalState | null;
  personalityInfluence: PersonalityTraits | null;
  lastActivity: number;
  idleTimer: NodeJS.Timeout | null;
}

interface CharacterStateManagerProps {
  restaurantId: string;
  personality: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'ENTHUSIASTIC';
  emotionalState?: EmotionalState;
  personalityTraits?: PersonalityTraits;
  onAnimationStart?: (sequence: AnimationSequence) => void;
  onAnimationEnd?: (sequence: AnimationSequence) => void;
  onStateChange?: (state: string) => void;
  characterRef?: React.RefObject<any>;
  className?: string;
}

export const CharacterStateManager: React.FC<CharacterStateManagerProps> = ({
  restaurantId,
  personality,
  emotionalState,
  personalityTraits,
  onAnimationStart,
  onAnimationEnd,
  onStateChange,
  characterRef,
  className = '',
}) => {
  const [stateContext, setStateContext] = useState<CharacterStateContext>({
    currentSequence: null,
    queuedSequences: [],
    isPlaying: false,
    currentStep: 0,
    emotionalInfluence: null,
    personalityInfluence: null,
    lastActivity: Date.now(),
    idleTimer: null,
  });
  
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    currentMood, 
    setMood, 
    queueAnimation, 
    processAnimationQueue,
    setInteracting 
  } = useCharacterStore();

  // Predefined animation sequences based on personality and context
  const animationSequences = useCallback((): AnimationSequence[] => [
    // Greeting sequences
    {
      id: 'friendly_greeting',
      name: 'Friendly Greeting',
      steps: [
        { animation: 'wave', duration: 1000, parameters: { intensity: 'warm' } },
        { animation: 'smile', duration: 500, delay: 200 },
        { animation: 'idle', duration: 2000, delay: 300 },
      ],
      duration: 3700,
      priority: 8,
      personality: ['FRIENDLY', 'ENTHUSIASTIC'],
      emotionalContext: ['positive', 'neutral'],
      triggers: ['greeting', 'welcome', 'hello'],
    },
    {
      id: 'professional_greeting',
      name: 'Professional Greeting',
      steps: [
        { animation: 'bow', duration: 800, parameters: { formality: 'high' } },
        { animation: 'attentive', duration: 1500, delay: 100 },
        { animation: 'professional_stance', duration: 2000, delay: 200 },
      ],
      duration: 4400,
      priority: 9,
      personality: ['PROFESSIONAL'],
      emotionalContext: ['neutral', 'positive'],
      triggers: ['greeting', 'welcome', 'service'],
    },
    
    // Serving sequences
    {
      id: 'enthusiastic_serving',
      name: 'Enthusiastic Serving',
      steps: [
        { animation: 'excited_preparation', duration: 1200 },
        { animation: 'energetic_serve', duration: 1500, delay: 200 },
        { animation: 'happy_bounce', duration: 800, delay: 300 },
        { animation: 'attentive', duration: 1000, delay: 100 },
      ],
      duration: 4800,
      priority: 7,
      personality: ['ENTHUSIASTIC', 'FRIENDLY'],
      emotionalContext: ['positive'],
      triggers: ['serving', 'order', 'food'],
    },
    {
      id: 'careful_serving',
      name: 'Careful Serving',
      steps: [
        { animation: 'focused_preparation', duration: 1500 },
        { animation: 'precise_serve', duration: 2000, delay: 300 },
        { animation: 'quality_check', duration: 1000, delay: 200 },
        { animation: 'professional_stance', duration: 1500, delay: 100 },
      ],
      duration: 6100,
      priority: 8,
      personality: ['PROFESSIONAL', 'CASUAL'],
      emotionalContext: ['neutral', 'focused'],
      triggers: ['serving', 'order', 'careful'],
    },

    // Thinking sequences
    {
      id: 'contemplative_thinking',
      name: 'Contemplative Thinking',
      steps: [
        { animation: 'hand_to_chin', duration: 2000 },
        { animation: 'thoughtful_nod', duration: 1000, delay: 500 },
        { animation: 'eureka_moment', duration: 800, delay: 200 },
        { animation: 'confident_smile', duration: 1200, delay: 100 },
      ],
      duration: 5500,
      priority: 6,
      personality: ['PROFESSIONAL', 'CASUAL'],
      emotionalContext: ['thinking', 'neutral'],
      triggers: ['thinking', 'considering', 'question'],
    },
    {
      id: 'quick_thinking',
      name: 'Quick Thinking',
      steps: [
        { animation: 'rapid_processing', duration: 800 },
        { animation: 'finger_snap', duration: 400, delay: 100 },
        { animation: 'confident_gesture', duration: 1000, delay: 50 },
      ],
      duration: 2350,
      priority: 7,
      personality: ['ENTHUSIASTIC', 'CASUAL'],
      emotionalContext: ['excited', 'confident'],
      triggers: ['quick', 'fast', 'immediately'],
    },

    // Idle sequences
    {
      id: 'friendly_idle',
      name: 'Friendly Idle',
      steps: [
        { animation: 'gentle_sway', duration: 3000 },
        { animation: 'warm_smile', duration: 1000, delay: 500 },
        { animation: 'welcoming_gesture', duration: 1500, delay: 1000 },
      ],
      duration: 6000,
      priority: 3,
      personality: ['FRIENDLY'],
      emotionalContext: ['neutral', 'positive'],
      triggers: ['idle', 'waiting'],
    },
    {
      id: 'professional_idle',
      name: 'Professional Idle',
      steps: [
        { animation: 'straight_posture', duration: 4000 },
        { animation: 'slight_nod', duration: 500, delay: 2000 },
        { animation: 'hands_clasped', duration: 2000, delay: 500 },
      ],
      duration: 7000,
      priority: 4,
      personality: ['PROFESSIONAL'],
      emotionalContext: ['neutral'],
      triggers: ['idle', 'waiting', 'standby'],
    },

    // Reaction sequences
    {
      id: 'surprised_reaction',
      name: 'Surprised Reaction',
      steps: [
        { animation: 'eyes_widen', duration: 300 },
        { animation: 'step_back', duration: 500, delay: 100 },
        { animation: 'recover_composure', duration: 1200, delay: 300 },
        { animation: 'apologetic_smile', duration: 1000, delay: 200 },
      ],
      duration: 3100,
      priority: 9,
      personality: ['FRIENDLY', 'CASUAL'],
      emotionalContext: ['surprised', 'negative'],
      triggers: ['surprise', 'unexpected', 'mistake'],
    },
    {
      id: 'empathetic_response',
      name: 'Empathetic Response',
      steps: [
        { animation: 'concerned_lean', duration: 1000 },
        { animation: 'understanding_nod', duration: 1500, delay: 300 },
        { animation: 'reassuring_gesture', duration: 2000, delay: 200 },
        { animation: 'warm_smile', duration: 1000, delay: 400 },
      ],
      duration: 5400,
      priority: 8,
      personality: ['FRIENDLY', 'PROFESSIONAL'],
      emotionalContext: ['empathetic', 'caring'],
      triggers: ['problem', 'concern', 'help'],
    },
  ], []);

  // Select appropriate animation sequence based on context
  const selectAnimationSequence = useCallback((
    trigger: string,
    contextualPriority?: number
  ): AnimationSequence | null => {
    const sequences = animationSequences();
    
    // Filter by personality
    let candidateSequences = sequences.filter(seq => 
      !seq.personality || seq.personality.includes(personality)
    );

    // Filter by emotional context if available
    if (emotionalState?.context) {
      candidateSequences = candidateSequences.filter(seq =>
        !seq.emotionalContext || seq.emotionalContext.includes(emotionalState.context)
      );
    }

    // Filter by triggers
    candidateSequences = candidateSequences.filter(seq =>
      seq.triggers?.some(seqTrigger => 
        trigger.toLowerCase().includes(seqTrigger.toLowerCase()) ||
        seqTrigger.toLowerCase().includes(trigger.toLowerCase())
      ) || false
    );

    if (candidateSequences.length === 0) {
      // Fallback to generic sequences
      candidateSequences = sequences.filter(seq => 
        seq.triggers?.includes('idle') || seq.name.includes('Idle')
      );
    }

    // Sort by priority (higher is better) and select the best match
    candidateSequences.sort((a, b) => {
      let scoreA = a.priority;
      let scoreB = b.priority;

      // Boost score for personality match
      if (a.personality?.includes(personality)) scoreA += 2;
      if (b.personality?.includes(personality)) scoreB += 2;

      // Boost score for emotional context match
      if (emotionalState?.context && a.emotionalContext?.includes(emotionalState.context)) scoreA += 1;
      if (emotionalState?.context && b.emotionalContext?.includes(emotionalState.context)) scoreB += 1;

      // Apply contextual priority if provided
      if (contextualPriority) {
        scoreA += contextualPriority;
        scoreB += contextualPriority;
      }

      return scoreB - scoreA;
    });

    return candidateSequences[0] || null;
  }, [animationSequences, personality, emotionalState]);

  // Play animation sequence
  const playSequence = useCallback(async (sequence: AnimationSequence) => {
    if (stateContext.isPlaying && stateContext.currentSequence?.priority <= sequence.priority) {
      // Queue high-priority sequence or interrupt if higher priority
      setStateContext(prev => ({
        ...prev,
        queuedSequences: [...prev.queuedSequences, sequence].sort((a, b) => b.priority - a.priority),
      }));
      return;
    }

    console.log(`🎬 Playing animation sequence: ${sequence.name}`);
    
    setStateContext(prev => ({
      ...prev,
      currentSequence: sequence,
      isPlaying: true,
      currentStep: 0,
      lastActivity: Date.now(),
    }));

    setInteracting(true);
    onAnimationStart?.(sequence);

    // Play each step in the sequence
    for (let i = 0; i < sequence.steps.length; i++) {
      const step = sequence.steps[i];
      
      // Wait for delay if specified
      if (step.delay) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
      }

      // Update current step
      setStateContext(prev => ({ ...prev, currentStep: i }));

      // Trigger animation on character
      if (characterRef?.current?.triggerState) {
        const success = characterRef.current.triggerState(step.animation);
        console.log(`🎭 Step ${i + 1}/${sequence.steps.length}: ${step.animation} - ${success ? '✅' : '❌'}`);
      }

      // Update mood in store
      setMood(step.animation as any);
      onStateChange?.(step.animation);

      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    // Sequence completed
    setStateContext(prev => ({
      ...prev,
      currentSequence: null,
      isPlaying: false,
      currentStep: 0,
    }));

    setInteracting(false);
    onAnimationEnd?.(sequence);

    // Process queued sequences
    setStateContext(prev => {
      if (prev.queuedSequences.length > 0) {
        const nextSequence = prev.queuedSequences[0];
        const remainingQueue = prev.queuedSequences.slice(1);
        
        // Play next sequence
        setTimeout(() => playSequence(nextSequence), 100);
        
        return {
          ...prev,
          queuedSequences: remainingQueue,
        };
      }
      return prev;
    });

    // Start idle timer
    startIdleTimer();
  }, [stateContext, characterRef, setInteracting, setMood, onAnimationStart, onAnimationEnd, onStateChange]);

  // Start idle behavior timer
  const startIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      if (!stateContext.isPlaying) {
        const idleSequence = selectAnimationSequence('idle');
        if (idleSequence) {
          playSequence(idleSequence);
        }
      }
    }, 10000); // 10 seconds of inactivity triggers idle
  }, [stateContext.isPlaying, selectAnimationSequence, playSequence]);

  // Public method to trigger animation
  const triggerAnimation = useCallback((trigger: string, priority?: number) => {
    const sequence = selectAnimationSequence(trigger, priority);
    if (sequence) {
      playSequence(sequence);
      return true;
    }
    console.warn(`⚠️ No animation sequence found for trigger: ${trigger}`);
    return false;
  }, [selectAnimationSequence, playSequence]);

  // Update emotional and personality influences
  useEffect(() => {
    setStateContext(prev => ({
      ...prev,
      emotionalInfluence: emotionalState || null,
      personalityInfluence: personalityTraits || null,
    }));
  }, [emotionalState, personalityTraits]);

  // Initialize idle timer
  useEffect(() => {
    startIdleTimer();
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [startIdleTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  // Expose triggerAnimation method to parent components
  useEffect(() => {
    (window as any).triggerCharacterAnimation = triggerAnimation;
  }, [triggerAnimation]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`character-state-manager ${className}`}
    >
      {/* Animation State Indicator */}
      <AnimatePresence>
        {stateContext.isPlaying && stateContext.currentSequence && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-40 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg p-3 text-blue-200 text-sm"
          >
            <div className="font-medium">{stateContext.currentSequence.name}</div>
            <div className="text-xs opacity-80">
              Step {stateContext.currentStep + 1}/{stateContext.currentSequence.steps.length}
            </div>
            <div className="w-full bg-blue-400/20 rounded-full h-1 mt-2">
              <motion.div
                className="bg-blue-400 h-1 rounded-full"
                initial={{ width: '0%' }}
                animate={{ 
                  width: `${((stateContext.currentStep + 1) / stateContext.currentSequence.steps.length) * 100}%` 
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Status Indicator */}
      {stateContext.queuedSequences.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-36 right-4 z-40 bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 rounded-lg p-2 text-purple-200 text-xs"
        >
          <div>Queue: {stateContext.queuedSequences.length}</div>
          <div className="opacity-70">
            Next: {stateContext.queuedSequences[0]?.name || 'None'}
          </div>
        </motion.div>
      )}

      {/* Debug Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-52 right-4 z-30 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-xs text-white max-w-xs">
          <h4 className="font-bold mb-2">🎭 State Manager Debug</h4>
          
          <div className="mb-2">
            <strong>Status:</strong>
            <div className={`text-xs ${stateContext.isPlaying ? 'text-green-300' : 'text-gray-300'}`}>
              {stateContext.isPlaying ? '▶️ Playing' : '⏸️ Idle'}
            </div>
          </div>

          {stateContext.currentSequence && (
            <div className="mb-2">
              <strong>Current:</strong>
              <div className="text-xs text-blue-300">{stateContext.currentSequence.name}</div>
            </div>
          )}

          <div className="mb-2">
            <strong>Queue:</strong>
            <div className="text-xs">
              {stateContext.queuedSequences.length} sequences
            </div>
          </div>

          <div>
            <strong>Context:</strong>
            <div className="text-xs">
              {emotionalState?.context || 'neutral'}
              {emotionalState?.triggers && emotionalState.triggers.length > 0 && (
                <div className="text-yellow-300">
                  {emotionalState.triggers.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};