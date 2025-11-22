import React from 'react';
import { useApp } from '@/context/AppContext';
import BadgeItem from './BadgeItem';
// FIX: Import BadgeConfig to resolve type errors.
import type { Badge, BadgeConfig } from '@/types';

const BadgeShowcase: React.FC = () => {
    const { badgesConfig } = useApp();

    // FIX: Removed unnecessary cast. With the corrected `BadgeConfig` type in `types.ts`,
    // spreading `config` now correctly creates an object that satisfies the `Badge` type.
    const allBadges: Badge[] = Object.entries(badgesConfig).map(([name, config], index) => ({
        id: `showcase_${index}`,
        name,
        // FIX: Replaced spread operator to resolve "Spread types may only be created from object types" error.
        // FIX: Cast config to BadgeConfig as it was being inferred as 'unknown'.
        description: (config as BadgeConfig).description,
        icon: (config as BadgeConfig).icon,
        color: (config as BadgeConfig).color,
    }));

    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 text-center">Badge Collection</h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-4">
                {allBadges.map((badge) => (
                    <BadgeItem key={badge.id} badge={badge} />
                ))}
            </div>
        </div>
    );
};

export default BadgeShowcase;