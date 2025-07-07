import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/utils/api';
import { useCharacterStore } from '../../stores/characterStore';

// Personality trait mapping types
export interface PersonalityTraits {
  openness: number; // 1-10 (creative, adventurous vs traditional, practical)
  conscientiousness: number; // 1-10 (organized, dependable vs spontaneous, flexible)
  extraversion: number; // 1-10 (outgoing, energetic vs reserved, quiet)
  agreeableness: number; // 1-10 (friendly, cooperative vs competitive, critical)
  neuroticism: number; // 1-10 (sensitive, nervous vs secure, confident)
}

export interface EmotionalState {
  valence: number; // -10 to 10 (negative to positive)
  arousal: number; // 1-10 (calm to excited)
  dominance: number; // 1-10 (submissive to assertive)
  context: string;
  timestamp: number;
  triggers: string[];
}

export interface PersonalityResponse {
  text: string;
  tone: 'enthusiastic' | 'professional' | 'friendly' | 'casual' | 'empathetic';
  confidence: number;
  emotionalImpact: EmotionalState;
  suggestedAnimations: string[];
  contextTags: string[];
}

interface PersonalityEngineProps {
  restaurantId: string;
  personality: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'ENTHUSIASTIC';
  waiterName: string;
  onPersonalityResponse?: (response: PersonalityResponse) => void;
  onEmotionalStateChange?: (state: EmotionalState) => void;
  onTraitsUpdate?: (traits: PersonalityTraits) => void;
  className?: string;
}

export const PersonalityEngine: React.FC<PersonalityEngineProps> = ({
  restaurantId,
  personality,
  waiterName,
  onPersonalityResponse,
  onEmotionalStateChange,
  onTraitsUpdate,
  className = '',
}) => {
  const [currentTraits, setCurrentTraits] = useState<PersonalityTraits>({} as PersonalityTraits);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    valence: 0,
    arousal: 5,
    dominance: 5,
    context: 'idle',
    timestamp: Date.now(),
    triggers: [],
  });
  const [conversationMemory, setConversationMemory] = useState<string[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  
  const { 
    currentMood, 
    personalitySettings, 
    conversationContext,
    lastUserMessage,
    getPersonalityPrompt 
  } = useCharacterStore();

  // Personality trait mapping based on personality type
  const personalityTraitMap = useMemo<Record<string, PersonalityTraits>>(() => ({
    FRIENDLY: {
      openness: 7,
      conscientiousness: 6,
      extraversion: 8,
      agreeableness: 9,
      neuroticism: 3,
    },
    PROFESSIONAL: {
      openness: 5,
      conscientiousness: 9,
      extraversion: 6,
      agreeableness: 7,
      neuroticism: 2,
    },
    CASUAL: {
      openness: 8,
      conscientiousness: 4,
      extraversion: 7,
      agreeableness: 8,
      neuroticism: 4,
    },
    ENTHUSIASTIC: {
      openness: 9,
      conscientiousness: 6,
      extraversion: 10,
      agreeableness: 8,
      neuroticism: 5,
    },
  }), []);

  // Initialize traits based on personality type
  useEffect(() => {
    const traits = personalityTraitMap[personality];
    setCurrentTraits(traits);
    onTraitsUpdate?.(traits);
  }, [personality, personalityTraitMap, onTraitsUpdate]);

  // Context-aware response generation
  const generatePersonalityResponse = useCallback(async (
    userMessage: string,
    menuContext?: any[]
  ): Promise<PersonalityResponse> => {
    setIsLearning(true);

    try {
      // Analyze message for emotional triggers
      const emotionalTriggers = analyzeEmotionalTriggers(userMessage);
      
      // Update emotional state based on message
      const newEmotionalState = calculateEmotionalResponse(
        emotionalTriggers,
        currentTraits,
        emotionalState
      );
      
      // Generate personality-driven response
      const basePrompt = getPersonalityPrompt();
      const personalityPrompt = enhancePromptWithPersonality(
        basePrompt,
        currentTraits,
        newEmotionalState,
        conversationMemory
      );

      // TODO: Replace with actual tRPC call when AI router is implemented
      const response = await generateAIResponse(personalityPrompt, userMessage);
      
      // Determine appropriate animations based on response and emotional state
      const suggestedAnimations = getSuggestedAnimations(
        newEmotionalState,
        currentTraits,
        response.tone
      );

      const personalityResponse: PersonalityResponse = {
        text: response.text,
        tone: response.tone,
        confidence: response.confidence,
        emotionalImpact: newEmotionalState,
        suggestedAnimations,
        contextTags: response.contextTags,
      };

      // Update states
      setEmotionalState(newEmotionalState);
      setConversationMemory(prev => [...prev.slice(-10), userMessage]); // Keep last 10 messages
      
      // Notify parent components
      onPersonalityResponse?.(personalityResponse);
      onEmotionalStateChange?.(newEmotionalState);

      return personalityResponse;

    } catch (error) {
      console.error('❌ Personality Engine error:', error);
      
      // Fallback response
      const fallbackResponse: PersonalityResponse = {
        text: getFallbackResponse(personality, waiterName),
        tone: 'friendly',
        confidence: 0.5,
        emotionalImpact: emotionalState,
        suggestedAnimations: ['idle'],
        contextTags: ['fallback'],
      };

      return fallbackResponse;
    } finally {
      setIsLearning(false);
    }
  }, [
    currentTraits,
    emotionalState,
    conversationMemory,
    personality,
    waiterName,
    getPersonalityPrompt,
    onPersonalityResponse,
    onEmotionalStateChange,
  ]);

  // Analyze emotional triggers in user message
  const analyzeEmotionalTriggers = useCallback((message: string): string[] => {
    const triggers: string[] = [];
    const lowercaseMessage = message.toLowerCase();

    // Positive triggers
    if (/\b(love|great|amazing|excellent|perfect|fantastic|wonderful)\b/.test(lowercaseMessage)) {
      triggers.push('positive');
    }
    
    // Negative triggers
    if (/\b(hate|terrible|awful|bad|disgusting|horrible)\b/.test(lowercaseMessage)) {
      triggers.push('negative');
    }
    
    // Urgency triggers
    if (/\b(hurry|quick|fast|urgent|asap|now)\b/.test(lowercaseMessage)) {
      triggers.push('urgency');
    }
    
    // Confusion triggers
    if (/\b(confused|lost|help|don't understand|what)\b/.test(lowercaseMessage)) {
      triggers.push('confusion');
    }
    
    // Dietary triggers
    if (/\b(vegan|vegetarian|gluten|allergy|allergic)\b/.test(lowercaseMessage)) {
      triggers.push('dietary');
    }

    return triggers;
  }, []);

  // Calculate emotional response based on triggers and personality
  const calculateEmotionalResponse = useCallback((
    triggers: string[],
    traits: PersonalityTraits,
    currentState: EmotionalState
  ): EmotionalState => {
    let valenceChange = 0;
    let arousalChange = 0;
    let dominanceChange = 0;

    triggers.forEach(trigger => {
      switch (trigger) {
        case 'positive':
          valenceChange += 2 * (traits.extraversion / 10);
          arousalChange += 1 * (traits.extraversion / 10);
          break;
        case 'negative':
          valenceChange -= 1 * (1 - traits.neuroticism / 10);
          arousalChange += 2 * (traits.neuroticism / 10);
          break;
        case 'urgency':
          arousalChange += 3;
          dominanceChange += 1 * (traits.conscientiousness / 10);
          break;
        case 'confusion':
          valenceChange -= 0.5;
          dominanceChange += 2 * (traits.agreeableness / 10);
          break;
        case 'dietary':
          arousalChange += 1;
          dominanceChange += 1 * (traits.conscientiousness / 10);
          break;
      }
    });

    // Apply personality-based dampening/amplification
    const emotionalSensitivity = traits.neuroticism / 10;
    const extraversion = traits.extraversion / 10;

    return {
      valence: Math.max(-10, Math.min(10, currentState.valence + valenceChange * emotionalSensitivity)),
      arousal: Math.max(1, Math.min(10, currentState.arousal + arousalChange * extraversion)),
      dominance: Math.max(1, Math.min(10, currentState.dominance + dominanceChange)),
      context: triggers.length > 0 ? triggers[0] : 'neutral',
      timestamp: Date.now(),
      triggers,
    };
  }, []);

  // Enhance AI prompt with personality context
  const enhancePromptWithPersonality = useCallback((
    basePrompt: string,
    traits: PersonalityTraits,
    emotionalState: EmotionalState,
    memory: string[]
  ): string => {
    let enhancedPrompt = basePrompt;

    // Add trait-based behavioral instructions
    enhancedPrompt += `\n\nPersonality Traits (1-10 scale):`;
    enhancedPrompt += `\n- Openness: ${traits.openness}/10 (${traits.openness > 6 ? 'creative, adventurous' : 'traditional, practical'})`;
    enhancedPrompt += `\n- Conscientiousness: ${traits.conscientiousness}/10 (${traits.conscientiousness > 6 ? 'organized, dependable' : 'spontaneous, flexible'})`;
    enhancedPrompt += `\n- Extraversion: ${traits.extraversion}/10 (${traits.extraversion > 6 ? 'outgoing, energetic' : 'reserved, quiet'})`;
    enhancedPrompt += `\n- Agreeableness: ${traits.agreeableness}/10 (${traits.agreeableness > 6 ? 'friendly, cooperative' : 'competitive, critical'})`;
    enhancedPrompt += `\n- Neuroticism: ${traits.neuroticism}/10 (${traits.neuroticism > 6 ? 'sensitive, nervous' : 'secure, confident'})`;

    // Add emotional state context
    enhancedPrompt += `\n\nCurrent Emotional State:`;
    enhancedPrompt += `\n- Mood: ${emotionalState.valence > 0 ? 'positive' : emotionalState.valence < 0 ? 'negative' : 'neutral'} (${emotionalState.valence}/10)`;
    enhancedPrompt += `\n- Energy: ${emotionalState.arousal > 7 ? 'high' : emotionalState.arousal < 4 ? 'low' : 'moderate'} (${emotionalState.arousal}/10)`;
    enhancedPrompt += `\n- Confidence: ${emotionalState.dominance > 7 ? 'high' : emotionalState.dominance < 4 ? 'low' : 'moderate'} (${emotionalState.dominance}/10)`;

    if (emotionalState.triggers.length > 0) {
      enhancedPrompt += `\n- Recent triggers: ${emotionalState.triggers.join(', ')}`;
    }

    // Add conversation memory context
    if (memory.length > 0) {
      enhancedPrompt += `\n\nRecent conversation context: ${memory.slice(-3).join(' -> ')}`;
    }

    enhancedPrompt += `\n\nRespond authentically based on your personality traits and current emotional state. Match your energy level and tone to your current mood.`;

    return enhancedPrompt;
  }, []);

  // Get suggested animations based on emotional state and traits
  const getSuggestedAnimations = useCallback((
    emotionalState: EmotionalState,
    traits: PersonalityTraits,
    tone: string
  ): string[] => {
    const animations: string[] = [];

    // Base animation from emotional state
    if (emotionalState.valence > 5) {
      animations.push('happy');
    } else if (emotionalState.valence < -3) {
      animations.push('concerned');
    }

    if (emotionalState.arousal > 7) {
      animations.push('excited');
    } else if (emotionalState.arousal < 3) {
      animations.push('calm');
    }

    // Personality-driven animations
    if (traits.extraversion > 7) {
      animations.push('animated_gestures');
    }
    
    if (traits.agreeableness > 8) {
      animations.push('welcoming');
    }

    if (traits.conscientiousness > 7) {
      animations.push('attentive');
    }

    // Tone-specific animations
    switch (tone) {
      case 'enthusiastic':
        animations.push('bouncy', 'excited');
        break;
      case 'professional':
        animations.push('formal', 'attentive');
        break;
      case 'friendly':
        animations.push('warm', 'welcoming');
        break;
      case 'casual':
        animations.push('relaxed', 'laid_back');
        break;
      case 'empathetic':
        animations.push('caring', 'understanding');
        break;
    }

    return [...new Set(animations)]; // Remove duplicates
  }, []);

  // Mock AI response generation (TODO: Replace with tRPC call)
  const generateAIResponse = async (prompt: string, userMessage: string) => {
    // This would be replaced with actual tRPC call to AI service
    return {
      text: `Thank you for your message! Let me help you with that.`,
      tone: 'friendly' as const,
      confidence: 0.8,
      contextTags: ['greeting', 'helpful'],
    };
  };

  // Fallback response generator
  const getFallbackResponse = (personality: string, waiterName: string): string => {
    const responses = {
      FRIENDLY: `Hi there! I'm ${waiterName}, and I'm here to help make your dining experience wonderful!`,
      PROFESSIONAL: `Good day. I'm ${waiterName}, your server. How may I assist you today?`,
      CASUAL: `Hey! I'm ${waiterName}. What can I get for you?`,
      ENTHUSIASTIC: `Welcome! I'm ${waiterName} and I'm so excited to help you today!`,
    };
    return responses[personality] || responses.FRIENDLY;
  };

  // Expose the generatePersonalityResponse method
  useEffect(() => {
    // Make the method available to parent components
    (window as any).generatePersonalityResponse = generatePersonalityResponse;
  }, [generatePersonalityResponse]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`personality-engine ${className}`}
    >
      {/* Personality Traits Visualization (Debug/Admin) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-xs text-white">
          <h4 className="font-bold mb-2">🧠 Personality Engine Debug</h4>
          
          <div className="mb-2">
            <strong>Traits:</strong>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>O: {currentTraits.openness}/10</div>
              <div>C: {currentTraits.conscientiousness}/10</div>
              <div>E: {currentTraits.extraversion}/10</div>
              <div>A: {currentTraits.agreeableness}/10</div>
              <div>N: {currentTraits.neuroticism}/10</div>
            </div>
          </div>

          <div className="mb-2">
            <strong>Emotional State:</strong>
            <div className="text-xs">
              <div>Valence: {emotionalState.valence.toFixed(1)}/10</div>
              <div>Arousal: {emotionalState.arousal.toFixed(1)}/10</div>
              <div>Dominance: {emotionalState.dominance.toFixed(1)}/10</div>
            </div>
          </div>

          <div>
            <strong>Context:</strong>
            <div className="text-xs">
              {emotionalState.context}
              {emotionalState.triggers.length > 0 && (
                <div>Triggers: {emotionalState.triggers.join(', ')}</div>
              )}
            </div>
          </div>

          {isLearning && (
            <div className="mt-2 text-yellow-300 text-xs">🧠 Learning...</div>
          )}
        </div>
      )}
    </motion.div>
  );
};