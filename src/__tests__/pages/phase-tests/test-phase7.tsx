import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/utils/api';

// Import components we'll enhance with error boundaries
import RiveWaiterCharacter from '@/components/rive/RiveWaiterCharacter';
import { useCharacterStore } from '@/stores/characterStore';

// Test scenarios for error handling
const ERROR_SCENARIOS = [
  { id: 'network', name: 'Network Error', description: 'Simulate network failure' },
  { id: 'validation', name: 'Validation Error', description: 'Test input validation' },
  { id: 'server', name: 'Server Error', description: 'Simulate server crash' },
  { id: 'character', name: 'Character Error', description: 'Test Rive character failure' },
  { id: 'memory', name: 'Memory Error', description: 'Test memory leak scenarios' },
];

// Loading state scenarios
const LOADING_SCENARIOS = [
  { id: 'fast', name: 'Fast Loading', duration: 500, description: 'Quick response simulation' },
  { id: 'normal', name: 'Normal Loading', duration: 2000, description: 'Typical response time' },
  { id: 'slow', name: 'Slow Loading', duration: 5000, description: 'Slow network simulation' },
  { id: 'timeout', name: 'Timeout', duration: 10000, description: 'Request timeout test' },
];

// Input validation test cases
const VALIDATION_TESTS = [
  { field: 'message', value: '', expected: 'required', description: 'Empty message' },
  { field: 'message', value: 'a'.repeat(501), expected: 'too_long', description: 'Message too long' },
  { field: 'tableNumber', value: 0, expected: 'min_value', description: 'Table number too low' },
  { field: 'tableNumber', value: 1000, expected: 'max_value', description: 'Table number too high' },
  { field: 'restaurantId', value: '', expected: 'required', description: 'Missing restaurant ID' },
];

const TestPhase7: NextPage = () => {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Character store for testing
  const { 
    selectedPersonality, 
    setPersonality, 
    waiterSettings,
    updateWaiterSettings 
  } = useCharacterStore();

  // Test form state
  const [testMessage, setTestMessage] = useState('Hello, I would like to order a pizza');
  const [testTableNumber, setTestTableNumber] = useState(5);
  const [testRestaurantId, setTestRestaurantId] = useState('test-restaurant');

  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    apiResponseTime: 0,
    characterLoadTime: 0,
    memoryUsage: 0,
  });

  // Monitor performance
  useEffect(() => {
    const startTime = performance.now();
    
    const updateMetrics = () => {
      const renderTime = performance.now() - startTime;
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime),
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
      }));
    };

    const timer = setTimeout(updateMetrics, 100);
    return () => clearTimeout(timer);
  }, []);

  // Test error boundary functionality
  const triggerError = (scenario: string) => {
    setActiveTest(scenario);
    setErrorState(null);
    
    try {
      switch (scenario) {
        case 'network':
          // Simulate network error
          throw new Error('Network request failed');
        case 'validation':
          // Test validation
          validateInputs();
          break;
        case 'server':
          // Simulate server error
          throw new Error('Internal server error');
        case 'character':
          // Test character error
          setErrorState('Character failed to load');
          break;
        case 'memory':
          // Simulate memory issue
          const largeArray = new Array(1000000).fill('test');
          console.log('Memory test:', largeArray.length);
          break;
        default:
          break;
      }
    } catch (error) {
      setErrorState(error instanceof Error ? error.message : 'Unknown error');
      setTestResults(prev => ({
        ...prev,
        [scenario]: { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }));
    }
  };

  // Test loading states
  const testLoadingState = async (scenario: { id: string; duration: number }) => {
    setActiveTest(scenario.id);
    setIsLoading(true);
    
    const startTime = performance.now();
    
    try {
      await new Promise(resolve => setTimeout(resolve, scenario.duration));
      const responseTime = performance.now() - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [scenario.id]: { success: true, responseTime: Math.round(responseTime) }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [scenario.id]: { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }));
    } finally {
      setIsLoading(false);
      setActiveTest(null);
    }
  };

  // Validate inputs
  const validateInputs = () => {
    const errors: Record<string, string> = {};
    
    if (!testMessage.trim()) {
      errors.message = 'Message is required';
    } else if (testMessage.length > 500) {
      errors.message = 'Message is too long (max 500 characters)';
    }
    
    if (testTableNumber < 1) {
      errors.tableNumber = 'Table number must be at least 1';
    } else if (testTableNumber > 999) {
      errors.tableNumber = 'Table number must be less than 1000';
    }
    
    if (!testRestaurantId.trim()) {
      errors.restaurantId = 'Restaurant ID is required';
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      throw new Error('Validation failed');
    }
    
    setTestResults(prev => ({
      ...prev,
      validation: { success: true, message: 'All validations passed' }
    }));
  };

  // Clear test results
  const clearResults = () => {
    setTestResults({});
    setErrorState(null);
    setValidationErrors({});
    setActiveTest(null);
  };

  return (
    <>
      <Head>
        <title>Phase 7: Polish & Deployment Testing</title>
        <meta name="description" content="Testing production readiness features" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Phase 7: Polish & Deployment
                </h1>
                <p className="text-slate-400 mt-1">Production readiness testing environment</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-300">System Online</span>
                  </div>
                  <div className="text-slate-400">
                    Render: {performanceMetrics.renderTime}ms
                  </div>
                  <div className="text-slate-400">
                    Memory: {performanceMetrics.memoryUsage}MB
                  </div>
                </div>
                
                <button
                  onClick={clearResults}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Clear Results
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Panel - Test Controls */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Error Handling Tests */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center mr-3">
                    🛡️
                  </span>
                  Error Handling Tests
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ERROR_SCENARIOS.map((scenario) => (
                    <motion.button
                      key={scenario.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => triggerError(scenario.id)}
                      disabled={activeTest === scenario.id}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        activeTest === scenario.id
                          ? 'bg-red-500/20 border-red-500/50 text-red-300'
                          : testResults[scenario.id]?.success === false
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : testResults[scenario.id]?.success === true
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="font-medium">{scenario.name}</div>
                      <div className="text-sm opacity-70 mt-1">{scenario.description}</div>
                      {testResults[scenario.id] && (
                        <div className="text-xs mt-2 font-mono">
                          {testResults[scenario.id].success ? '✅ Handled' : `❌ ${testResults[scenario.id].error}`}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Loading State Tests */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                    ⏳
                  </span>
                  Loading State Tests
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {LOADING_SCENARIOS.map((scenario) => (
                    <motion.button
                      key={scenario.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => testLoadingState(scenario)}
                      disabled={isLoading && activeTest === scenario.id}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        isLoading && activeTest === scenario.id
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                          : testResults[scenario.id]?.success
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="font-medium">{scenario.name}</div>
                      <div className="text-sm opacity-70 mt-1">{scenario.description}</div>
                      {isLoading && activeTest === scenario.id && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-blue-400">Testing...</span>
                        </div>
                      )}
                      {testResults[scenario.id] && (
                        <div className="text-xs mt-2 font-mono text-green-400">
                          ✅ {testResults[scenario.id].responseTime}ms
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Input Validation Tests */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-3">
                    ✅
                  </span>
                  Input Validation Tests
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Test Message
                      </label>
                      <input
                        type="text"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${
                          validationErrors.message
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-600 focus:ring-blue-500'
                        }`}
                        placeholder="Enter test message"
                      />
                      {validationErrors.message && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Table Number
                      </label>
                      <input
                        type="number"
                        value={testTableNumber}
                        onChange={(e) => setTestTableNumber(Number(e.target.value))}
                        className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${
                          validationErrors.tableNumber
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-600 focus:ring-blue-500'
                        }`}
                        min={1}
                        max={999}
                      />
                      {validationErrors.tableNumber && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors.tableNumber}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Restaurant ID
                      </label>
                      <input
                        type="text"
                        value={testRestaurantId}
                        onChange={(e) => setTestRestaurantId(e.target.value)}
                        className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${
                          validationErrors.restaurantId
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-600 focus:ring-blue-500'
                        }`}
                        placeholder="Restaurant ID"
                      />
                      {validationErrors.restaurantId && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors.restaurantId}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {VALIDATION_TESTS.map((test, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          // Set test values and validate
                          if (test.field === 'message') setTestMessage(test.value as string);
                          if (test.field === 'tableNumber') setTestTableNumber(test.value as number);
                          if (test.field === 'restaurantId') setTestRestaurantId(test.value as string);
                          setTimeout(() => triggerError('validation'), 100);
                        }}
                        className="p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-left hover:bg-slate-700 transition-colors"
                      >
                        <div className="text-sm font-medium text-slate-300">{test.description}</div>
                        <div className="text-xs text-slate-500 mt-1">Expected: {test.expected}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Panel - Character & Status */}
            <div className="space-y-6">
              
              {/* Character Test */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center mr-2 text-sm">
                    🤖
                  </span>
                  Character Error Testing
                </h3>
                
                <div className="space-y-4">
                  <div className="h-64 bg-slate-900/50 rounded-xl flex items-center justify-center border border-slate-700/30">
                    {errorState ? (
                      <div className="text-center">
                        <div className="text-4xl mb-2">⚠️</div>
                        <div className="text-red-400 text-sm">{errorState}</div>
                        <div className="text-slate-500 text-xs mt-1">Fallback Mode Active</div>
                      </div>
                    ) : (
                      <RiveWaiterCharacter
                        personality={selectedPersonality || 'FRIENDLY'}
                        mood="idle"
                        onLoad={() => console.log('Character loaded successfully')}
                        onError={(error) => {
                          console.error('Character error:', error);
                          setErrorState('Character failed to load');
                        }}
                      />
                    )}
                  </div>
                  
                  <button
                    onClick={() => setErrorState(null)}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Reset Character
                  </button>
                </div>
              </motion.div>

              {/* System Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center mr-2 text-sm">
                    📊
                  </span>
                  System Status
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Error Boundaries</span>
                    <span className="text-green-400">✅ Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Input Validation</span>
                    <span className="text-green-400">✅ Enhanced</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Loading States</span>
                    <span className="text-green-400">✅ Optimized</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Performance</span>
                    <span className="text-green-400">✅ Monitored</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Production Ready</span>
                    <span className="text-yellow-400">🔄 Testing</span>
                  </div>
                </div>
              </motion.div>

              {/* Test Results Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center mr-2 text-sm">
                    📋
                  </span>
                  Test Results
                </h3>
                
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {Object.keys(testResults).length === 0 ? (
                    <div className="text-slate-500 text-sm text-center py-4">
                      No tests run yet
                    </div>
                  ) : (
                    Object.entries(testResults).map(([key, result]) => (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border ${
                          result.success
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                            {result.success ? '✅' : '❌'}
                          </span>
                        </div>
                        {result.responseTime && (
                          <div className="text-xs text-slate-400 mt-1">
                            Response: {result.responseTime}ms
                          </div>
                        )}
                        {result.error && (
                          <div className="text-xs text-red-400 mt-1">
                            {result.error}
                          </div>
                        )}
                        {result.message && (
                          <div className="text-xs text-green-400 mt-1">
                            {result.message}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestPhase7;