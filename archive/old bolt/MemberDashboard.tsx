"use client";

import React, { useEffect, useState } from 'react';

import { whopApi } from '@/services/whopApi';
import XPProgress from './XPProgress';
import StreakCounter from './StreakCounter';
import BadgeDisplay from './BadgeDisplay';
import TrialBanner from './TrialBanner';
import type { User } from '@/types';

const MemberDashboard: React.FC = () => {
  const { experienceId } = useParams<{ experienceId: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!experienceId) return;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const data = await whopApi.bootstrap(experienceId);
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [experienceId]);

  const handleTestAction = async () => {
    if (!experienceId || !profile) return;

    try {
      setIsRecording(true);
      await whopApi.recordAction({
        experienceId,
        actionType: 'test_action',
        xp: 5,
      });

      // Refresh profile after recording action
      const updatedProfile = await whopApi.bootstrap(experienceId);
      setProfile(updatedProfile);
    } catch (err: any) {
      console.error('Failed to record action:', err);
    } finally {
      setIsRecording(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-slate-300 text-lg">Authenticating with Whop…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Failed to load profile</p>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">No profile data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <TrialBanner profile={profile} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Welcome, {profile.username}!</h1>
          <p className="text-slate-400">Track your progress and earn rewards</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <XPProgress xp={profile.xp} />
          </div>
          <div>
            <StreakCounter streak={profile.streak} />
          </div>
        </div>

        <div className="mb-6">
          <BadgeDisplay badges={profile.badges} />
        </div>

        {profile.role === 'admin' && (
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Test Actions (Admin Only)</h3>
            <button
              onClick={handleTestAction}
              disabled={isRecording}
              className="bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {isRecording ? 'Recording...' : '+5 XP Test Action'}
            </button>
          </div>
        )}

        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">{profile.xp}</p>
              <p className="text-sm text-slate-400">Total XP</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-400">{profile.streak}</p>
              <p className="text-sm text-slate-400">Day Streak</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">{profile.badges.length}</p>
              <p className="text-sm text-slate-400">Badges Earned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-cyan-400">{profile.streakFreezes}</p>
              <p className="text-sm text-slate-400">Streak Freezes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
