'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const nextStep = () => {
    if (step === 3) {
      router.push('/dashboard');
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-2xl bg-[#111111] rounded-3xl border border-white/10 p-10 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-8 relative z-10">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Welcome to TalkByte AI</h1>
            <p className="text-gray-400 text-sm mt-1">Let's set up your AI voice agent in 3 steps.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className={step >= 1 ? "text-purple-400" : "text-gray-600"}>1</span>
            <div className={`w-8 h-1 rounded-full ${step >= 2 ? "bg-purple-500" : "bg-white/10"}`}></div>
            <span className={step >= 2 ? "text-purple-400" : "text-gray-600"}>2</span>
            <div className={`w-8 h-1 rounded-full ${step >= 3 ? "bg-purple-500" : "bg-white/10"}`}></div>
            <span className={step >= 3 ? "text-purple-400" : "text-gray-600"}>3</span>
          </div>
        </div>

        <div className="relative z-10 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">1. Connect Your Phone</h2>
              <p className="text-gray-400 text-sm">We'll provision a new Telnyx number for your AI agent, or you can port your existing one.</p>

              <div className="p-4 border border-white/10 rounded-xl bg-white/5 flex justify-between items-center cursor-pointer hover:border-purple-500/50 transition-colors">
                <div>
                  <div className="font-medium text-white">Get a New Number</div>
                  <div className="text-xs text-gray-400 mt-1">Instantly provision a local number in your area code.</div>
                </div>
                <div className="w-6 h-6 rounded-full border border-purple-500 flex items-center justify-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
              </div>

              <div className="p-4 border border-white/10 rounded-xl bg-white/5 flex justify-between items-center opacity-50 cursor-not-allowed">
                <div>
                  <div className="font-medium text-white">Port Existing Number</div>
                  <div className="text-xs text-gray-400 mt-1">Keep your current number. (Takes 3-5 days)</div>
                </div>
                <div className="w-6 h-6 rounded-full border border-gray-600"></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">2. Connect Your Point of Sale</h2>
              <p className="text-gray-400 text-sm">TalkByte syncs directly with your POS to pull menus and fire orders to the kitchen.</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-500/50 transition-colors">
                  <div className="text-4xl">🟦</div>
                  <div className="font-medium">Square</div>
                </div>
                <div className="p-4 border border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center gap-3 opacity-50">
                  <div className="text-4xl">🍞</div>
                  <div className="font-medium">Toast</div>
                  <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">Coming Soon</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">3. Choose Your AI Voice</h2>
              <p className="text-gray-400 text-sm">Select the persona that best matches your restaurant's brand.</p>

              <div className="space-y-3">
                <div className="p-4 border border-purple-500/50 rounded-xl bg-purple-500/10 flex justify-between items-center cursor-pointer">
                  <div className="flex items-center gap-4">
                    <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                      ▶️
                    </button>
                    <div>
                      <div className="font-medium">Matilda (Australian)</div>
                      <div className="text-xs text-gray-400">Warm, friendly, casual</div>
                    </div>
                  </div>
                  <div className="text-purple-400 text-sm font-medium">Selected</div>
                </div>
                <div className="p-4 border border-white/10 rounded-xl bg-white/5 flex justify-between items-center cursor-pointer">
                  <div className="flex items-center gap-4">
                    <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                      ▶️
                    </button>
                    <div>
                      <div className="font-medium">James (British)</div>
                      <div className="text-xs text-gray-400">Professional, polite, crisp</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between items-center relative z-10 pt-6 border-t border-white/10">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'}`}
          >
            Back
          </button>
          <button
            onClick={nextStep}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            {step === 3 ? 'Complete Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
