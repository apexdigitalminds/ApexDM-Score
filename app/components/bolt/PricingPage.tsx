"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, StarIcon } from './icons';

// 🔧 CONFIGURATION: Whop Checkout Links
const getCheckoutUrl = (planName: string) => {
    switch (planName) {
        case 'Core':
            return "https://whop.com/checkout/plan_QeGknkiKjIGid";
        case 'Pro':
            return "https://whop.com/checkout/plan_xI2Ai7kB4fqKU";
        case 'Elite':
            return "https://whop.com/checkout/plan_nQblvMtherlsN";
        default:
            return "#";
    }
};

interface Plan {
  name: string;
  priceMonthly: string;
  priceAnnually: string;
  annualTotal: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Core', 
    priceMonthly: '$59',
    priceAnnually: '$50',
    annualTotal: '$600',
    description: 'Essential tools to begin gamifying your community.',
    features: [
      'Unlimited Members & History', 
      'XP & Leveling System',
      'Daily Streaks',
      'Badges & Milestones',
      'Leaderboards',
      'Manual Action Tracking',
    ],
  },
  {
    name: 'Pro', 
    priceMonthly: '$99',
    priceAnnually: '$84',
    annualTotal: '$1010',
    description: 'Automate and expand your engagement strategies.',
    features: [
      'Everything in Core, plus:',
      'Community Analytics Dashboard',
      'Quests System',
      'Seasonal Leaderboards',
      'Discord Role Sync (Coming Soon)',
    ],
    highlight: true,
  },
  {
    name: 'Elite', 
    priceMonthly: '$159',
    priceAnnually: '$135',
    annualTotal: '$1620',
    description: 'The ultimate toolkit for maximum retention.',
    features: [
      'Everything in Pro, plus:',
      'XP Store & Item Inventory',
      'Advanced Retention Analytics',
      'Timed Effects & XP Boosters',
      'White-label Branding',
    ],
  },
];

const PricingCard: React.FC<{ plan: Plan; isAnnual: boolean }> = ({ plan, isAnnual }) => {
  const checkoutUrl = getCheckoutUrl(plan.name);

  return (
    <div className={`bg-slate-800 rounded-2xl p-8 border ${plan.highlight ? 'border-purple-500 shadow-2xl shadow-purple-500/10' : 'border-slate-700'} flex flex-col transition-transform duration-300 hover:scale-105`}>
      
      {/* Header Alignment Spacer */}
      {plan.highlight ? (
        <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-4 flex items-center gap-1 shadow-sm">
          <StarIcon className="w-3 h-3"/>
          Most Popular
        </div>
      ) : (
        <div className="h-6 mb-4"></div>
      )}

      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
      <p className="text-slate-400 mt-2 mb-6 h-12 text-sm leading-relaxed">{plan.description}</p>
      
      <div className="mb-6">
        <span className="text-5xl font-extrabold text-white tracking-tight">{isAnnual ? plan.priceAnnually : plan.priceMonthly}</span>
        <span className="text-slate-400 font-medium ml-1">/ month</span>
      </div>
      
      {isAnnual && (
        <p className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded w-fit mb-6 -mt-4">
          Billed {plan.annualTotal} yearly (Save 15%)
        </p>
      )}

      <a 
        href={checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block w-full text-center py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg ${
            plan.highlight 
                ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-500/50' 
                : 'bg-slate-700 hover:bg-slate-600 text-white hover:ring-2 hover:ring-slate-500/50'
        }`}
      >
        Choose {plan.name}
      </a>

      <ul className="mt-8 space-y-4 text-slate-300 flex-grow">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.includes('Everything') ? 'text-purple-400' : 'text-green-500'}`} />
            <span className={feature.includes('Everything') ? 'font-bold text-white' : ''}>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PricingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="w-full text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
      {/* 🟢 REMOVED: Custom Header. Now relies on Layout.tsx for the navbar. */}
      
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-white to-slate-400 text-transparent bg-clip-text">
            Find the right plan for your community
        </h1>
        <p className="text-lg text-slate-400 mb-8">
          Unlock powerful new features to drive engagement, retention, and growth.
        </p>
        
        <div className="flex justify-center items-center gap-6 mb-8 select-none">
            <span className={`font-bold text-sm transition-colors ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
            
            <label htmlFor="billing-cycle" className="relative inline-flex items-center cursor-pointer group">
                <input 
                    type="checkbox" 
                    id="billing-cycle" 
                    className="sr-only peer" 
                    checked={isAnnual}
                    onChange={() => setIsAnnual(!isAnnual)}
                />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 transition-colors shadow-inner"></div>
            </label>
            
            <span className={`font-bold text-sm transition-colors ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
                Annual <span className="text-green-400 text-xs ml-1">(Save 15%)</span>
            </span>
        </div>

         <Link href="/admin" className="text-purple-400 hover:text-purple-300 font-semibold text-sm hover:underline transition-all">
          &larr; Return to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map(plan => (
          <PricingCard key={plan.name} plan={plan} isAnnual={isAnnual} />
        ))}
      </div>

      <div className="mt-20 text-center border-t border-slate-800 pt-10">
          <h3 className="text-xl font-bold text-white mb-2">Enterprise or Custom Needs?</h3>
          <p className="text-slate-400 text-sm mb-4">We offer tailored solutions for large-scale communities.</p>
          <a href="mailto:apexdigitalminds@gmail.com" className="text-purple-400 hover:text-purple-300 font-bold hover:underline">
              Contact Sales &rarr;
          </a>
      </div>
    </div>
  );
};

export default PricingPage;