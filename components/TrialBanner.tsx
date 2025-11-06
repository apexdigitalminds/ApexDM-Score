import React from 'react';
import type { User } from '../types';

interface TrialBannerProps {
  profile: User;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ profile }) => {
  // Check if user has trial/subscription info (would come from bootstrap endpoint)
  const trialEndsAt = (profile as any).trialEndsAt;
  const isActiveSubscription = (profile as any).isActiveSubscription;

  // Only show banner if there's a trial ending and no active subscription
  if (!trialEndsAt || isActiveSubscription) {
    return null;
  }

  const trialDate = new Date(trialEndsAt);
  const now = new Date();
  const daysRemaining = Math.ceil((trialDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Don't show if trial has already ended
  if (daysRemaining < 0) {
    return null;
  }

  const urgencyColor = daysRemaining <= 3 ? 'from-red-600 to-orange-600' : 'from-orange-600 to-yellow-600';

  return (
    <div className={`bg-gradient-to-r ${urgencyColor} text-white p-4 rounded-lg mb-6 shadow-lg`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-bold text-lg">
            {daysRemaining <= 3 ? '⚠️ Trial Ending Soon!' : 'Free Trial Active'}
          </p>
          <p className="text-sm">
            Your free trial ends on {trialDate.toLocaleDateString()}
            {daysRemaining > 0 && ` (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining)`}
            . Upgrade now to keep access to all features!
          </p>
        </div>
        <button className="bg-white text-orange-600 font-bold py-2 px-6 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap">
          Upgrade Now
        </button>
      </div>
    </div>
  );
};

export default TrialBanner;
