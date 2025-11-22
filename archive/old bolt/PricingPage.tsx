"use client";

import React, { useState } from 'react';
import { Link } from 'next/link';
import { CheckCircleIcon, StarIcon } from './icons';

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
    name: 'Starter',
    priceMonthly: '$59',
    priceAnnually: '$50',
    annualTotal: '$600',
    description: 'Essential tools to begin gamifying your community.',
    features: [
      'XP & Leveling System',
      'Badges & Milestones',
      'Leaderboards',
      'Manual Action Tracking',
      'Basic Discord Integration'
    ],
  },
  {
    name: 'Core',
    priceMonthly: '$99',
    priceAnnually: '$84',
    annualTotal: '$1010',
    description: 'Automate and expand your engagement strategies.',
    features: [
      'Everything in Starter, plus:',
      'Quests System',
      'Community Analytics Dashboard',
      'Whop Integration',
      'Automated Streaks & Freezes',
    ],
    highlight: true,
  },
  {
    name: 'Pro',
    priceMonthly: '$159',
    priceAnnually: '$135',
    annualTotal: '$1620',
    description: 'The ultimate toolkit for maximum retention.',
    features: [
      'Everything in Core, plus:',
      'XP Store & Item Inventory',
      'Advanced Retention Analytics',
      'Timed Effects & XP Boosters',
      'Priority Support',
    ],
  },
];

const PricingCard: React.FC<{ plan: Plan; isAnnual: boolean }> = ({ plan, isAnnual }) => {
  return (
    <div className={`bg-slate-800 rounded-2xl p-8 border ${plan.highlight ? 'border-purple-500' : 'border-slate-700'} flex flex-col`}>
      {plan.highlight && (
        <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-4 flex items-center gap-1">
          <StarIcon className="w-4 h-4"/>
          Most Popular
        </div>
      )}
      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
      <p className="text-slate-400 mt-2 mb-6 h-12">{plan.description}</p>
      
      <div className="mb-6">
        <span className="text-5xl font-extrabold text-white">{isAnnual ? plan.priceAnnually : plan.priceMonthly}</span>
        <span className="text-slate-400">/ month</span>
      </div>
      {isAnnual && (
        <p className="text-sm text-green-400 mb-6 -mt-4">Billed as {plan.annualTotal} per year (15% off)</p>
      )}

      <button className={`w-full py-3 rounded-lg font-bold transition-colors ${plan.highlight ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
        Choose Plan
      </button>

      <ul className="mt-8 space-y-3 text-slate-300">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PricingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-white">Find the right plan for your community</h1>
        <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
          Unlock powerful new features to drive engagement and retention.
        </p>
         <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 font-semibold mt-2 inline-block">
          &larr; Return to Dashboard
        </Link>
      </div>

      <div className="flex justify-center items-center gap-4">
        <span className={`font-semibold ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
        <label htmlFor="billing-cycle" className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            id="billing-cycle" 
            className="sr-only peer" 
            checked={isAnnual}
            onChange={() => setIsAnnual(!isAnnual)}
          />
          <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
        <span className={`font-semibold ${isAnnual ? 'text-white' : 'text-slate-400'}`}>Annual (Save 15%)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map(plan => (
          <PricingCard key={plan.name} plan={plan} isAnnual={isAnnual} />
        ))}
      </div>
    </div>
  );
};

export default PricingPage;