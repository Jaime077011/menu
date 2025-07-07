import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { RiveWaiterCharacter } from '../components/rive/RiveWaiterCharacter';
import { PersonalityEngine, type PersonalityTraits, type EmotionalState, type PersonalityResponse } from '../components/character/PersonalityEngine';
import { CharacterStateManager, type AnimationSequence } from '../components/character/CharacterStateManager';
import { useCharacterStore } from '../stores/characterStore';

interface TestPhase5Props {
  restaurantId: string;
}

const TestPhase5: React.FC<TestPhase5Props> = ({ restaurantId }) => {
  const [selectedPersonality, setSelectedPersonality] = useState<'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'ENTHUSIASTIC'>('FRIENDLY');
  const [waiterName, setWaiterName] = useState('Alex');
  const [testMessage, setTestMessage] = useState('Hello! I\'m looking for something delicious.');
  const [currentTraits, setCurrentTraits] = useState<PersonalityTraits | null>(null);
  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(null);
  const [lastResponse, setLastResponse] = useState<PersonalityResponse | null>(null);
  const [isCharacterLoaded, setIsCharacterLoaded] = useState(false);
  const [currentSequence, setCurrentSequence] = useState<AnimationSequence | null>(null);
  
  const characterRef = useRef<any>(null);
  const personalityEngineRef = useRef<any>(null);
  const stateManagerRef = useRef<any>(null);

  const { 
    currentMood, 
    isInteracting, 
    personalitySettings,
    updatePersonality,
    setLastUserMessage,
    reset 
  } = useCharacterStore();

  // Personality options
  const personalities = ['FRIENDLY', 'PROFESSIONAL', 'CASUAL', 'ENTHUSIASTIC'] as const;
  
  // Test scenarios for different emotional triggers
  const testScenarios = [
    { name: 'Positive Feedback', message: 'This food is absolutely amazing! I love it!', triggers: ['positive'] },
    { name: 'Complaint', message: 'This is terrible. I hate the taste.', triggers: ['negative'] },
    { name: 'Urgent Request', message: 'I need this quickly! It\'s urgent!', triggers: ['urgency'] },
    { name: 'Confusion', message: 'I\'m confused. Can you help me understand?', triggers: ['confusion'] },
    { name: 'Dietary Concern', message: 'I\'m allergic to nuts. Is this vegan?', triggers: ['dietary'] },
    { name: 'Casual Chat', message: 'Hey, what\'s good here?', triggers: ['casual'] },
    { name: 'Formal Inquiry', message: 'Good evening. Could you recommend your finest dishes?', triggers: ['formal'] },
  ];

  // Animation test triggers
  const animationTriggers = [
    { name: 'Greeting', trigger: 'greeting', icon: '👋' },
    { name: 'Serving', trigger: 'serving', icon: '🍽️' },
    { name: 'Thinking', trigger: 'thinking', icon: '🤔' },
    { name: 'Happy', trigger: 'happy', icon: '😊' },
    { name: 'Surprised', trigger: 'surprise', icon: '😲' },
    { name: 'Empathetic', trigger: 'concern', icon: '🤗' },
  ];

  // Handle personality change
  const handlePersonalityChange = (personality: typeof selectedPersonality) => {
    setSelectedPersonality(personality);
    updatePersonality({ 
      type: personality,
      waiterName: waiterName,
    });
  };

  // Test personality response
  const testPersonalityResponse = async () => {
    if (window.generatePersonalityResponse) {
      setLastUserMessage(testMessage);
      const response = await window.generatePersonalityResponse(testMessage);
      setLastResponse(response);
      
      // Trigger appropriate animations based on response
      if (response.suggestedAnimations.length > 0 && window.triggerCharacterAnimation) {
        response.suggestedAnimations.forEach((animation, index) => {
          setTimeout(() => {
            window.triggerCharacterAnimation(animation);
          }, index * 1000);
        });
      }
    }
  };

  // Test animation trigger
  const testAnimation = (trigger: string) => {
    if (window.triggerCharacterAnimation) {
      window.triggerCharacterAnimation(trigger);
    }
  };

  // Handle trait updates
  const handleTraitsUpdate = (traits: PersonalityTraits) => {
    setCurrentTraits(traits);
  };

  // Handle emotional state changes
  const handleEmotionalStateChange = (state: EmotionalState) => {
    setEmotionalState(state);
  };

  // Handle animation sequence changes
  const handleAnimationStart = (sequence: AnimationSequence) => {
    setCurrentSequence(sequence);
  };

  const handleAnimationEnd = (sequence: AnimationSequence) => {
    setCurrentSequence(null);
  };

  return (
    <>
      <Head>
        <title>Phase 5: Character Personality System - Test Environment</title>
        <meta name="description" content="Testing enhanced character personality system with dynamic traits and emotional intelligence" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Settings Panel */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-4 left-4 right-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-bold text-white">🎭 Phase 5: Character Personality System</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-white/70">Waiter:</label>
                <input
                  type="text"
                  value={waiterName}
                  onChange={(e) => setWaiterName(e.target.value)}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400/50"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-white/70">Personality:</span>
              {personalities.map((personality) => (
                <motion.button
                  key={personality}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePersonalityChange(personality)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedPersonality === personality
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {personality === 'FRIENDLY' && '😊'} 
                  {personality === 'PROFESSIONAL' && '👔'} 
                  {personality === 'CASUAL' && '😎'} 
                  {personality === 'ENTHUSIASTIC' && '🎉'} 
                  {personality}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="pt-24 h-screen flex">
          {/* Character Display */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-1/3 min-w-[400px] p-6 flex flex-col"
          >
            <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Character Display</h2>
                  <div className="text-sm text-white/60">
                    Mood: <span className="text-blue-300 capitalize">{currentMood}</span>
                  </div>
                </div>
                
                <div className="flex-1 relative min-h-[400px]">
                  <RiveWaiterCharacter
                    ref={characterRef}
                    restaurantId={restaurantId}
                    personality={selectedPersonality}
                    waiterName={waiterName}
                    onLoadComplete={() => setIsCharacterLoaded(true)}
                    onError={(error) => {
                      console.error('Character error:', error);
                      setIsCharacterLoaded(false);
                    }}
                    className="w-full h-full"
                  />
                  
                  {/* Fallback Character Display */}
                  {!isCharacterLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-white/10">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="text-6xl mb-4"
                      >
                        🤖
                      </motion.div>
                      <h3 className="text-white font-semibold text-lg mb-2">{waiterName}</h3>
                      <p className="text-white/70 text-sm capitalize mb-4">{selectedPersonality.toLowerCase()} Personality</p>
                      <div className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
                        <span className="text-blue-200 text-xs">Character Preview</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Character State Manager */}
                  <CharacterStateManager
                    ref={stateManagerRef}
                    restaurantId={restaurantId}
                    personality={selectedPersonality}
                    emotionalState={emotionalState}
                    personalityTraits={currentTraits}
                    characterRef={characterRef}
                    onAnimationStart={handleAnimationStart}
                    onAnimationEnd={handleAnimationEnd}
                  />
                  
                  {/* Personality Engine */}
                  <PersonalityEngine
                    ref={personalityEngineRef}
                    restaurantId={restaurantId}
                    personality={selectedPersonality}
                    waiterName={waiterName}
                    onTraitsUpdate={handleTraitsUpdate}
                    onEmotionalStateChange={handleEmotionalStateChange}
                    onPersonalityResponse={setLastResponse}
                  />
                </div>

                {/* Current Sequence Indicator */}
                <AnimatePresence>
                  {currentSequence && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="mt-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg"
                    >
                      <div className="text-blue-200 text-sm font-medium">
                        Playing: {currentSequence.name}
                      </div>
                      <div className="text-blue-300/80 text-xs">
                        Duration: {(currentSequence.duration / 1000).toFixed(1)}s | Priority: {currentSequence.priority}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 flex flex-col p-6"
          >
            <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 flex flex-col space-y-4 overflow-y-auto"
            >
              {/* Personality Controls */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">🎭 Personality Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-white/80 text-sm font-medium mb-2 block">
                      Waiter Name
                    </label>
                    <input
                      type="text"
                      value={waiterName}
                      onChange={(e) => setWaiterName(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      placeholder="Enter waiter name"
                    />
                  </div>

                  <div>
                    <label className="text-white/80 text-sm font-medium mb-3 block">
                      Personality Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {personalities.map((personality) => (
                        <motion.button
                          key={personality}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handlePersonalityChange(personality)}
                          className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                            selectedPersonality === personality
                              ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                              : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {personality}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Animation Test Controls */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">🎬 Animation Tests</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {animationTriggers.map((trigger) => (
                    <motion.button
                      key={trigger.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => testAnimation(trigger.trigger)}
                      className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <span>{trigger.icon}</span>
                      {trigger.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Message Testing */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">💬 Response Testing</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-white/80 text-sm font-medium mb-2 block">
                      Test Message
                    </label>
                    <textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none text-sm"
                      rows={2}
                      placeholder="Enter a message to test personality response"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={testPersonalityResponse}
                    className="w-full p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 rounded-lg text-blue-200 font-medium transition-colors"
                  >
                    🧠 Test Personality Response
                  </motion.button>
                </div>

                {/* Quick Scenarios */}
                <div className="mt-3">
                  <label className="text-white/80 text-sm font-medium mb-2 block">
                    Quick Test Scenarios
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {testScenarios.map((scenario) => (
                      <button
                        key={scenario.name}
                        onClick={() => setTestMessage(scenario.message)}
                        className="w-full text-left p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/70 text-xs transition-colors"
                      >
                        <span className="font-medium text-white/90">{scenario.name}:</span> {scenario.message.substring(0, 50)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Data Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="w-1/3 min-w-[350px] p-6 flex flex-col"
          >
            <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 flex flex-col space-y-4 overflow-y-auto"
            >
              {/* Personality Traits */}
              {currentTraits && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">🧠 Personality Traits</h3>
                  
                  <div className="space-y-2">
                    {Object.entries(currentTraits).map(([trait, value]) => (
                      <div key={trait} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/80 capitalize">{trait}</span>
                          <span className="text-blue-300">{value}/10</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <motion.div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(value / 10) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotional State */}
              {emotionalState && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">❤️ Emotional State</h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-white/60">Valence:</span>
                        <div className="text-white font-medium">
                          {emotionalState.valence > 0 ? '😊' : emotionalState.valence < 0 ? '😔' : '😐'} 
                          {emotionalState.valence.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Arousal:</span>
                        <div className="text-white font-medium">
                          {emotionalState.arousal > 7 ? '⚡' : emotionalState.arousal < 4 ? '😴' : '🔋'} 
                          {emotionalState.arousal.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Dominance:</span>
                        <div className="text-white font-medium">
                          {emotionalState.dominance > 7 ? '💪' : emotionalState.dominance < 4 ? '🤲' : '👤'} 
                          {emotionalState.dominance.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Context:</span>
                        <div className="text-white font-medium capitalize">
                          {emotionalState.context}
                        </div>
                      </div>
                    </div>

                    {emotionalState.triggers.length > 0 && (
                      <div>
                        <span className="text-white/60 text-sm">Recent Triggers:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {emotionalState.triggers.map((trigger, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-400/30"
                            >
                              {trigger}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Last Response */}
              {lastResponse && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">💭 Last Response</h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="text-white/90 text-sm">{lastResponse.text}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-white/60">Tone:</span>
                        <div className="text-white capitalize">{lastResponse.tone}</div>
                      </div>
                      <div>
                        <span className="text-white/60">Confidence:</span>
                        <div className="text-white">{(lastResponse.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    {lastResponse.suggestedAnimations.length > 0 && (
                      <div>
                        <span className="text-white/60 text-sm">Suggested Animations:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lastResponse.suggestedAnimations.map((animation, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-400/30"
                            >
                              {animation}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {lastResponse.contextTags.length > 0 && (
                      <div>
                        <span className="text-white/60 text-sm">Context Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lastResponse.contextTags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-400/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={reset}
                className="w-full p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 font-medium transition-colors"
              >
                🔄 Reset All Systems
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 max-w-sm"
        >
          <h3 className="text-sm font-bold text-white mb-2">✨ Phase 5 Features</h3>
          <ul className="text-xs text-white/70 space-y-1">
            <li>• Big Five personality traits</li>
            <li>• Emotional intelligence system</li>
            <li>• Context-aware responses</li>
            <li>• Advanced animation sequences</li>
            <li>• Real-time trait visualization</li>
            <li>• Personality-driven behavior</li>
            <li>• Learning capabilities</li>
          </ul>
        </motion.div>

        {/* Status Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4"
        >
          <h3 className="text-sm font-bold text-white mb-2">📊 System Status</h3>
          <div className="text-xs text-white/70 space-y-1">
            <div className="flex justify-between">
              <span>Character:</span>
              <span className={isCharacterLoaded ? 'text-green-400' : 'text-yellow-400'}>
                {isCharacterLoaded ? '✅ Loaded' : '⏳ Loading'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Animation:</span>
              <span className={isInteracting ? 'text-blue-400' : 'text-gray-400'}>
                {isInteracting ? '🎬 Active' : '😴 Idle'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Personality:</span>
              <span className="text-purple-400 capitalize">
                🎭 {selectedPersonality.toLowerCase()}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      restaurantId: 'test-restaurant-phase5',
    },
  };
};

export default TestPhase5;