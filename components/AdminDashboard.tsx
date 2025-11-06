import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { whopApi } from '../services/whopApi';
import { UserGroupIcon, ArrowTrendingUpIcon, ChartBarIcon, TrophyIcon } from './icons';

interface AdminMetrics {
  companyId: string;
  totalMembers: number;
  activeMembers: number;
  weeklyActions: number;
  totalXpAwarded: number;
  isActiveSubscription: boolean;
  trialEndsAt?: string;
}

const MetricCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}> = ({ icon, value, label, color }) => (
  <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        const data = await whopApi.getMetrics(companyId);
        setMetrics(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [companyId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-slate-300 text-lg">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Failed to load metrics</p>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">No metrics data available</p>
      </div>
    );
  }

  const showTrialBanner = metrics.trialEndsAt && !metrics.isActiveSubscription;
  const trialDate = metrics.trialEndsAt
    ? new Date(metrics.trialEndsAt).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {showTrialBanner && (
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-lg mb-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Free Trial Active</p>
              <p className="text-sm">Your trial ends on {trialDate}. Upgrade to continue using all features!</p>
            </div>
            <button className="bg-white text-orange-600 font-bold py-2 px-6 rounded-lg hover:bg-slate-100 transition-colors">
              Upgrade Now
            </button>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Company ID: {metrics.companyId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            icon={<UserGroupIcon className="w-7 h-7 text-blue-400" />}
            value={metrics.totalMembers}
            label="Total Members"
            color="bg-blue-500/20"
          />
          <MetricCard
            icon={<ArrowTrendingUpIcon className="w-7 h-7 text-green-400" />}
            value={metrics.activeMembers}
            label="Active Members"
            color="bg-green-500/20"
          />
          <MetricCard
            icon={<ChartBarIcon className="w-7 h-7 text-purple-400" />}
            value={metrics.weeklyActions}
            label="Weekly Actions"
            color="bg-purple-500/20"
          />
          <MetricCard
            icon={<TrophyIcon className="w-7 h-7 text-yellow-400" />}
            value={metrics.totalXpAwarded.toLocaleString()}
            label="Total XP Awarded"
            color="bg-yellow-500/20"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Engagement Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Engagement Rate</span>
                <span className="font-bold text-white">
                  {metrics.totalMembers > 0
                    ? Math.round((metrics.activeMembers / metrics.totalMembers) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      metrics.totalMembers > 0
                        ? (metrics.activeMembers / metrics.totalMembers) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Subscription Status</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    metrics.isActiveSubscription ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                ></div>
                <span className="text-slate-300">
                  {metrics.isActiveSubscription ? 'Active Subscription' : 'Trial Period'}
                </span>
              </div>
              {showTrialBanner && (
                <p className="text-sm text-slate-400">
                  Trial ends: <span className="font-semibold text-white">{trialDate}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-slate-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors">
              Manage Rewards
            </button>
            <button className="bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors">
              Configure Badges
            </button>
            <button className="bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
