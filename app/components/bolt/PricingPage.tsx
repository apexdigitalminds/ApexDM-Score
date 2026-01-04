"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useIframeSdk } from "@whop/react";
import { CheckCircleIcon, StarIcon, ClockIcon } from './icons';
import { useApp } from '@/context/AppContext';
import { createCheckoutConfigAction } from '@/app/actions';

// 🔧 PLAN IDs for Whop App Products (Updated: 2026-01-02)
// Starter is FREE, Pro $79, Elite $149
const planIds: Record<string, { monthly: string; annual: string }> = {
  'Starter': {
    monthly: 'plan_MNWiY4cQdl09l',  // FREE tier
    annual: 'plan_MNWiY4cQdl09l'    // Same - free doesn't have annual variant
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
    monthly: 'plan_bLWPt2euy79O9',
    annual: 'plan_pfJBV6w6WwyIW'
  }
};

// Get plan ID for a given plan name and billing cycle
const getPlanId = (planName: string, isAnnual: boolean) => {
  const plan = planIds[planName];
  if (!plan) return null;
  return isAnnual ? plan.annual : plan.monthly;
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
    description: '14-Day Elite Trial — Experience all features free.',
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
    name: 'Starter',
    priceMonthly: 'FREE',
    priceAnnually: 'FREE',
    annualTotal: '$0',
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
    priceMonthly: '$79',
    priceAnnually: '$67',
    annualTotal: '$805',
    description: 'Automate and expand your engagement strategies.',
    features: [
      'Everything in Starter, plus:',
      'Community Analytics Dashboard',
      'Quests & Challenges',
      'Seasonal Leaderboards',
      'Engagement Trends & Insights',
    ],
    highlight: true,
  },
  {
    name: 'Elite',
    priceMonthly: '$149',
    priceAnnually: '$126',
    annualTotal: '$1515',
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

// 🆕 In-App Purchase Button Component
const PurchaseButton: React.FC<{
  planName: string;
  planId: string;
  isTrial?: boolean;
  isHighlight?: boolean;
  isCurrentPlan?: boolean;
}> = ({ planName, planId, isTrial, isHighlight, isCurrentPlan }) => {
  const iframeSdk = useIframeSdk();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    setCancelled(false);

    try {
      // 1. Validate the plan on server (ensures user is authenticated)
      const config = await createCheckoutConfigAction(planId);

      if (!config.success) {
        throw new Error(config.error || "Validation failed");
      }

      // 2. Open in-app purchase modal via iFrameSdk
      // The SDK handles checkout directly with just the planId
      const res = await iframeSdk.inAppPurchase({
        planId: config.planId!
      });

      console.log("[PurchaseButton] inAppPurchase response:", res);

      if (res.status === "ok") {
        // Purchase successful - refresh page to update tier
        window.location.reload();
      } else {
        // User cancelled or SDK returned error
        // Note: SDK returns "error" for both errors and user cancellation
        setCancelled(true);
        console.log("Checkout completed with status:", res.status);
      }
    } catch (err: any) {
      console.error("[PurchaseButton] Error:", err);
      setError(err.message || "Purchase failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Disabled state for current plan
  if (isCurrentPlan) {
    return (
      <button
        disabled
        className="block w-full text-center py-3 rounded-lg font-bold bg-slate-700/50 text-slate-400 border border-slate-600 cursor-not-allowed"
      >
        Current Plan
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handlePurchase}
        disabled={loading}
        className={`block w-full text-center py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg cursor-pointer disabled:cursor-wait disabled:opacity-70 ${isTrial
          ? 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-500/50'
          : isHighlight
            ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-500/50'
            : 'bg-slate-700 hover:bg-slate-600 text-white hover:ring-2 hover:ring-slate-500/50'
          }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : isTrial ? (
          'Start Free Trial'
        ) : (
          `Choose ${planName}`
        )}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </>
  );
};

const PricingCard: React.FC<{ plan: Plan; isAnnual: boolean; currentTier: string }> = ({ plan, isAnnual, currentTier }) => {
  const planId = getPlanId(plan.name, isAnnual);
  const isCurrentPlan = currentTier.toLowerCase() === plan.name.toLowerCase() ||
    (currentTier.toLowerCase() === 'free' && plan.name === 'Starter') ||
    (currentTier.toLowerCase() === 'core' && plan.name === 'Starter');

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
      ) : isCurrentPlan ? (
        <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-4 shadow-sm">
          ✓ Current Plan
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

      {isAnnual && !plan.isTrial && plan.name !== 'Starter' && (
        <p className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded w-fit mb-6 -mt-4">
          Billed {plan.annualTotal} yearly (Save 15%)
        </p>
      )}

      {/* Starter shows 'Included Free' text, others use PurchaseButton */}
      {plan.name === 'Starter' ? (
        <div className="block w-full text-center py-3 rounded-lg font-bold bg-slate-700/50 text-green-400 border border-green-500/30">
          ✓ Included Free
        </div>
      ) : planId ? (
        <PurchaseButton
          planName={plan.name}
          planId={planId}
          isTrial={plan.isTrial}
          isHighlight={plan.highlight}
          isCurrentPlan={isCurrentPlan}
        />
      ) : null}

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
  const { community } = useApp();
  const dashboardPath = community?.id ? `/dashboard/${community.id}` : '/admin';

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4 sm:px-6 lg:px-8">

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
          <PricingCard key={plan.name} plan={plan} isAnnual={isAnnual} currentTier={community?.tier || 'starter'} />
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