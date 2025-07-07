import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const { actualTheme } = useTheme();

  return (
    <>
      <Head>
        <title>NEXUS AI - Future of Restaurant Ordering</title>
        <meta name="description" content="Revolutionary AI-powered restaurant ordering system. Transform your dining experience with intelligent conversation." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen w-full relative transition-colors duration-300 ${
        actualTheme === 'dark' 
          ? 'bg-black text-white' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Multi-layered Gradient Background - Full Coverage */}
        <div className={`fixed inset-0 w-full h-full ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
            : 'bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200'
        }`}></div>
        <div className={`fixed inset-0 w-full h-full ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-tr from-amber-900/15 via-transparent to-orange-900/15'
            : 'bg-gradient-to-tr from-amber-100/20 via-transparent to-orange-100/20'
        }`}></div>
        <div className={`fixed inset-0 w-full h-full ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-bl from-transparent via-red-900/8 to-transparent'
            : 'bg-gradient-to-bl from-transparent via-red-100/10 to-transparent'
        }`}></div>
        
        {/* Animated Gradient Orbs */}
        <div className={`fixed top-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-25 animate-pulse ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-amber-600/15 to-orange-600/15'
            : 'bg-gradient-to-r from-amber-400/15 to-orange-400/15'
        }`}></div>
        <div className={`fixed bottom-40 right-20 w-80 h-80 rounded-full blur-3xl opacity-20 animate-pulse ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-red-600/15 to-amber-600/15'
            : 'bg-gradient-to-r from-red-400/15 to-amber-400/15'
        }`} style={{ animationDelay: '2s' }}></div>
        <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-18 animate-pulse ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-green-600/12 to-emerald-600/12'
            : 'bg-gradient-to-r from-green-400/12 to-emerald-400/12'
        }`} style={{ animationDelay: '4s' }}></div>
        
        {/* Subtle Grid Pattern */}
        <div className="fixed inset-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        {/* Radial Gradient Overlay */}
        <div className="fixed inset-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.08),transparent_50%)]"></div>
        <div className="fixed inset-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(180,83,9,0.06),transparent_50%)]"></div>

        {/* Main Content - Scrollable */}
        <div className="relative z-10 min-h-screen">
          {/* Navigation */}
          <nav className={`flex justify-between items-center p-6 relative z-20 ${
            actualTheme === 'dark'
              ? 'border-b border-gray-800/30'
              : 'border-b border-gray-200/50'
          }`}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🍽</span>
              </div>
              <span className="font-mono font-bold text-xl tracking-wider">NEXUS</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle variant="compact" />
              <Link
                href="/register"
                className={`px-6 py-2 border rounded-lg font-mono text-sm transition-all duration-300 ${
                  actualTheme === 'dark'
                    ? 'border-gray-600 hover:border-amber-600 text-gray-300 hover:text-white'
                    : 'border-gray-300 hover:border-amber-600 text-gray-600 hover:text-amber-600'
                }`}
              >
                SIGN UP
              </Link>
              <Link
                href="/admin/login"
                className="px-6 py-2 bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-600 hover:to-orange-700 text-white font-mono text-sm rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.25)]"
              >
                SIGN IN
              </Link>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="px-6 py-20 text-center max-w-6xl mx-auto relative">
            {/* Hero Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/4 to-transparent rounded-3xl"></div>
            
            <div className="mb-8 relative z-20">
              <h1 className={`text-5xl md:text-7xl font-mono font-bold mb-6 drop-shadow-2xl ${
                actualTheme === 'dark'
                  ? 'bg-gradient-to-r from-white via-amber-200 to-orange-300 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-gray-800 via-amber-600 to-orange-700 bg-clip-text text-transparent'
              }`}>
                FUTURE OF
                <br />
                <span className={`text-6xl md:text-8xl ${
                  actualTheme === 'dark'
                    ? 'bg-gradient-to-r from-amber-300 via-white to-orange-400 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-amber-700 via-gray-800 to-orange-800 bg-clip-text text-transparent'
                }`}>DINING</span>
              </h1>
              <p className={`text-xl max-w-2xl mx-auto font-light leading-relaxed ${
                actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Revolutionary AI-powered ordering system that transforms restaurants into intelligent dining experiences.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 relative z-20">
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-600 hover:to-orange-700 text-white font-mono rounded-lg transition-all duration-300 shadow-[0_0_30px_rgba(217,119,6,0.25)] hover:shadow-[0_0_40px_rgba(217,119,6,0.35)] relative z-30"
              >
                GET STARTED
              </Link>
              <Link
                href="/demo"
                className={`px-8 py-4 border font-mono rounded-lg transition-all duration-300 relative z-30 ${
                  actualTheme === 'dark'
                    ? 'border-gray-600 hover:border-amber-600 text-gray-300 hover:text-white'
                    : 'border-gray-600 hover:border-amber-600 text-gray-600 hover:text-amber-600'
                }`}
              >
                VIEW DEMO
              </Link>
            </div>
          </section>

          {/* Features Grid */}
          <section className="px-6 py-16 max-w-6xl mx-auto relative">
            {/* Features Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-gray-950/10 to-transparent rounded-2xl"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20">
              <div className={`p-6 rounded-xl border transition-all duration-300 backdrop-blur-sm ${
                actualTheme === 'dark'
                  ? 'bg-gray-900/50 border-gray-800 hover:border-amber-600/50'
                  : 'bg-white/50 border-gray-200 hover:border-amber-600/50'
              }`}>
                <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className={`text-xl font-mono font-bold mb-2 ${
                  actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-700'
                }`}>AI INTELLIGENCE</h3>
                <p className={`text-sm ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Advanced natural language processing understands customer preferences and provides personalized recommendations.
                </p>
              </div>

              <div className={`p-6 rounded-xl border transition-all duration-300 backdrop-blur-sm ${
                actualTheme === 'dark'
                  ? 'bg-gray-900/50 border-gray-800 hover:border-orange-600/50'
                  : 'bg-white/50 border-gray-200 hover:border-orange-600/50'
              }`}>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-700 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className={`text-xl font-mono font-bold mb-2 ${
                  actualTheme === 'dark' ? 'text-orange-300' : 'text-orange-700'
                }`}>INSTANT ACCESS</h3>
                <p className={`text-sm ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  QR code integration provides immediate access to your restaurant's AI assistant from any mobile device.
                </p>
              </div>

              <div className={`p-6 rounded-xl border transition-all duration-300 backdrop-blur-sm ${
                actualTheme === 'dark'
                  ? 'bg-gray-900/50 border-gray-800 hover:border-green-600/50'
                  : 'bg-white/50 border-gray-200 hover:border-green-600/50'
              }`}>
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🏪</span>
                </div>
                <h3 className={`text-xl font-mono font-bold mb-2 ${
                  actualTheme === 'dark' ? 'text-green-400' : 'text-green-700'
                }`}>MULTI-TENANT</h3>
                <p className={`text-sm ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Each restaurant gets a fully customized AI personality with unique branding and conversation style.
                </p>
              </div>
            </div>
          </section>

          {/* Pricing Plans */}
          <section className="px-6 py-20 max-w-5xl mx-auto relative">
            {/* Pricing Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-900/20 to-transparent rounded-3xl"></div>
            
            <div className="text-center mb-12 relative z-20">
              <h2 className={`text-3xl md:text-4xl font-mono font-bold mb-4 ${
                actualTheme === 'dark'
                  ? 'bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'
              }`}>
                CHOOSE YOUR PLAN
              </h2>
              <p className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Scale with advanced AI capabilities
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20">
              {/* Starter Plan */}
              <div 
                className={`p-8 rounded-xl border transition-all duration-300 relative z-30 ${
                  hoveredPlan === 'starter' 
                    ? `border-amber-600 shadow-[0_0_30px_rgba(217,119,6,0.15)] ${
                        actualTheme === 'dark' ? 'bg-gray-900/70' : 'bg-white/70'
                      }`
                    : `${
                        actualTheme === 'dark' 
                          ? 'border-gray-800 bg-gray-900/30' 
                          : 'border-gray-200 bg-white/30'
                      }`
                }`}
                onMouseEnter={() => setHoveredPlan('starter')}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                <div className="mb-6">
                  <h3 className={`text-xl font-mono font-bold ${
                    actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-700'
                  }`}>STARTER</h3>
                  <div className="flex items-baseline mt-2">
                    <span className={`text-3xl font-bold ${
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>$29</span>
                    <span className={`ml-1 ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>/month</span>
                  </div>
                </div>
                <ul className={`space-y-3 text-sm mb-8 ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                    }`}>✓</span>
                    Up to 1,000 orders/month
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                    }`}>✓</span>
                    Basic AI personality
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                    }`}>✓</span>
                    QR code generation
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                    }`}>✓</span>
                    Email support
                  </li>
                </ul>
                <Link
                  href="/register?plan=starter"
                  className={`w-full block text-center px-6 py-3 border border-amber-600 font-mono text-sm rounded-lg transition-all duration-300 ${
                    actualTheme === 'dark'
                      ? 'text-amber-300 hover:bg-amber-600 hover:text-white'
                      : 'text-amber-700 hover:bg-amber-600 hover:text-white'
                  }`}
                >
                  GET STARTED
                </Link>
              </div>

              {/* Professional Plan */}
              <div 
                className={`p-8 rounded-xl border transition-all duration-300 relative z-30 ${
                  hoveredPlan === 'professional' 
                    ? `border-orange-600 shadow-[0_0_30px_rgba(234,88,12,0.15)] ${
                        actualTheme === 'dark' ? 'bg-gray-900/70' : 'bg-white/70'
                      }`
                    : `border-orange-600 ${
                        actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'
                      }`
                }`}
                onMouseEnter={() => setHoveredPlan('professional')}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-orange-600 to-red-700 text-white px-3 py-1 rounded-full text-xs font-mono">
                    POPULAR
                  </span>
                </div>
                <div className="mb-6">
                  <h3 className={`text-xl font-mono font-bold ${
                    actualTheme === 'dark' ? 'text-orange-300' : 'text-orange-700'
                  }`}>PROFESSIONAL</h3>
                  <div className="flex items-baseline mt-2">
                    <span className={`text-3xl font-bold ${
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>$79</span>
                    <span className={`ml-1 ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>/month</span>
                  </div>
                </div>
                <ul className={`space-y-3 text-sm mb-8 ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                    }`}>✓</span>
                    Up to 5,000 orders/month
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                    }`}>✓</span>
                    Advanced AI personality
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                    }`}>✓</span>
                    Custom branding
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                    }`}>✓</span>
                    Priority support
                  </li>
                </ul>
                <Link
                  href="/register?plan=professional"
                  className="w-full block text-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white font-mono text-sm rounded-lg transition-all duration-300"
                >
                  GET STARTED
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div 
                className={`p-8 rounded-xl border transition-all duration-300 relative z-30 ${
                  hoveredPlan === 'enterprise' 
                    ? `border-green-600 shadow-[0_0_30px_rgba(34,197,94,0.15)] ${
                        actualTheme === 'dark' ? 'bg-gray-900/70' : 'bg-white/70'
                      }`
                    : `${
                        actualTheme === 'dark' 
                          ? 'border-gray-800 bg-gray-900/30' 
                          : 'border-gray-200 bg-white/30'
                      }`
                }`}
                onMouseEnter={() => setHoveredPlan('enterprise')}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                <div className="mb-6">
                  <h3 className={`text-xl font-mono font-bold ${
                    actualTheme === 'dark' ? 'text-green-400' : 'text-green-700'
                  }`}>ENTERPRISE</h3>
                  <div className="flex items-baseline mt-2">
                    <span className={`text-3xl font-bold ${
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>$199</span>
                    <span className={`ml-1 ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>/month</span>
                  </div>
                </div>
                <ul className={`space-y-3 text-sm mb-8 ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`}>✓</span>
                    Unlimited orders
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`}>✓</span>
                    White-label solution
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`}>✓</span>
                    API access
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${
                      actualTheme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`}>✓</span>
                    24/7 phone support
                  </li>
                </ul>
                <Link
                  href="/register?plan=enterprise"
                  className={`w-full block text-center px-6 py-3 border border-green-600 font-mono text-sm rounded-lg transition-all duration-300 ${
                    actualTheme === 'dark'
                      ? 'text-green-400 hover:bg-green-600 hover:text-white'
                      : 'text-green-700 hover:bg-green-600 hover:text-white'
                  }`}
                >
                  GET STARTED
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className={`border-t px-6 py-8 text-center ${
            actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <p className={`text-sm ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              © 2024 NEXUS AI. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
