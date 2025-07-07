import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { motion, AnimatePresence } from 'framer-motion';

interface RiveWaiterCharacterProps {
  restaurantId: string;
  personality?: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'ENTHUSIASTIC';
  waiterName?: string;
  className?: string;
  onStateChange?: (state: string) => void;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
  showNameBadge?: boolean;
  showGlassEffect?: boolean;
  showGlow?: boolean;
}

interface CharacterState {
  current: string;
  mood: 'idle' | 'greeting' | 'serving' | 'thinking' | 'happy' | 'attentive';
  isAnimating: boolean;
}

export const RiveWaiterCharacter: React.FC<RiveWaiterCharacterProps> = ({
  restaurantId,
  personality = 'FRIENDLY',
  waiterName = 'Waiter',
  className = '',
  onStateChange,
  onLoadComplete,
  onError,
  showNameBadge = true,
  showGlassEffect = true,
  showGlow = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [characterState, setCharacterState] = useState<CharacterState>({
    current: 'idle',
    mood: 'idle',
    isAnimating: false,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Early detection of potential Rive compatibility issues
  useEffect(() => {
    // Check for WebAssembly support
    if (typeof WebAssembly === 'undefined') {
      console.warn('⚠️ WebAssembly not supported, using fallback character');
      setUseFallback(true);
      setIsLoaded(true);
      setLoadError('WebAssembly not supported - using simplified character');
      onLoadComplete?.();
      return;
    }

    // Check for potential browser compatibility issues
    const userAgent = navigator.userAgent.toLowerCase();
    const isOldBrowser = userAgent.includes('trident') || // IE
                        userAgent.includes('edge/') && !userAgent.includes('edg/'); // Old Edge
    
    if (isOldBrowser) {
      console.warn('⚠️ Potentially incompatible browser detected, using fallback character');
      setUseFallback(true);
      setIsLoaded(true);
      setLoadError('Browser compatibility - using simplified character');
      onLoadComplete?.();
      return;
    }

    // Set a timeout to use fallback if Rive takes too long to load
    const loadTimeout = setTimeout(() => {
      if (!isLoaded && !useFallback) {
        console.warn('⚠️ Rive loading timeout, switching to fallback character');
        setUseFallback(true);
        setIsLoaded(true);
        setLoadError('Loading timeout - using simplified character');
        onLoadComplete?.();
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(loadTimeout);
  }, [isLoaded, useFallback, onLoadComplete]);

  // Fallback character component when Rive fails
  const FallbackCharacter = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl border border-white/10"
    >
      <div className="text-center">
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="text-6xl mb-4"
        >
          🍽️
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/80 text-lg font-semibold"
        >
          {waiterName}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/60 text-sm mt-1"
        >
          Your AI Waiter
        </motion.p>
      </div>
    </motion.div>
  );

  // Enhanced error handling with WASM-specific handling
  const handleRiveError = useCallback((error: any) => {
    console.error('❌ Rive error:', error);
    
    // Better error message extraction
    let errorMessage = 'Unknown error';
    try {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.toString() || JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
    } catch (e) {
      errorMessage = 'Error processing error message';
    }
    
    // Check if it's a WASM-related error
    const isWasmError = errorMessage.includes('table index is out of bounds') || 
                       errorMessage.includes('wasm') || 
                       errorMessage.includes('WASM') ||
                       errorMessage.includes('WebAssembly') ||
                       errorMessage.includes('RuntimeError');
    
    console.warn('🔍 Error analysis:', { errorMessage, isWasmError });
    
    if (isWasmError) {
      console.warn('⚠️ WASM error detected, using fallback character');
      setUseFallback(true);
      setIsLoaded(true); // Mark as "loaded" with fallback
      setLoadError('Using simplified character due to browser compatibility');
      onLoadComplete?.(); // Notify that character is ready (fallback)
    } else {
      console.warn('⚠️ Non-WASM error, using fallback character as safety measure');
      setUseFallback(true);
      setIsLoaded(true);
      setLoadError('Character animation unavailable - using simplified version');
      onLoadComplete?.();
    }
    
    // Always use fallback for any Rive error to ensure stability
    onError?.(new Error(errorMessage));
  }, [onError, onLoadComplete]);

  // Rive hook with enhanced error handling
  let rive, RiveComponent;
  
  try {
    const riveHook = useRive({
    src: '/assets/animations/rive/interactive_avatar.riv',
    stateMachines: ['State Machine 1'], // Default state machine name
    autoplay: true,
    onLoad: () => {
        try {
      console.log('✅ Rive character loaded successfully');
      setIsLoaded(true);
      setLoadError(null);
          setUseFallback(false);
      onLoadComplete?.();
      
      // Trigger welcome animation after a brief delay
      setTimeout(() => {
            try {
        triggerState('greeting');
            } catch (error) {
              console.warn('⚠️ Error triggering greeting animation:', error);
            }
      }, 500);
        } catch (error) {
          console.error('❌ Error in onLoad callback:', error);
          handleRiveError(error);
        }
      },
      onLoadError: handleRiveError,
    onStateChange: (event) => {
        try {
      console.log('🎭 Rive state changed:', event);
      onStateChange?.(event.data?.[0] || 'unknown');
        } catch (error) {
          console.warn('⚠️ Error in onStateChange callback:', error);
        }
    },
  });
    
    rive = riveHook.rive;
    RiveComponent = riveHook.RiveComponent;
  } catch (error) {
    console.error('❌ Error initializing Rive hook:', error);
    handleRiveError(error);
    rive = null;
    RiveComponent = null;
  }

  // State machine inputs for controlling animations
  const greetingTrigger = useStateMachineInput(rive, 'State Machine 1', 'greeting');
  const servingTrigger = useStateMachineInput(rive, 'State Machine 1', 'serving');
  const thinkingTrigger = useStateMachineInput(rive, 'State Machine 1', 'thinking');
  const happyTrigger = useStateMachineInput(rive, 'State Machine 1', 'happy');
  const idleTrigger = useStateMachineInput(rive, 'State Machine 1', 'idle');

  // Personality-driven animation mapping
  const getPersonalityAnimations = useCallback((mood: string) => {
    const animations = {
      FRIENDLY: {
        greeting: 'wave_friendly',
        serving: 'serve_with_smile',
        thinking: 'thoughtful_nod',
        happy: 'cheerful_bounce',
        idle: 'friendly_idle',
      },
      PROFESSIONAL: {
        greeting: 'formal_bow',
        serving: 'professional_serve',
        thinking: 'analytical_pose',
        happy: 'satisfied_nod',
        idle: 'professional_stance',
      },
      CASUAL: {
        greeting: 'casual_wave',
        serving: 'relaxed_serve',
        thinking: 'casual_scratch',
        happy: 'laid_back_smile',
        idle: 'casual_lean',
      },
      ENTHUSIASTIC: {
        greeting: 'excited_wave',
        serving: 'energetic_serve',
        thinking: 'eager_anticipation',
        happy: 'jumping_joy',
        idle: 'bouncy_idle',
      },
    };

    return animations[personality]?.[mood] || mood;
  }, [personality]);

  // Trigger character state with personality consideration
  const triggerState = useCallback((newState: string) => {
    if (useFallback) {
      // For fallback character, just update state without Rive animations
      setCharacterState(prev => ({
        ...prev,
        current: newState,
        mood: newState as any,
        isAnimating: true,
      }));
      
      setTimeout(() => {
        setCharacterState(prev => ({ ...prev, isAnimating: false }));
      }, 1000);
      
      console.log(`🎭 Fallback character state: ${newState}`);
      return true;
    }

    if (!rive || !isLoaded) {
      console.warn('⚠️ Cannot trigger state: Rive not loaded');
      return false;
    }

    try {
      setCharacterState(prev => ({ ...prev, isAnimating: true }));

      // Get personality-specific animation
      const animationName = getPersonalityAnimations(newState);
      
      // Trigger appropriate state machine input
      switch (newState) {
        case 'greeting':
          greetingTrigger?.fire();
          break;
        case 'serving':
          servingTrigger?.fire();
          break;
        case 'thinking':
          thinkingTrigger?.fire();
          break;
        case 'happy':
          happyTrigger?.fire();
          break;
        case 'idle':
        default:
          idleTrigger?.fire();
          break;
      }

      // Update character state
      setCharacterState(prev => ({
        ...prev,
        current: newState,
        mood: newState as any,
      }));

      // Reset animation state after duration
      setTimeout(() => {
        setCharacterState(prev => ({ ...prev, isAnimating: false }));
      }, 2000);

      console.log(`🎬 Triggered ${personality} character state: ${newState} -> ${animationName}`);
      return true;

    } catch (error) {
      console.error('❌ Error triggering character state:', error);
      setCharacterState(prev => ({ ...prev, isAnimating: false }));
      return false;
    }
  }, [rive, isLoaded, personality, getPersonalityAnimations, greetingTrigger, servingTrigger, thinkingTrigger, happyTrigger, idleTrigger, useFallback]);

  // Expose triggerState method to parent components
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).triggerState = triggerState;
    }
  }, [triggerState]);

  // Global error handler for WASM errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error || event.message;
      let errorString = '';
      
      try {
        if (typeof error === 'string') {
          errorString = error;
        } else if (error && typeof error === 'object') {
          errorString = error.message || error.toString() || JSON.stringify(error);
        } else {
          errorString = String(error);
        }
      } catch (e) {
        errorString = 'Unknown error';
      }
      
      const isRiveError = errorString.includes('table index is out of bounds') || 
          errorString.includes('wasm') || 
          errorString.includes('WASM') ||
          errorString.includes('WebAssembly') ||
          errorString.includes('RuntimeError') ||
          errorString.includes('@rive-app') ||
          event.filename?.includes('rive');
      
      if (isRiveError) {
        console.warn('⚠️ Global Rive/WASM error caught, switching to fallback');
        console.warn('🔍 Error details:', { errorString, filename: event.filename, lineno: event.lineno });
        event.preventDefault(); // Prevent error from crashing the app
        event.stopPropagation(); // Stop error propagation
        
        setUseFallback(true);
        setIsLoaded(true);
        setLoadError('Browser compatibility issue - using simplified character');
        onLoadComplete?.();
        return true;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      let errorString = '';
      
      try {
        if (typeof reason === 'string') {
          errorString = reason;
        } else if (reason && typeof reason === 'object') {
          errorString = reason.message || reason.toString() || JSON.stringify(reason);
        } else {
          errorString = String(reason);
        }
      } catch (e) {
        errorString = 'Unknown promise rejection';
      }
      
      const isRiveError = errorString.includes('table index is out of bounds') || 
          errorString.includes('wasm') || 
          errorString.includes('WASM') ||
          errorString.includes('WebAssembly') ||
          errorString.includes('RuntimeError') ||
          errorString.includes('@rive-app');
      
      if (isRiveError) {
        console.warn('⚠️ Global Rive promise rejection caught, switching to fallback');
        console.warn('🔍 Rejection details:', { errorString });
        event.preventDefault(); // Prevent unhandled rejection
        
        setUseFallback(true);
        setIsLoaded(true);
        setLoadError('Browser compatibility issue - using simplified character');
        onLoadComplete?.();
      }
    };

    // Add global error listeners
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Cleanup
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onLoadComplete]);

  // Loading state component
  const LoadingState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm rounded-2xl"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-3 border-blue-400/30 border-t-blue-400 rounded-full mb-4"
      />
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-white/80 text-sm font-medium"
      >
        Loading {waiterName}...
      </motion.p>
    </motion.div>
  );

  // Error state component
  const ErrorState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-900/50 to-red-800/50 backdrop-blur-sm rounded-2xl"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4"
      >
        <span className="text-red-400 text-2xl">⚠️</span>
      </motion.div>
      <p className="text-red-200 text-sm font-medium mb-2">Character Unavailable</p>
      <p className="text-red-300/70 text-xs text-center px-4 mb-4">{loadError}</p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 text-sm font-medium transition-colors"
      >
        Retry
      </motion.button>
    </motion.div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
    >
      {/* Character Container with Glow Effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: isLoaded ? 1 : 0.7, 
          scale: isLoaded ? 1 : 0.95,
        }}
        transition={{ duration: 0.5 }}
        className="relative w-full h-full"
      >
        {/* Animated Background Glow */}
        {showGlow && (
          <motion.div
            animate={{
              background: [
                'conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.1), transparent, rgba(147, 51, 234, 0.1), transparent)',
                'conic-gradient(from 180deg, transparent, rgba(147, 51, 234, 0.1), transparent, rgba(59, 130, 246, 0.1), transparent)',
                'conic-gradient(from 360deg, transparent, rgba(59, 130, 246, 0.1), transparent, rgba(147, 51, 234, 0.1), transparent)',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-3xl opacity-60"
          />
        )}

        {/* Character State Indicator */}
        <AnimatePresence>
          {characterState.isAnimating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4 z-10"
            >
              <div className="px-3 py-1 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full">
                <span className="text-blue-200 text-xs font-medium capitalize">
                  {characterState.mood}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rive Character Canvas or Fallback */}
        <div className={`relative w-full h-full rounded-2xl overflow-hidden ${showGlassEffect ? 'bg-gradient-to-br from-slate-900/20 to-slate-800/20 backdrop-blur-sm' : ''}`}>
          {useFallback ? (
            <FallbackCharacter />
          ) : RiveComponent ? (
            <RiveComponent
              className="w-full h-full"
              style={{
                filter: isLoaded 
                  ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))' 
                  : 'grayscale(100%) opacity(50%)',
                transition: 'filter 0.5s ease',
              }}
            />
          ) : null}
        </div>

        {/* Loading and Error States */}
        <AnimatePresence>
          {!useFallback && !isLoaded && !loadError && <LoadingState />}
          {!useFallback && loadError && <ErrorState />}
        </AnimatePresence>
      </motion.div>

      {/* Character Name Badge */}
      {showNameBadge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        >
          <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
            <span className="text-blue-600 text-lg font-bold">{waiterName}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RiveWaiterCharacter;