import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PersonalityConfig } from '@/types/aiActions';

export type CharacterMood = 'idle' | 'greeting' | 'serving' | 'thinking' | 'happy' | 'attentive';
export type PersonalityType = 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'ENTHUSIASTIC';
export type ConversationTone = 'FORMAL' | 'BALANCED' | 'CASUAL';
export type ResponseStyle = 'HELPFUL' | 'CONCISE' | 'DETAILED' | 'PLAYFUL';

// Enhanced types for Phase 5
export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface EmotionalState {
  valence: number;
  arousal: number;
  dominance: number;
  context: string;
  timestamp: number;
  triggers: string[];
}

interface PersonalitySettings {
  type: PersonalityType;
  waiterName: string;
  welcomeMessage: string;
  conversationTone: ConversationTone;
  responseStyle: ResponseStyle;
  specialtyKnowledge?: string;
  // Support for new template system
  template?: PersonalityConfig;
  useTemplate?: boolean;
}

interface CharacterState {
  // Current character state
  currentMood: CharacterMood;
  isInteracting: boolean;
  isLoaded: boolean;
  lastStateChange: number;
  
  // Personality configuration
  personalitySettings: PersonalitySettings;
  selectedPersonality: PersonalityType;
  waiterSettings: PersonalitySettings;
  
  // Animation state
  animationQueue: CharacterMood[];
  isAnimating: boolean;
  
  // Context awareness
  conversationContext: string[];
  lastUserMessage: string;
  
  // Phase 5 enhancements
  personalityTraits: PersonalityTraits | null;
  emotionalState: EmotionalState | null;
  learningEnabled: boolean;
  
  // Actions
  setMood: (mood: CharacterMood) => void;
  setInteracting: (interacting: boolean) => void;
  setLoaded: (loaded: boolean) => void;
  updatePersonality: (personality: Partial<PersonalitySettings>) => void;
  setPersonality: (personality: PersonalityType) => void;
  updateWaiterSettings: (settings: Partial<PersonalitySettings>) => void;
  queueAnimation: (mood: CharacterMood) => void;
  processAnimationQueue: () => CharacterMood | null;
  addConversationContext: (context: string) => void;
  setLastUserMessage: (message: string) => void;
  getPersonalityPrompt: () => string;
  
  // Phase 5 enhanced actions
  updatePersonalityTraits: (traits: PersonalityTraits) => void;
  updateEmotionalState: (state: EmotionalState) => void;
  enableLearning: (enabled: boolean) => void;
  getEmotionalContext: () => string;
  reset: () => void;
}

const defaultPersonalitySettings: PersonalitySettings = {
  type: 'FRIENDLY',
  waiterName: 'Waiter',
  welcomeMessage: 'Hello! How can I assist you today?',
  conversationTone: 'BALANCED',
  responseStyle: 'HELPFUL',
  specialtyKnowledge: '',
};

export const useCharacterStore = create<CharacterState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentMood: 'idle',
      isInteracting: false,
      isLoaded: false,
      lastStateChange: Date.now(),
      personalitySettings: defaultPersonalitySettings,
      selectedPersonality: 'FRIENDLY',
      waiterSettings: defaultPersonalitySettings,
      animationQueue: [],
      isAnimating: false,
      conversationContext: [],
      lastUserMessage: '',
      
      // Phase 5 enhancements
      personalityTraits: null,
      emotionalState: null,
      learningEnabled: true,

      // Actions
      setMood: (mood: CharacterMood) => {
        set((state) => ({
          currentMood: mood,
          lastStateChange: Date.now(),
        }), false, 'setMood');
      },

      setInteracting: (interacting: boolean) => {
        set({ isInteracting: interacting }, false, 'setInteracting');
      },

      setLoaded: (loaded: boolean) => {
        set({ isLoaded: loaded }, false, 'setLoaded');
      },

      updatePersonality: (personality: Partial<PersonalitySettings>) => {
        set((state) => ({
          personalitySettings: {
            ...state.personalitySettings,
            ...personality,
          },
        }), false, 'updatePersonality');
      },

      setPersonality: (personality: PersonalityType) => {
        set((state) => ({
          selectedPersonality: personality,
          personalitySettings: {
            ...state.personalitySettings,
            type: personality,
          },
        }), false, 'setPersonality');
      },

      updateWaiterSettings: (settings: Partial<PersonalitySettings>) => {
        set((state) => ({
          waiterSettings: {
            ...state.waiterSettings,
            ...settings,
          },
        }), false, 'updateWaiterSettings');
      },

      queueAnimation: (mood: CharacterMood) => {
        set((state) => ({
          animationQueue: [...state.animationQueue, mood],
        }), false, 'queueAnimation');
      },

      processAnimationQueue: () => {
        const state = get();
        if (state.animationQueue.length === 0 || state.isAnimating) {
          return null;
        }

        const nextMood = state.animationQueue[0];
        set((state) => ({
          animationQueue: state.animationQueue.slice(1),
          isAnimating: true,
          currentMood: nextMood,
          lastStateChange: Date.now(),
        }), false, 'processAnimationQueue');

        // Auto-reset animation state after 2 seconds
        setTimeout(() => {
          set({ isAnimating: false }, false, 'resetAnimation');
        }, 2000);

        return nextMood;
      },

      addConversationContext: (context: string) => {
        set((state) => ({
          conversationContext: [
            ...state.conversationContext.slice(-4), // Keep last 5 contexts
            context,
          ],
        }), false, 'addConversationContext');
      },

      setLastUserMessage: (message: string) => {
        set({ lastUserMessage: message }, false, 'setLastUserMessage');
      },

      getPersonalityPrompt: () => {
        const state = get();
        const { personalitySettings, conversationContext, lastUserMessage, personalityTraits, emotionalState } = state;
        
        // Check if using new template system
        if (personalitySettings.useTemplate && personalitySettings.template) {
          const template = personalitySettings.template;
          
          let prompt = `You are ${personalitySettings.waiterName}, a waiter/waitress with the ${template.name} personality. `;
          prompt += `${template.description || ''}. `;
          prompt += `Your conversation tone is ${template.tone} `;
          prompt += `and your response style is ${template.responseStyle}. `;

          if (personalitySettings.specialtyKnowledge) {
            prompt += `You have special knowledge about: ${personalitySettings.specialtyKnowledge}. `;
          }

          // Phase 5 enhancements: Add personality traits context
          if (personalityTraits) {
            prompt += `\n\nYour personality traits (1-10 scale): `;
            prompt += `Openness: ${personalityTraits.openness}, `;
            prompt += `Conscientiousness: ${personalityTraits.conscientiousness}, `;
            prompt += `Extraversion: ${personalityTraits.extraversion}, `;
            prompt += `Agreeableness: ${personalityTraits.agreeableness}, `;
            prompt += `Neuroticism: ${personalityTraits.neuroticism}. `;
          }

          // Add emotional state context
          if (emotionalState) {
            const moodDesc = emotionalState.valence > 0 ? 'positive' : emotionalState.valence < 0 ? 'negative' : 'neutral';
            const energyDesc = emotionalState.arousal > 7 ? 'high energy' : emotionalState.arousal < 4 ? 'low energy' : 'moderate energy';
            prompt += `Current emotional state: ${moodDesc} mood with ${energyDesc}. `;
            
            if (emotionalState.triggers.length > 0) {
              prompt += `Recent emotional triggers: ${emotionalState.triggers.join(', ')}. `;
            }
          }

          if (conversationContext.length > 0) {
            prompt += `Recent conversation context: ${conversationContext.join(', ')}. `;
          }

          if (lastUserMessage) {
            prompt += `The customer just said: "${lastUserMessage}". `;
          }

          prompt += `Respond authentically based on your personality template and current emotional state. Suggest appropriate menu items when relevant.`;

          return prompt;
        } else {
          // Legacy personality system
          const personalityDescriptions = {
            FRIENDLY: 'warm, welcoming, and approachable with a genuine smile',
            PROFESSIONAL: 'courteous, efficient, and knowledgeable with formal service',
            CASUAL: 'relaxed, laid-back, and conversational with a friendly demeanor',
            ENTHUSIASTIC: 'energetic, excited, and passionate about food and service',
          };

          const toneDescriptions = {
            FORMAL: 'using proper etiquette and formal language',
            BALANCED: 'maintaining a professional yet friendly tone',
            CASUAL: 'speaking in a relaxed and conversational manner',
          };

          const styleDescriptions = {
            HELPFUL: 'providing detailed assistance and guidance',
            CONCISE: 'giving brief, to-the-point responses',
            DETAILED: 'offering comprehensive explanations and options',
            PLAYFUL: 'adding humor and personality to interactions',
          };

          let prompt = `You are ${personalitySettings.waiterName}, a ${personalityDescriptions[personalitySettings.type]} waiter/waitress. `;
          prompt += `Your conversation style is ${toneDescriptions[personalitySettings.conversationTone]} `;
          prompt += `while ${styleDescriptions[personalitySettings.responseStyle]}. `;

          if (personalitySettings.specialtyKnowledge) {
            prompt += `You have special knowledge about: ${personalitySettings.specialtyKnowledge}. `;
          }

          // Phase 5 enhancements: Add personality traits context
          if (personalityTraits) {
            prompt += `\n\nYour personality traits (1-10 scale): `;
            prompt += `Openness: ${personalityTraits.openness}, `;
            prompt += `Conscientiousness: ${personalityTraits.conscientiousness}, `;
            prompt += `Extraversion: ${personalityTraits.extraversion}, `;
            prompt += `Agreeableness: ${personalityTraits.agreeableness}, `;
            prompt += `Neuroticism: ${personalityTraits.neuroticism}. `;
          }

          // Add emotional state context
          if (emotionalState) {
            const moodDesc = emotionalState.valence > 0 ? 'positive' : emotionalState.valence < 0 ? 'negative' : 'neutral';
            const energyDesc = emotionalState.arousal > 7 ? 'high energy' : emotionalState.arousal < 4 ? 'low energy' : 'moderate energy';
            prompt += `Current emotional state: ${moodDesc} mood with ${energyDesc}. `;
            
            if (emotionalState.triggers.length > 0) {
              prompt += `Recent emotional triggers: ${emotionalState.triggers.join(', ')}. `;
            }
          }

          if (conversationContext.length > 0) {
            prompt += `Recent conversation context: ${conversationContext.join(', ')}. `;
          }

          if (lastUserMessage) {
            prompt += `The customer just said: "${lastUserMessage}". `;
          }

          prompt += `Respond authentically based on your personality traits and current emotional state. Suggest appropriate menu items when relevant.`;

          return prompt;
        }
      },
      
      // Phase 5 enhanced actions
      updatePersonalityTraits: (traits: PersonalityTraits) => {
        set({ personalityTraits: traits }, false, 'updatePersonalityTraits');
      },

      updateEmotionalState: (state: EmotionalState) => {
        set({ emotionalState: state }, false, 'updateEmotionalState');
      },

      enableLearning: (enabled: boolean) => {
        set({ learningEnabled: enabled }, false, 'enableLearning');
      },

      getEmotionalContext: () => {
        const state = get();
        if (!state.emotionalState) return 'neutral';
        
        const { valence, arousal, dominance, context, triggers } = state.emotionalState;
        
        let emotionalContext = context;
        if (valence > 5) emotionalContext += ', positive';
        if (valence < -3) emotionalContext += ', negative';
        if (arousal > 7) emotionalContext += ', excited';
        if (arousal < 3) emotionalContext += ', calm';
        if (dominance > 7) emotionalContext += ', confident';
        if (dominance < 3) emotionalContext += ', humble';
        
        if (triggers.length > 0) {
          emotionalContext += `, influenced by: ${triggers.join(', ')}`;
        }
        
        return emotionalContext;
      },

      reset: () => {
        set({
          currentMood: 'idle',
          isInteracting: false,
          isLoaded: false,
          lastStateChange: Date.now(),
          animationQueue: [],
          isAnimating: false,
          conversationContext: [],
          lastUserMessage: '',
          personalitySettings: defaultPersonalitySettings,
          // Phase 5 reset
          personalityTraits: null,
          emotionalState: null,
          learningEnabled: true,
        }, false, 'reset');
      },
    }),
    {
      name: 'character-store',
      partialize: (state) => ({
        personalitySettings: state.personalitySettings,
        conversationContext: state.conversationContext,
      }),
    }
  )
);

// Utility functions for character behavior
export const getCharacterStateFromMessage = (message: string): CharacterMood => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('welcome')) {
    return 'greeting';
  }
  
  if (lowerMessage.includes('order') || lowerMessage.includes('food') || lowerMessage.includes('menu')) {
    return 'serving';
  }
  
  if (lowerMessage.includes('think') || lowerMessage.includes('consider') || lowerMessage.includes('hmm')) {
    return 'thinking';
  }
  
  if (lowerMessage.includes('thank') || lowerMessage.includes('great') || lowerMessage.includes('perfect')) {
    return 'happy';
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('question') || lowerMessage.includes('what')) {
    return 'attentive';
  }
  
  return 'idle';
};

export const getPersonalityBasedResponse = (
  personality: PersonalityType,
  mood: CharacterMood
): string => {
  const responses = {
    FRIENDLY: {
      greeting: "Hello there! Welcome to our restaurant! I'm so happy to see you today!",
      serving: "I'd love to help you find something delicious! What sounds good to you?",
      thinking: "Hmm, let me think about the perfect recommendation for you...",
      happy: "Wonderful choice! I'm so excited for you to try that!",
      attentive: "I'm here to help! What can I do for you?",
      idle: "I'm here whenever you need me! Just let me know how I can help.",
    },
    PROFESSIONAL: {
      greeting: "Good day and welcome. I am pleased to assist you with your dining experience.",
      serving: "May I recommend some of our finest selections from today's menu?",
      thinking: "Allow me a moment to consider the best options for your preferences.",
      happy: "An excellent choice. I believe you will find it most satisfactory.",
      attentive: "How may I be of service to you today?",
      idle: "I remain at your service for any assistance you may require.",
    },
    CASUAL: {
      greeting: "Hey there! Welcome in! Hope you're having a great day!",
      serving: "So, what's catching your eye on the menu? I can point you toward some favorites!",
      thinking: "Let me see... I think I know just the thing for you!",
      happy: "Nice pick! That's one of my personal favorites actually!",
      attentive: "What's up? Need some help with anything?",
      idle: "Just hanging out here if you need anything! No rush at all.",
    },
    ENTHUSIASTIC: {
      greeting: "Welcome, welcome! This is going to be AMAZING! I can't wait to help you!",
      serving: "Oh my goodness, we have SO many incredible options! You're going to love this!",
      thinking: "Ooh, I'm getting excited just thinking about all the possibilities!",
      happy: "YES! That's going to be absolutely fantastic! Great choice!",
      attentive: "I'm SO ready to help! What can I do for you? This is going to be great!",
      idle: "I'm buzzing with excitement to help you! Just say the word!",
    },
  };

  return responses[personality]?.[mood] || responses.FRIENDLY[mood];
};