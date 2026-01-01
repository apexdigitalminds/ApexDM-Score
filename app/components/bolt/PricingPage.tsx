"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, StarIcon, ClockIcon, XCircleIcon } from './icons';
import { useApp } from '@/context/AppContext';

// 🔧 PLAN IDs for Whop App Products
const planIds: Record<string, { monthly: string; annual: string }> = {
  'Core': {
    monthly: 'plan_e4FFt094Axfgf',
    annual: 'plan_HfEDkPud0jADY'
  },
  'Pro': {
    monthly: 'plan_O0478GuOZrGgB',
    annual: 'plan_05xorDNeY0eQs'
  },
  'Elite': {
    monthly: 'plan_hytzupiY3xjGm',
    annual: 'plan_RXAfXSbUVzWgl'
  },
  'Trial': {
    monthly: 'plan_1O9ya9RWXWrzr',
    annual: 'plan_zfvJ8bKMvthir'
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
  isTrial?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Trial',
    priceMonthly: 'FREE',
    priceAnnually: 'FREE',
    annualTotal: '$0',
    description: '14-Day Elite Trial - Experience all features free.',
    features: [
      'All Elite Features for 14 Days',
      'XP Store & Item Inventory',
      'Advanced Analytics',
      'White-label Branding',
      'No Credit Card Required',
    ],
    isTrial: true,
  },
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

// 🆕 Checkout Modal Component with Embedded Checkout
const CheckoutModal: React.FC<{
  planId: string;
  planName: string;
  onClose: () => void;
}> = ({ planId, planName, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Upgrade to {planName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XCircleIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Checkout Iframe */}
        <div className="relative" style={{ height: '600px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading checkout...</p>
              </div>
            </div>
          )}
          <iframe
            src={`https://whop.com/checkout/${planId}?embed=true`}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            allow="payment"
          />
        </div>
      </div>
    </div>
  );
};

const PricingCard: React.FC<{
  plan: Plan;
  isAnnual: boolean;
  onSelectPlan: (planId: string, planName: string) => void;
}> = ({ plan, isAnnual, onSelectPlan }) => {
  const planConfig = planIds[plan.name];
  const currentPlanId = planConfig ? (isAnnual ? planConfig.annual : planConfig.monthly) : null;

  const handleClick = () => {
    if (currentPlanId) {
      onSelectPlan(currentPlanId, plan.name);
    }
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur rounded-2xl p-8 border ${plan.isTrial
        ? 'border-green-500 shadow-2xl shadow-green-500/10'
        : plan.highlight
          ? 'border-purple-500 shadow-2xl shadow-purple-500/10'
          : 'border-slate-700'
      } flex flex-col transition-transform duration-300 hover:scale-105`}>

      {/* Header Badge */}
      {plan.isTrial ? (
        <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-4 flex items-center gap-1 shadow-sm">
          <ClockIcon className="w-3 h-3" />
          14-Day Free Trial
        </div>
      ) : plan.highlight ? (
        <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-4 flex items-center gap-1 shadow-sm">
          <StarIcon className="w-3 h-3" />
          Most Popular
        </div>
      ) : (
        <div className="h-6 mb-4"></div>
      )}

      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
      <p className="text-slate-400 mt-2 mb-6 h-12 text-sm leading-relaxed">{plan.description}</p>

      <div className="mb-6">
        <span className={`text-5xl font-extrabold tracking-tight ${plan.isTrial ? 'text-green-400' : 'text-white'}`}>
          {plan.isTrial ? 'FREE' : (isAnnual ? plan.priceAnnually : plan.priceMonthly)}
        </span>
        {!plan.isTrial && (
          <span className="text-slate-400 font-medium ml-1">/ month</span>
        )}
        {plan.isTrial && (
          <span className="text-slate-400 font-medium ml-1">for 14 days</span>
        )}
      </div>

      {isAnnual && !plan.isTrial && (
        <p className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded w-fit mb-6 -mt-4">
          Billed {plan.annualTotal} yearly (Save 15%)
        </p>
      )}

      {/* 🆕 Changed from <a> to <button> for in-app checkout */}
      <button
        onClick={handleClick}
        className={`block w-full text-center py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg cursor-pointer ${plan.isTrial
            ? 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-500/50'
            : plan.highlight
              ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-500/50'
              : 'bg-slate-700 hover:bg-slate-600 text-white hover:ring-2 hover:ring-slate-500/50'
          }`}
      >
        {plan.isTrial ? 'Start Free Trial' : `Choose ${plan.name}`}
      </button>

      <ul className="mt-8 space-y-4 text-slate-300 flex-grow">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.includes('Everything') ? 'text-purple-400' :
                plan.isTrial ? 'text-green-500' : 'text-green-500'
              }`} />
            <span className={feature.includes('Everything') ? 'font-bold text-white' : ''}>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PricingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ planId: string; planName: string } | null>(null);
  const { community } = useApp();
  const dashboardPath = community?.id ? `/dashboard/${community.id}` : '/admin';

  const handleSelectPlan = (planId: string, planName: string) => {
    setSelectedPlan({ planId, planName });
  };

  const handleCloseCheckout = () => {
    setSelectedPlan(null);
    // Optionally refresh to check for tier update
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4 sm:px-6 lg:px-8">

      {/* 🆕 Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          planId={selectedPlan.planId}
          planName={selectedPlan.planName}
          onClose={handleCloseCheckout}
        />
      )}

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

        <Link href={dashboardPath} className="text-purple-400 hover:text-purple-300 font-semibold text-sm hover:underline transition-all">
          &larr; Return to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {plans.map(plan => (
          <PricingCard
            key={plan.name}
            plan={plan}
            isAnnual={isAnnual}
            onSelectPlan={handleSelectPlan}
          />
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