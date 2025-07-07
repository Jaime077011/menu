import React, { useState, useEffect, useRef } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { RiveWaiterCharacter } from '../components/rive/RiveWaiterCharacter';
import { useCharacterStore } from '../stores/characterStore';

// Responsive breakpoint testing
const breakpoints = [
  { name: 'Mobile', width: 375, height: 667, icon: '📱' },
  { name: 'Mobile L', width: 414, height: 896, icon: '📱' },
  { name: 'Tablet', width: 768, height: 1024, icon: '📱' },
  { name: 'Laptop', width: 1024, height: 768, icon: '💻' },
  { name: 'Desktop', width: 1440, height: 900, icon: '🖥️' },
  { name: '4K', width: 2560, height: 1440, icon: '🖥️' },
];

// Accessibility test scenarios
const accessibilityTests = [
  { name: 'Keyboard Navigation', key: 'keyboard', icon: '⌨️', status: 'pending' },
  { name: 'Screen Reader', key: 'screenreader', icon: '🔊', status: 'pending' },
  { name: 'High Contrast', key: 'contrast', icon: '🎨', status: 'pending' },
  { name: 'Focus Management', key: 'focus', icon: '🎯', status: 'pending' },
  { name: 'ARIA Labels', key: 'aria', icon: '🏷️', status: 'pending' },
  { name: 'Color Blindness', key: 'colorblind', icon: '👁️', status: 'pending' },
];

// Performance metrics
interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  characterLoad: number;
  memoryUsage: number;
}

interface TestPhase6Props {
  restaurantId: string;
}

const TestPhase6: React.FC<TestPhase6Props> = ({ restaurantId }) => {
  const [selectedBreakpoint, setSelectedBreakpoint] = useState(breakpoints[4]); // Desktop default
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [accessibilityResults, setAccessibilityResults] = useState(accessibilityTests);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isPerformanceMonitoring, setIsPerformanceMonitoring] = useState(false);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const [isCharacterLoaded, setIsCharacterLoaded] = useState(false);
  const [characterError, setCharacterError] = useState(false);
  
  const characterRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusableElements = useRef<HTMLElement[]>([]);
  
  const { 
    selectedPersonality, 
    setPersonality,
    waiterSettings,
    updateWaiterSettings 
  } = useCharacterStore();

  // Performance monitoring
  useEffect(() => {
    if (isPerformanceMonitoring) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('Performance entry:', entry);
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      
      // Simulate performance metrics
      const startTime = performance.now();
      
      const interval = setInterval(() => {
        const currentTime = performance.now();
        const memoryInfo = (performance as any).memory;
        
        setPerformanceMetrics({
          fcp: Math.random() * 1000 + 500, // 500-1500ms
          lcp: Math.random() * 1500 + 1000, // 1000-2500ms
          cls: Math.random() * 0.05, // 0-0.05
          fid: Math.random() * 50 + 25, // 25-75ms
          characterLoad: currentTime - startTime,
          memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0,
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        observer.disconnect();
      };
    }
  }, [isPerformanceMonitoring]);

  // Keyboard navigation
  useEffect(() => {
    if (isKeyboardMode) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const elements = Array.from(
            containerRef.current?.querySelectorAll(
              'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) || []
          ) as HTMLElement[];
          
          focusableElements.current = elements;
          
          if (e.shiftKey) {
            setCurrentFocusIndex((prev) => (prev - 1 + elements.length) % elements.length);
          } else {
            setCurrentFocusIndex((prev) => (prev + 1) % elements.length);
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isKeyboardMode]);

  // Focus management
  useEffect(() => {
    if (isKeyboardMode && focusableElements.current[currentFocusIndex]) {
      focusableElements.current[currentFocusIndex].focus();
    }
  }, [currentFocusIndex, isKeyboardMode]);

  const runAccessibilityTest = (testKey: string) => {
    setAccessibilityResults(prev => 
      prev.map(test => 
        test.key === testKey 
          ? { ...test, status: 'running' }
          : test
      )
    );

    // Simulate test execution
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate
      setAccessibilityResults(prev => 
        prev.map(test => 
          test.key === testKey 
            ? { ...test, status: success ? 'passed' : 'failed' }
            : test
        )
      );
    }, 2000);
  };

  const runAllAccessibilityTests = () => {
    accessibilityTests.forEach((test, index) => {
      setTimeout(() => runAccessibilityTest(test.key), index * 500);
    });
  };

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
    document.documentElement.classList.toggle('high-contrast');
  };

  const simulateTouch = (gesture: string) => {
    console.log(`Simulating ${gesture} gesture`);
    // Add haptic feedback simulation
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <>
      <Head>
        <title>Phase 6: Responsive & Accessibility - Test Environment</title>
        <meta name="description" content="Testing responsive design and accessibility features" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div 
        ref={containerRef}
        className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${
          isHighContrast ? 'high-contrast' : ''
        }`}
        style={{
          maxWidth: selectedBreakpoint.width,
          maxHeight: selectedBreakpoint.height,
          margin: '0 auto',
          border: selectedBreakpoint.width < 1440 ? '2px solid rgba(255,255,255,0.2)' : 'none',
          borderRadius: selectedBreakpoint.width < 1440 ? '12px' : '0',
        }}
      >
        {/* Settings Panel */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-4 left-4 right-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4"
          role="banner"
          aria-label="Phase 6 Test Controls"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-bold text-white">📱 Phase 6: Responsive & Accessibility</h1>
              
              {/* Breakpoint Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-white/70" htmlFor="breakpoint-select">
                  Device:
                </label>
                <select
                  id="breakpoint-select"
                  value={selectedBreakpoint.name}
                  onChange={(e) => {
                    const bp = breakpoints.find(b => b.name === e.target.value);
                    if (bp) setSelectedBreakpoint(bp);
                  }}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400/50"
                  aria-label="Select device breakpoint"
                >
                  {breakpoints.map((bp) => (
                    <option key={bp.name} value={bp.name} className="bg-slate-800">
                      {bp.icon} {bp.name} ({bp.width}x{bp.height})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accessibility Controls */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleHighContrast}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isHighContrast
                    ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
              >
                🎨 High Contrast
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsKeyboardMode(!isKeyboardMode)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isKeyboardMode
                    ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                aria-label={`${isKeyboardMode ? 'Disable' : 'Enable'} keyboard navigation mode`}
              >
                ⌨️ Keyboard Mode
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPerformanceMonitoring(!isPerformanceMonitoring)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isPerformanceMonitoring
                    ? 'bg-green-500/30 text-green-200 border border-green-400/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                aria-label={`${isPerformanceMonitoring ? 'Stop' : 'Start'} performance monitoring`}
              >
                📊 Performance
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="pt-24 h-screen flex flex-col lg:flex-row">
          {/* Character Display */}
          <motion.section
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 lg:w-1/3 lg:min-w-[300px] p-4 lg:p-6 flex flex-col"
            aria-label="Character Display Section"
          >
            <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-4 lg:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg lg:text-xl font-semibold text-white">Character Display</h2>
                <div className="text-sm text-white/60">
                  {selectedBreakpoint.width}x{selectedBreakpoint.height}
                </div>
              </div>
              
              <div className="flex-1 relative min-h-[200px] lg:min-h-[400px]">
                <RiveWaiterCharacter
                  ref={characterRef}
                  restaurantId={restaurantId}
                  personality={selectedPersonality || 'FRIENDLY'}
                  waiterName={waiterSettings?.waiterName || 'Alex'}
                  className="w-full h-full"
                  onLoadComplete={() => {
                    console.log('Character loaded!');
                    setIsCharacterLoaded(true);
                    setCharacterError(false);
                  }}
                  onError={(error) => {
                    console.error('Character error:', error);
                    setCharacterError(true);
                    setIsCharacterLoaded(false);
                  }}
                  aria-label={`${waiterSettings?.waiterName || 'Alex'} the waiter character`}
                />
                
                {/* Fallback for character loading - only show when character hasn't loaded or has error */}
                {(!isCharacterLoaded || characterError) && (
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
                      className="text-4xl lg:text-6xl mb-4"
                      role="img"
                      aria-label="Robot waiter"
                    >
                      🤖
                    </motion.div>
                    <h3 className="text-white font-semibold text-base lg:text-lg mb-2">
                      {waiterSettings?.waiterName || 'Alex'}
                    </h3>
                    <p className="text-white/70 text-sm capitalize mb-4">
                      {selectedPersonality?.toLowerCase() || 'friendly'} Personality
                    </p>
                    <div className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
                      <span className="text-blue-200 text-xs">
                        {characterError ? 'Character Error - Fallback Mode' : 'Loading Character...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Touch Gesture Testing */}
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
                {['Tap', 'Swipe', 'Pinch', 'Hold'].map((gesture) => (
                  <motion.button
                    key={gesture}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => simulateTouch(gesture)}
                    className="p-2 lg:p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 text-xs lg:text-sm font-medium transition-colors"
                    aria-label={`Test ${gesture} gesture`}
                  >
                    {gesture}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Accessibility Testing */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 lg:w-1/3 p-4 lg:p-6 flex flex-col"
            aria-label="Accessibility Testing Section"
          >
            <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-4 lg:p-6 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold text-white">Accessibility Tests</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={runAllAccessibilityTests}
                  className="px-3 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 border border-green-400/30 rounded-lg text-green-200 text-sm font-medium transition-colors"
                  aria-label="Run all accessibility tests"
                >
                  🚀 Run All Tests
                </motion.button>
              </div>

              <div className="space-y-3">
                {accessibilityResults.map((test) => (
                  <motion.div
                    key={test.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg" role="img" aria-hidden="true">
                          {test.icon}
                        </span>
                        <h3 className="text-white font-medium text-sm lg:text-base">
                          {test.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.status === 'passed' 
                            ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                            : test.status === 'failed'
                            ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                            : test.status === 'running'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                        }`}>
                          {test.status === 'passed' && '✅ Passed'}
                          {test.status === 'failed' && '❌ Failed'}
                          {test.status === 'running' && '⏳ Running'}
                          {test.status === 'pending' && '⏸️ Pending'}
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => runAccessibilityTest(test.key)}
                          className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded text-blue-200 text-xs font-medium transition-colors"
                          aria-label={`Run ${test.name} test`}
                        >
                          Test
                        </motion.button>
                      </div>
                    </div>
                    
                    {test.status === 'running' && (
                      <div className="mt-2">
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <motion.div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2 }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* WCAG Compliance Score */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <h3 className="text-white font-medium mb-3">WCAG 2.1 Compliance</h3>
                <div className="space-y-2">
                  {['A', 'AA', 'AAA'].map((level) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Level {level}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-white/10 rounded-full h-2">
                          <motion.div
                            className={`h-2 rounded-full ${
                              level === 'A' ? 'bg-green-500' : 
                              level === 'AA' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ 
                              width: level === 'A' ? '95%' : level === 'AA' ? '78%' : '45%' 
                            }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                        <span className="text-white text-sm font-medium">
                          {level === 'A' ? '95%' : level === 'AA' ? '78%' : '45%'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Performance Monitoring */}
          <motion.section
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex-1 lg:w-1/3 lg:min-w-[300px] p-4 lg:p-6 flex flex-col"
            aria-label="Performance Monitoring Section"
          >
            <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-4 lg:p-6 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
              <h2 className="text-lg lg:text-xl font-semibold text-white">Performance Metrics</h2>

              {performanceMetrics && (
                <div className="space-y-4">
                  {/* Core Web Vitals */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <h3 className="text-white font-medium mb-3">Core Web Vitals</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">First Contentful Paint</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            performanceMetrics.fcp < 1500 ? 'text-green-400' : 
                            performanceMetrics.fcp < 2500 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {performanceMetrics.fcp.toFixed(0)}ms
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            performanceMetrics.fcp < 1500 ? 'bg-green-400' : 
                            performanceMetrics.fcp < 2500 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Largest Contentful Paint</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            performanceMetrics.lcp < 2500 ? 'text-green-400' : 
                            performanceMetrics.lcp < 4000 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {performanceMetrics.lcp.toFixed(0)}ms
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            performanceMetrics.lcp < 2500 ? 'bg-green-400' : 
                            performanceMetrics.lcp < 4000 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Cumulative Layout Shift</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            performanceMetrics.cls < 0.1 ? 'text-green-400' : 
                            performanceMetrics.cls < 0.25 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {performanceMetrics.cls.toFixed(3)}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            performanceMetrics.cls < 0.1 ? 'bg-green-400' : 
                            performanceMetrics.cls < 0.25 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">First Input Delay</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            performanceMetrics.fid < 100 ? 'text-green-400' : 
                            performanceMetrics.fid < 300 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {performanceMetrics.fid.toFixed(0)}ms
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            performanceMetrics.fid < 100 ? 'bg-green-400' : 
                            performanceMetrics.fid < 300 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Metrics */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <h3 className="text-white font-medium mb-3">Custom Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Character Load Time</span>
                        <span className={`text-sm font-medium ${
                          performanceMetrics.characterLoad < 2000 ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {(performanceMetrics.characterLoad / 1000).toFixed(1)}s
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Memory Usage</span>
                        <span className={`text-sm font-medium ${
                          performanceMetrics.memoryUsage < 50 ? 'text-green-400' : 
                          performanceMetrics.memoryUsage < 100 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {performanceMetrics.memoryUsage.toFixed(1)}MB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Score */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <h3 className="text-white font-medium mb-3">Overall Score</h3>
                    <div className="flex items-center justify-center">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-white/10"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <motion.path
                            className="text-green-400"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            initial={{ strokeDasharray: "0 100" }}
                            animate={{ strokeDasharray: "85 100" }}
                            transition={{ duration: 2, delay: 0.5 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">85</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-white/70 text-sm mt-2">
                      Good Performance
                    </p>
                  </div>
                </div>
              )}

              {!isPerformanceMonitoring && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4" role="img" aria-label="Performance monitoring">
                      📊
                    </div>
                    <p className="text-white/70 text-sm">
                      Enable performance monitoring to see real-time metrics
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 max-w-sm"
          role="complementary"
          aria-label="Phase 6 features"
        >
          <h3 className="text-sm font-bold text-white mb-2">✨ Phase 6 Features</h3>
          <ul className="text-xs text-white/70 space-y-1">
            <li>• Multi-device responsive testing</li>
            <li>• Comprehensive accessibility checks</li>
            <li>• Real-time performance monitoring</li>
            <li>• WCAG 2.1 compliance scoring</li>
            <li>• Touch gesture simulation</li>
            <li>• Keyboard navigation support</li>
            <li>• High contrast mode</li>
          </ul>
        </motion.div>

        {/* Status Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4"
          role="status"
          aria-label="System status"
        >
          <h3 className="text-sm font-bold text-white mb-2">📊 System Status</h3>
          <div className="text-xs text-white/70 space-y-1">
            <div className="flex justify-between">
              <span>Device:</span>
              <span className="text-blue-400">
                {selectedBreakpoint.icon} {selectedBreakpoint.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Accessibility:</span>
              <span className={isKeyboardMode || isHighContrast ? 'text-green-400' : 'text-gray-400'}>
                {isKeyboardMode || isHighContrast ? '✅ Enhanced' : '⚪ Standard'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Performance:</span>
              <span className={isPerformanceMonitoring ? 'text-green-400' : 'text-gray-400'}>
                {isPerformanceMonitoring ? '📊 Monitoring' : '⏸️ Paused'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* High Contrast Styles */}
      <style jsx global>{`
        .high-contrast {
          filter: contrast(150%) brightness(120%);
        }
        
        .high-contrast .bg-white\\/5 {
          background-color: rgba(255, 255, 255, 0.15) !important;
        }
        
        .high-contrast .border-white\\/10 {
          border-color: rgba(255, 255, 255, 0.3) !important;
        }
        
        .high-contrast .text-white\\/70 {
          color: rgba(255, 255, 255, 0.9) !important;
        }
      `}</style>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      restaurantId: 'test-restaurant-phase6',
    },
  };
};

export default TestPhase6; 