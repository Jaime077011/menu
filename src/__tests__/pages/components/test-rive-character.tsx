import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import RiveWaiterCharacter from '../components/rive/RiveWaiterCharacter';
import { useCharacterStore, type PersonalityType, type CharacterMood } from '../stores/characterStore';

const TestRiveCharacter: React.FC = () => {
  const characterRef = useRef<{ triggerState: (state: string) => boolean }>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityType>('FRIENDLY');
  const [waiterName, setWaiterName] = useState('Alex');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    currentMood, 
    isInteracting, 
    personalitySettings, 
    updatePersonality,
    reset 
  } = useCharacterStore();

  const personalities: PersonalityType[] = ['FRIENDLY', 'PROFESSIONAL', 'CASUAL', 'ENTHUSIASTIC'];
  const moods: CharacterMood[] = ['idle', 'greeting', 'serving', 'thinking', 'happy', 'attentive'];

  const handlePersonalityChange = (personality: PersonalityType) => {
    setSelectedPersonality(personality);
    updatePersonality({ 
      type: personality,
      waiterName: waiterName,
    });
  };

  const handleWaiterNameChange = (name: string) => {
    setWaiterName(name);
    updatePersonality({ waiterName: name });
  };

  const triggerMood = (mood: CharacterMood) => {
    if (characterRef.current) {
      const success = characterRef.current.triggerState(mood);
      console.log(`Triggered ${mood}: ${success ? 'Success' : 'Failed'}`);
    }
  };

  const handleLoadComplete = () => {
    setIsLoaded(true);
    setError(null);
    console.log('✅ Character loaded successfully!');
  };

  const handleError = (err: Error) => {
    setError(err.message);
    setIsLoaded(false);
    console.error('❌ Character error:', err);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🎭 Rive Character Test Lab
          </h1>
          <p className="text-white/70 text-lg">
            Test the new Rive-powered waiter character with different personalities and animations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Character Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
              <div className="h-[600px] w-full">
                <RiveWaiterCharacter
                  ref={characterRef}
                  restaurantId="test-restaurant"
                  personality={selectedPersonality}
                  waiterName={waiterName}
                  onLoadComplete={handleLoadComplete}
                  onError={handleError}
                  onStateChange={(state) => console.log('State changed:', state)}
                  className="w-full h-full"
                />
              </div>
              
              {/* Status Indicators */}
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isLoaded 
                    ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                }`}>
                  {isLoaded ? '✅ Loaded' : '⏳ Loading...'}
                </div>
                
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isInteracting 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                    : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                }`}>
                  {isInteracting ? '🎬 Animating' : '😴 Idle'}
                </div>
                
                <div className="px-4 py-2 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30 capitalize">
                  🎭 {currentMood}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg"
                >
                  <p className="text-red-300 text-sm">❌ {error}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Personality Controls */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">🎭 Personality</h3>
              
              <div className="space-y-3 mb-4">
                {personalities.map((personality) => (
                  <motion.button
                    key={personality}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePersonalityChange(personality)}
                    className={`w-full p-3 rounded-lg text-left font-medium transition-all ${
                      selectedPersonality === personality
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {personality}
                  </motion.button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">Waiter Name</label>
                <input
                  type="text"
                  value={waiterName}
                  onChange={(e) => handleWaiterNameChange(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                  placeholder="Enter waiter name..."
                />
              </div>
            </div>

            {/* Animation Controls */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">🎬 Animations</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {moods.map((mood) => (
                  <motion.button
                    key={mood}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => triggerMood(mood)}
                    disabled={!isLoaded}
                    className={`p-3 rounded-lg text-sm font-medium transition-all capitalize ${
                      currentMood === mood
                        ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                        : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {mood}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Character Info */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">ℹ️ Character Info</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-white/60">Name:</span>
                  <span className="text-white ml-2">{personalitySettings.waiterName}</span>
                </div>
                <div>
                  <span className="text-white/60">Personality:</span>
                  <span className="text-white ml-2">{personalitySettings.type}</span>
                </div>
                <div>
                  <span className="text-white/60">Tone:</span>
                  <span className="text-white ml-2">{personalitySettings.conversationTone}</span>
                </div>
                <div>
                  <span className="text-white/60">Style:</span>
                  <span className="text-white ml-2">{personalitySettings.responseStyle}</span>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="w-full p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-200 font-medium transition-colors"
            >
              🔄 Reset Character
            </motion.button>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">📋 Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/70">
            <div>
              <h4 className="font-medium text-white mb-2">🎭 Personality Types:</h4>
              <ul className="space-y-1 text-sm">
                <li><strong>FRIENDLY:</strong> Warm and welcoming</li>
                <li><strong>PROFESSIONAL:</strong> Formal and efficient</li>
                <li><strong>CASUAL:</strong> Relaxed and conversational</li>
                <li><strong>ENTHUSIASTIC:</strong> Energetic and excited</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">🎬 Animation States:</h4>
              <ul className="space-y-1 text-sm">
                <li><strong>Greeting:</strong> Welcome gestures</li>
                <li><strong>Serving:</strong> Food presentation</li>
                <li><strong>Thinking:</strong> Contemplative poses</li>
                <li><strong>Happy:</strong> Joyful expressions</li>
                <li><strong>Attentive:</strong> Focused listening</li>
                <li><strong>Idle:</strong> Neutral waiting state</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TestRiveCharacter;