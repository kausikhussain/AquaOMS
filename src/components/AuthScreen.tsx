import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Droplet, Mail, Lock, User, Phone, MapPin, ArrowRight, ShieldCheck, HelpCircle, Check, Copy } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
    setCopiedText(demoEmail);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password } 
      : { name, email, password, phone, address };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand & Quick-Test Info */}
        <div className="lg:col-span-5 space-y-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Droplet className="w-6.5 h-6.5 fill-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-800">
                Amrit Dhara
              </span>
              <p className="text-xs uppercase tracking-widest font-bold text-sky-600">Pure Water. Delivered Smarter.</p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Atalapur Purified Water Plant Portal</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Log in to order premium 20L water cans, set up recurring monthly subscriptions, manage your credit ledger, or view the plant dispatcher queue.
            </p>
          </div>

          {/* Quick Demo Credentials Info Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-wider">Demo / Test Accounts</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-normal">
              Click any email address to automatically fill the login fields with its respective credentials (default password is <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">password123</code>).
            </p>

            <div className="space-y-3 pt-1">
              {/* Retailers */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Authorized Retailers (Accesses Dashboard)</span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button 
                    onClick={() => handleDemoFill('papan@amritdhara.com')}
                    className="flex items-center justify-between text-left text-xs bg-slate-50 hover:bg-amber-50/50 border border-slate-100 hover:border-amber-200 rounded-xl px-3 py-2 transition-all group"
                  >
                    <div>
                      <p className="font-bold text-slate-700">Mr. Papan (Retailer Owner)</p>
                      <p className="text-[10px] text-slate-400">papan@amritdhara.com</p>
                    </div>
                    {copiedText === 'papan@amritdhara.com' ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 shrink-0 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Customers */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Seed Customers (Accesses Shop &amp; Bills)</span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button 
                    onClick={() => handleDemoFill('kausik1027@gmail.com')}
                    className="flex items-center justify-between text-left text-xs bg-slate-50 hover:bg-blue-50/40 border border-slate-100 hover:border-blue-200 rounded-xl px-3 py-2 transition-all group"
                  >
                    <div>
                      <p className="font-bold text-slate-700">SK Kausik (₹140 Ledger Due)</p>
                      <p className="text-[10px] text-slate-400">kausik1027@gmail.com</p>
                    </div>
                    {copiedText === 'kausik1027@gmail.com' ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
                    )}
                  </button>

                  <button 
                    onClick={() => handleDemoFill('subham.bhoj@gmail.com')}
                    className="flex items-center justify-between text-left text-xs bg-slate-50 hover:bg-blue-50/40 border border-slate-100 hover:border-blue-200 rounded-xl px-3 py-2 transition-all group"
                  >
                    <div>
                      <p className="font-bold text-slate-700">Subham Gupta (Bhojanalaya - ₹735 Due)</p>
                      <p className="text-[10px] text-slate-400">subham.bhoj@gmail.com</p>
                    </div>
                    {copiedText === 'subham.bhoj@gmail.com' ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Beautiful Interactive Form Card */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <motion.div 
            layout
            className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-10 shadow-xl space-y-6 text-left"
          >
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                {isLogin ? 'Sign In to Your Account' : 'Register a New Account'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isLogin 
                  ? 'Enter your credentials to access the portal.' 
                  : 'All registered accounts will default to Customers unless authorized as a Retailer.'}
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-semibold text-rose-600 leading-normal flex gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivery Address (Optional)</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Plot 12, Main Street, Atalapur"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold text-sm shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {isLogin ? "Don't have an account?" : 'Already registered?'}
              </span>
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
              >
                {isLogin ? 'Register Here' : 'Log In Here'}
              </button>
            </div>

          </motion.div>
        </div>

      </div>
    </div>
  );
}
