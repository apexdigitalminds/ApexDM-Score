import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import type { AnalyticsData } from '../types';
import MetricCard from './analytics/MetricCard';
import ActivityBreakdownChart from './analytics/ActivityBreakdownChart';
import TopPerformers from './analytics/TopPerformers';
import FeatureLock from './analytics/FeatureLock';
import TopXpActionsChart from './analytics/TopXpActionsChart';
import TopBadgesChart from './analytics/TopBadgesChart';
import QuestAnalytics from './analytics/QuestAnalytics';
import StoreAnalytics from './analytics/StoreAnalytics';
import RetentionChartPlaceholder from './analytics/RetentionChartPlaceholder';
import { UserGroupIcon, ArrowTrendingUpIcon, ChartPieIcon, UserPlusIcon, TrendingDownIcon, FireIcon } from './icons';
import { api } from '../services/api';

const AnalyticsPage: React.FC = () => {
    const { community } = useApp();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'7d' | '30d'>('30d');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const analyticsData = await api.getAnalyticsData(dateRange);
            setData(analyticsData);
            setIsLoading(false);
        };
        fetchData();
    }, [dateRange]);

    const churnRate = data && data.engagement.activeMembers30d > 0 
        ? ((data.growth.churnedMembers14d / data.engagement.activeMembers30d) * 100).toFixed(1)
        : 0;
        
    const isSilverOrHigher = community?.subscriptionTier === 'silver' || community?.subscriptionTier === 'gold';
    const isGoldTier = community?.subscriptionTier === 'gold';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Community Analytics</h1>
                    <p className="text-slate-400">Insights into your community's engagement and growth.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
                    {(['7d', '30d'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                dateRange === range ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            Last {range === '7d' ? '7 Days' : '30 Days'}
                        </button>
                    ))}
                </div>
            </div>
            
            {isLoading ? (
                <div className="text-center p-8">Loading analytics data...</div>
            ) : !data ? (
                <div className="text-center p-8">Could not load analytics data.</div>
            ) : (
                <>
                    {/* Core Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard 
                            icon={<UserGroupIcon className="w-7 h-7 text-blue-400" />}
                            value={data.engagement.activeMembers7d}
                            label="Active Members"
                            description="Users active in the last 7 days."
                        />
                        <MetricCard 
                            icon={<ArrowTrendingUpIcon className="w-7 h-7 text-green-400" />}
                            value={`+${data.engagement.xpEarnedToday.toLocaleString()}`}
                            label="XP Earned Today"
                            description="Total XP awarded across all members today."
                        />
                        <MetricCard 
                            icon={<UserPlusIcon className="w-7 h-7 text-purple-400" />}
                            value={data.growth.newMembers7d}
                            label="New Members"
                            description="Users who joined in the last 7 days."
                        />
                         <MetricCard 
                            icon={<TrendingDownIcon className="w-7 h-7 text-red-400" />}
                            value={`${churnRate}%`}
                            label="Churn Rate"
                            description="Members inactive for >14 days."
                        />
                    </div>

                    {/* Charts and Data Visualizations */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 bg-slate-800 p-6 rounded-2xl shadow-lg">
                           <TopXpActionsChart data={data.topXpActions} />
                        </div>
                         <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <TopBadgesChart data={data.topBadges} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <ChartPieIcon className="w-6 h-6 text-purple-400" />
                                <h3 className="text-lg font-bold text-white">Activity Breakdown</h3>
                            </div>
                            <ActivityBreakdownChart data={data.activityBreakdown} />
                        </div>
                         <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <FireIcon className="w-6 h-6 text-orange-400" />
                                <h3 className="text-lg font-bold text-white">Streak Health</h3>
                            </div>
                            <div className="space-y-6 flex flex-col justify-center flex-grow">
                                <div className="text-center">
                                    <p className="text-5xl font-extrabold bg-gradient-to-r from-orange-400 to-red-500 text-transparent bg-clip-text">{data.streakHealth.percentWithActiveStreak}%</p>
                                    <p className="text-slate-300">of members have an active streak</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">{data.streakHealth.avgStreakLength}</p>
                                    <p className="text-slate-300">is the average streak length</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <TopPerformers usersByXp={data.topPerformers.byXp} usersByStreak={data.topPerformers.byStreak} />
                    
                    {/* Gated Features */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {isSilverOrHigher ? <QuestAnalytics data={data.questAnalytics} /> : <FeatureLock title="Quest Funnel Analytics" description="See how many members are participating in and completing your quests to optimize engagement." requiredTier="Silver" />}
                        {isSilverOrHigher ? <StoreAnalytics data={data.storeAnalytics} /> : <FeatureLock title="XP Store Analytics" description="Track which items are most popular in your XP store and see how much XP is being spent." requiredTier="Silver" />}
                    </div>

                    {isGoldTier ? (
                        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <h3 className="text-lg font-bold text-white">Member Retention (Gold Plan)</h3>
                            <RetentionChartPlaceholder />
                        </div>
                    ) : (
                        <FeatureLock 
                            title="Member Retention Over Time"
                            description="Visualize how member cohorts stay active over weeks and months to identify patterns and improve long-term retention."
                            requiredTier="Gold"
                        >
                            <RetentionChartPlaceholder />
                        </FeatureLock>
                    )}
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;