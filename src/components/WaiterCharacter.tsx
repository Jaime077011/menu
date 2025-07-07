import { useState, useEffect } from "react";

interface WaiterCharacterProps {
  mood?: 'idle' | 'talking' | 'thinking' | 'happy' | 'attentive';
  size?: 'small' | 'medium' | 'large';
  restaurantName?: string;
  waiterName?: string;
  personality?: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'ENTHUSIASTIC';
}

export function WaiterCharacter({ 
  mood = 'idle', 
  size = 'medium',
  restaurantName = "Restaurant",
  waiterName = "Waiter",
  personality = 'FRIENDLY'
}: WaiterCharacterProps) {
  const [currentAnimation, setCurrentAnimation] = useState(mood);

  // Update animation when mood changes
  useEffect(() => {
    setCurrentAnimation(mood);
  }, [mood]);

  // Size classes
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16', 
    large: 'w-24 h-24'
  };

  // Animation classes based on mood
  const animationClasses = {
    idle: 'animate-pulse',
    talking: 'animate-bounce',
    thinking: 'animate-pulse',
    happy: 'animate-bounce',
    attentive: 'animate-pulse'
  };

  // Character emoji based on mood and personality
  const getCharacterEmoji = () => {
    const baseEmojis = {
      idle: '👨‍🍳',
      talking: '😊',
      thinking: '🤔',
      happy: '😄',
      attentive: '👂'
    };

    // Personality-based emoji variations
    const personalityEmojis = {
      FRIENDLY: baseEmojis,
      PROFESSIONAL: {
        idle: '👔',
        talking: '😊',
        thinking: '🤔',
        happy: '😌',
        attentive: '👓'
      },
      CASUAL: {
        idle: '🙋‍♂️',
        talking: '😎',
        thinking: '🤔',
        happy: '😄',
        attentive: '👍'
      },
      ENTHUSIASTIC: {
        idle: '🤩',
        talking: '😍',
        thinking: '💭',
        happy: '🎉',
        attentive: '✨'
      }
    };

    return personalityEmojis[personality][currentAnimation];
  };

  // Background color based on mood and personality
  const getBackgroundColor = () => {
    const baseColors = {
      idle: 'bg-gray-100',
      talking: 'bg-blue-100',
      thinking: 'bg-yellow-100', 
      happy: 'bg-green-100',
      attentive: 'bg-purple-100'
    };

    // Personality-based color variations
    const personalityColors = {
      FRIENDLY: baseColors,
      PROFESSIONAL: {
        idle: 'bg-slate-100',
        talking: 'bg-blue-100',
        thinking: 'bg-amber-100',
        happy: 'bg-emerald-100',
        attentive: 'bg-indigo-100'
      },
      CASUAL: {
        idle: 'bg-orange-100',
        talking: 'bg-cyan-100',
        thinking: 'bg-yellow-100',
        happy: 'bg-lime-100',
        attentive: 'bg-pink-100'
      },
      ENTHUSIASTIC: {
        idle: 'bg-rose-100',
        talking: 'bg-purple-100',
        thinking: 'bg-teal-100',
        happy: 'bg-emerald-100',
        attentive: 'bg-violet-100'
      }
    };

    return personalityColors[personality][currentAnimation];
  };

  // Badge color based on personality
  const getBadgeColor = () => {
    const badgeColors = {
      FRIENDLY: 'bg-indigo-600',
      PROFESSIONAL: 'bg-slate-600',
      CASUAL: 'bg-orange-600', 
      ENTHUSIASTIC: 'bg-purple-600'
    };
    return badgeColors[personality];
  };

  return (
    <div className="flex flex-col items-center">
      {/* Character Avatar */}
      <div 
        className={`
          ${sizeClasses[size]} 
          ${getBackgroundColor()}
          ${animationClasses[currentAnimation]}
          rounded-full 
          flex items-center justify-center 
          transition-all duration-300 ease-in-out
          border-2 border-indigo-200
          shadow-lg
        `}
      >
        <span className="text-2xl">
          {getCharacterEmoji()}
        </span>
      </div>

      {/* Character Name Badge */}
      <div className={`mt-2 px-3 py-1 ${getBadgeColor()} text-white text-xs rounded-full shadow-sm`}>
        {waiterName}
      </div>

      {/* Mood Indicator */}
      <div className="mt-1 text-xs text-gray-500 capitalize">
        {currentAnimation}
      </div>
    </div>
  );
}

// Waiter Character with Speech Bubble
interface WaiterWithSpeechProps extends WaiterCharacterProps {
  message?: string;
  isTyping?: boolean;
  htmlContent?: boolean;
  conversationTone?: 'FORMAL' | 'BALANCED' | 'CASUAL';
}

export function WaiterWithSpeech({ 
  message, 
  isTyping = false,
  htmlContent = false,
  conversationTone = 'BALANCED',
  ...characterProps 
}: WaiterWithSpeechProps) {
  // Speech bubble styling based on conversation tone
  const getSpeechBubbleStyle = () => {
    const styles = {
      FORMAL: 'bg-white border-gray-300 shadow-md',
      BALANCED: 'bg-white border-gray-200 shadow-md',
      CASUAL: 'bg-blue-50 border-blue-200 shadow-sm'
    };
    return styles[conversationTone];
  };

  return (
    <div className="flex items-start space-x-3 max-w-md">
      {/* Character */}
      <div className="flex-shrink-0">
        <WaiterCharacter 
          {...characterProps}
          mood={isTyping ? 'thinking' : characterProps.mood}
        />
      </div>

      {/* Speech Bubble */}
      {(message || isTyping) && (
        <div className="flex-1">
          <div className={`${getSpeechBubbleStyle()} rounded-lg border p-3 relative`}>
            {/* Speech bubble arrow */}
            <div className="absolute left-0 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent -ml-2"></div>
            
            {/* Message content */}
            {isTyping ? (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            ) : htmlContent && message ? (
              <div 
                className="text-gray-800 text-sm whitespace-pre-wrap message-content"
                dangerouslySetInnerHTML={{ __html: message }}
              />
            ) : (
              <p className="text-gray-800 text-sm whitespace-pre-wrap">{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 