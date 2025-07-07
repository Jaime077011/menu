import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { api } from "@/utils/api";
import { useTheme } from "@/contexts/ThemeContext";

interface RegistrationForm {
  email: string;
  restaurantName: string;
  ownerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  subdomain: string;
  selectedPlan: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { actualTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  
  const [form, setForm] = useState<RegistrationForm>({
    email: "",
    restaurantName: "",
    ownerName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    subdomain: "",
    selectedPlan: ""
  });

  const [errors, setErrors] = useState<Partial<RegistrationForm>>({});

  // Get plans for display
  const { data: plans } = api.subscription.getPlans.useQuery();
  
  // Get selected plan from URL
  useEffect(() => {
    if (router.query.plan && typeof router.query.plan === 'string') {
      setForm(prev => ({ ...prev, selectedPlan: router.query.plan as string }));
    }
  }, [router.query.plan]);

  // Auto-generate subdomain from restaurant name
  useEffect(() => {
    if (form.restaurantName && !form.subdomain) {
      const generatedSubdomain = form.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      setForm(prev => ({ ...prev, subdomain: generatedSubdomain }));
    }
  }, [form.restaurantName]);

  // Check subdomain availability
  const checkSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setSubdomainChecking(true);
    try {
      const response = await fetch(`/api/register/check-subdomain?subdomain=${subdomain}`);
      const data = await response.json();
      setSubdomainAvailable(data.available);
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainAvailable(null);
    } finally {
      setSubdomainChecking(false);
    }
  };

  // Debounced subdomain checking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.subdomain) {
        checkSubdomain(form.subdomain);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.subdomain]);

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<RegistrationForm> = {};

    if (step === 1) {
      if (!form.email) newErrors.email = "Email is required";
      if (!form.restaurantName) newErrors.restaurantName = "Restaurant name is required";
      if (!form.ownerName) newErrors.ownerName = "Owner name is required";
      if (!form.subdomain) newErrors.subdomain = "Subdomain is required";
      if (form.subdomain && form.subdomain.length < 3) {
        newErrors.subdomain = "Subdomain must be at least 3 characters";
      }
      if (subdomainAvailable === false) {
        newErrors.subdomain = "This subdomain is not available";
      }
    }

    if (step === 2) {
      if (!form.address) newErrors.address = "Address is required";
      if (!form.city) newErrors.city = "City is required";
      if (!form.state) newErrors.state = "State is required";
      if (!form.zipCode) newErrors.zipCode = "ZIP code is required";
    }

    if (step === 3) {
      if (!form.selectedPlan) newErrors.selectedPlan = "Please select a plan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/register/restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      
      if (response.ok) {
        // Redirect to verification page
        router.push(`/register/verify?email=${encodeURIComponent(form.email)}`);
      } else {
        setErrors({ email: data.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ email: 'An error occurred during registration' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = plans?.find(p => p.id === form.selectedPlan);

  return (
    <>
      <Head>
        <title>NEXUS AI - Create Your Account</title>
        <meta name="description" content="Join the future of restaurant ordering with our AI-powered system" />
      </Head>

      <div className={`min-h-screen overflow-hidden relative ${
        actualTheme === 'dark' 
          ? 'bg-black text-white' 
          : 'bg-white text-gray-900'
      }`}>
        {/* Theme-aware gradient backgrounds */}
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
        }`}></div>
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-tr from-amber-900/15 via-transparent to-orange-900/15'
            : 'bg-gradient-to-tr from-amber-100/30 via-transparent to-orange-100/30'
        }`}></div>
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-bl from-transparent via-red-900/8 to-transparent'
            : 'bg-gradient-to-bl from-transparent via-red-50/20 to-transparent'
        }`}></div>
        
        {/* Animated Gradient Orbs */}
        <div className={`absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-25 animate-pulse ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-amber-600/15 to-orange-600/15'
            : 'bg-gradient-to-r from-amber-400/20 to-orange-400/20'
        }`}></div>
        <div className={`absolute bottom-40 right-20 w-80 h-80 rounded-full blur-3xl opacity-20 animate-pulse ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-red-600/15 to-amber-600/15'
            : 'bg-gradient-to-r from-red-400/25 to-amber-400/25'
        }`} style={{ animationDelay: '2s' }}></div>
        
        {/* Subtle Grid Pattern */}
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]'
            : 'bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]'
        }`}></div>
        
        {/* Radial Gradient Overlay */}
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.08),transparent_50%)]'
            : 'bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.12),transparent_50%)]'
        }`}></div>
        <div className={`absolute inset-0 ${
          actualTheme === 'dark'
            ? 'bg-[radial-gradient(circle_at_70%_80%,rgba(180,83,9,0.06),transparent_50%)]'
            : 'bg-[radial-gradient(circle_at_70%_80%,rgba(180,83,9,0.08),transparent_50%)]'
        }`}></div>

        <main className="relative z-10 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🍽</span>
                </div>
                <span className="font-mono font-bold text-2xl tracking-wider">NEXUS</span>
              </div>
              <h1 className={`text-3xl font-mono font-bold ${
                actualTheme === 'dark' 
                  ? 'bg-gradient-to-r from-gray-100 via-white to-gray-200 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'
              }`}>
                CREATE ACCOUNT
              </h1>
              <p className={`mt-2 text-sm font-mono ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Already have an account?{' '}
                <Link href="/admin/login" className={`transition-colors ${
                  actualTheme === 'dark' 
                    ? 'text-amber-400 hover:text-amber-300' 
                    : 'text-amber-600 hover:text-amber-700'
                }`}>
                  SIGN IN HERE
                </Link>
              </p>
            </div>
          </div>

          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className={`backdrop-blur-sm rounded-2xl px-8 py-8 ${
              actualTheme === 'dark'
                ? 'bg-gray-900/50 border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]'
                : 'bg-white/70 border border-gray-200 shadow-[0_0_50px_rgba(0,0,0,0.1)]'
            }`}>
              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                          currentStep >= step
                            ? 'bg-amber-600 border-transparent text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]'
                            : 'border-gray-600 text-gray-500'
                        }`}
                      >
                        {currentStep > step ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="font-mono font-bold">{step}</span>
                        )}
                      </div>
                      <span className={`text-xs font-mono mt-2 ${
                        actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {step === 1 ? 'BASIC INFO' : step === 2 ? 'LOCATION' : 'PLAN'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className={`rounded-full h-2 ${
                    actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="bg-gradient-to-r from-amber-600 to-orange-700 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(currentStep / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Step 1: Restaurant & Owner Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className={`text-lg font-mono font-bold mb-4 ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>RESTAURANT INFORMATION</h3>
                
                  <div>
                    <label htmlFor="email" className={`block text-sm font-mono font-medium mb-2 ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                        actualTheme === 'dark'
                          ? `bg-gray-900/50 text-white placeholder-gray-400 ${errors.email ? 'border-red-400' : 'border-gray-700'}`
                          : `bg-white text-gray-900 placeholder-gray-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`
                      }`}
                      placeholder="owner@restaurant.com"
                    />
                    {errors.email && <p className={`text-sm mt-1 font-mono ${
                      actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="restaurantName" className={`block text-sm font-mono font-medium mb-2 ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Restaurant Name *
                    </label>
                    <input
                      id="restaurantName"
                      type="text"
                      value={form.restaurantName}
                      onChange={(e) => setForm(prev => ({ ...prev, restaurantName: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                        actualTheme === 'dark'
                          ? `bg-gray-900/50 text-white placeholder-gray-400 ${errors.restaurantName ? 'border-red-400' : 'border-gray-700'}`
                          : `bg-white text-gray-900 placeholder-gray-500 ${errors.restaurantName ? 'border-red-400' : 'border-gray-300'}`
                      }`}
                      placeholder="Pizza Palace"
                    />
                    {errors.restaurantName && <p className={`text-sm mt-1 font-mono ${
                      actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.restaurantName}</p>}
                  </div>

                  <div>
                    <label htmlFor="ownerName" className={`block text-sm font-mono font-medium mb-2 ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Owner/Manager Name *
                    </label>
                    <input
                      id="ownerName"
                      type="text"
                      value={form.ownerName}
                      onChange={(e) => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                        actualTheme === 'dark'
                          ? `bg-gray-900/50 text-white placeholder-gray-400 ${errors.ownerName ? 'border-red-400' : 'border-gray-700'}`
                          : `bg-white text-gray-900 placeholder-gray-500 ${errors.ownerName ? 'border-red-400' : 'border-gray-300'}`
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.ownerName && <p className={`text-sm mt-1 font-mono ${
                      actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.ownerName}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className={`block text-sm font-mono font-medium mb-2 ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                        actualTheme === 'dark'
                          ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label htmlFor="subdomain" className={`block text-sm font-mono font-medium mb-2 ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Subdomain *
                    </label>
                    <div className="relative">
                      <input
                        id="subdomain"
                        type="text"
                        value={form.subdomain}
                        onChange={(e) => setForm(prev => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                          actualTheme === 'dark'
                            ? `bg-gray-900/50 text-white placeholder-gray-400 ${errors.subdomain ? 'border-red-400' : 'border-gray-700'}`
                            : `bg-white text-gray-900 placeholder-gray-500 ${errors.subdomain ? 'border-red-400' : 'border-gray-300'}`
                        }`}
                        placeholder="pizzapalace"
                      />
                      {subdomainChecking && (
                        <div className="absolute right-3 top-3 text-yellow-400">
                          <div className="animate-spin w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      {subdomainAvailable === true && (
                        <div className="absolute right-3 top-3 text-green-400">✓</div>
                      )}
                      {subdomainAvailable === false && (
                        <div className="absolute right-3 top-3 text-red-400">✗</div>
                      )}
                    </div>
                    <p className={`text-xs mt-1 font-mono ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Your restaurant will be available at: {form.subdomain}.nexus-ai.com</p>
                    {errors.subdomain && <p className={`text-sm mt-1 font-mono ${
                      actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.subdomain}</p>}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={subdomainChecking || subdomainAvailable === false}
                    className="w-full px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-600 hover:to-orange-700 text-white font-mono text-sm rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.25)] hover:shadow-[0_0_30px_rgba(217,119,6,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    CONTINUE
                  </button>
                </div>
              )}

              {/* Step 2: Location Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className={`text-lg font-mono font-bold mb-4 ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>RESTAURANT LOCATION</h3>
                
                  <div>
                    <label htmlFor="address" className={`block text-sm font-mono font-medium mb-2 ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Street Address *
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                        actualTheme === 'dark'
                          ? `bg-gray-900/50 text-white placeholder-gray-400 ${errors.address ? 'border-red-400' : 'border-gray-700'}`
                          : `bg-white text-gray-900 placeholder-gray-500 ${errors.address ? 'border-red-400' : 'border-gray-300'}`
                      }`}
                      placeholder="123 Main Street"
                    />
                    {errors.address && <p className={`text-sm mt-1 font-mono ${
                      actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className={`block text-sm font-mono font-medium mb-2 ${
                        actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        City *
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                          actualTheme === 'dark'
                            ? `bg-gray-900/50 text-white placeholder-gray-400 ${errors.city ? 'border-red-400' : 'border-gray-700'}`
                            : `bg-white text-gray-900 placeholder-gray-500 ${errors.city ? 'border-red-400' : 'border-gray-300'}`
                        }`}
                        placeholder="New York"
                      />
                      {errors.city && <p className={`text-sm mt-1 font-mono ${
                        actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                      }`}>{errors.city}</p>}
                    </div>

                    <div>
                      <label htmlFor="state" className={`block text-sm font-mono font-medium mb-2 ${
                        actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        State *
                      </label>
                      <input
                        id="state"
                        type="text"
                        value={form.state}
                        onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                          actualTheme === 'dark'
                            ? `bg-gray-900/50 text-white placeholder-gray-400 ${errors.state ? 'border-red-400' : 'border-gray-700'}`
                            : `bg-white text-gray-900 placeholder-gray-500 ${errors.state ? 'border-red-400' : 'border-gray-300'}`
                        }`}
                        placeholder="NY"
                      />
                      {errors.state && <p className={`text-sm mt-1 font-mono ${
                        actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                      }`}>{errors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="zipCode" className={`block text-sm font-mono font-medium mb-2 ${
                        actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        ZIP Code *
                      </label>
                      <input
                        id="zipCode"
                        type="text"
                        value={form.zipCode}
                        onChange={(e) => setForm(prev => ({ ...prev, zipCode: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                          actualTheme === 'dark'
                            ? `bg-gray-900/50 text-white placeholder-gray-400 ${errors.zipCode ? 'border-red-400' : 'border-gray-700'}`
                            : `bg-white text-gray-900 placeholder-gray-500 ${errors.zipCode ? 'border-red-400' : 'border-gray-300'}`
                        }`}
                        placeholder="10001"
                      />
                      {errors.zipCode && <p className={`text-sm mt-1 font-mono ${
                        actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                      }`}>{errors.zipCode}</p>}
                    </div>

                    <div>
                      <label htmlFor="country" className={`block text-sm font-mono font-medium mb-2 ${
                        actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Country
                      </label>
                      <select
                        id="country"
                        value={form.country}
                        onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono ${
                          actualTheme === 'dark'
                            ? 'bg-gray-900/50 border-gray-700 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className={`flex-1 px-6 py-3 border rounded-lg transition-colors font-mono text-sm ${
                        actualTheme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      BACK
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-600 hover:to-orange-700 text-white font-mono text-sm rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.25)] hover:shadow-[0_0_30px_rgba(217,119,6,0.35)]"
                    >
                      CONTINUE
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Plan Selection */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className={`text-lg font-mono font-bold mb-4 ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>CHOOSE YOUR PLAN</h3>
                  
                  <div className="space-y-4">
                    {plans?.map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-300 ${
                          form.selectedPlan === plan.id
                            ? 'border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.15)]'
                            : actualTheme === 'dark' 
                              ? 'border-gray-700 bg-gray-900/30 hover:border-gray-600' 
                              : 'border-gray-300 bg-gray-50/50 hover:border-gray-400'
                        } ${
                          form.selectedPlan === plan.id 
                            ? actualTheme === 'dark' 
                              ? 'bg-amber-900/20' 
                              : 'bg-amber-50/50'
                            : ''
                        }`}
                        onClick={() => setForm(prev => ({ ...prev, selectedPlan: plan.id }))}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="plan"
                            value={plan.id}
                            checked={form.selectedPlan === plan.id}
                            onChange={() => setForm(prev => ({ ...prev, selectedPlan: plan.id }))}
                            className={`h-4 w-4 text-amber-600 focus:ring-amber-600 ${
                              actualTheme === 'dark'
                                ? 'border-gray-600 bg-gray-900/50'
                                : 'border-gray-300 bg-white'
                            }`}
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className={`text-sm font-mono font-medium ${
                                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {plan.displayName}
                                </h4>
                                <p className={`text-sm font-mono ${
                                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {plan.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-amber-400">
                                  ${plan.price}
                                </span>
                                <span className={`font-mono ${
                                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>/month</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.selectedPlan && <p className={`text-sm font-mono ${
                    actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`}>{errors.selectedPlan}</p>}

                  {selectedPlan && (
                    <div className={`border rounded-lg p-4 ${
                      actualTheme === 'dark'
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-gray-50/50 border-gray-200'
                    }`}>
                      <h4 className={`text-sm font-mono font-medium mb-2 ${
                        actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Selected Plan: {selectedPlan.displayName}
                      </h4>
                      <p className={`text-sm font-mono ${
                        actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        You'll start with a 14-day free trial. No credit card required.
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className={`flex-1 px-6 py-3 border rounded-lg transition-colors font-mono text-sm ${
                        actualTheme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      BACK
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-600 hover:to-orange-700 text-white font-mono text-sm rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.25)] hover:shadow-[0_0_30px_rgba(217,119,6,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
} 