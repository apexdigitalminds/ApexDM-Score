import React from 'react';
import { ShoppingBagIcon } from '../icons';

interface StoreData {
    totalSpent: number;
    items: {
        name: string;
        count: number;
    }[];
}

interface StoreAnalyticsProps {
    data: StoreData;
}

const StoreAnalytics: React.FC<StoreAnalyticsProps> = ({ data }) => {
    return (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-full">
            <div className="flex items-center gap-3 mb-4">
                <ShoppingBagIcon className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold text-white">XP Store Analytics</h3>
            </div>
            <div className="space-y-4">
                <div className="text-center bg-slate-700/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400">Total XP Spent</p>
                    <p className="text-3xl font-bold text-blue-400">{data.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Items Purchased</h4>
                    <div className="space-y-2">
                         {data.items.map(item => (
                            <div key={item.name} className="flex justify-between items-center text-sm p-3 bg-slate-700/50 rounded-md">
                                <span className="text-slate-300">{item.name}</span>
                                <span className="font-bold text-white">{item.count}</span>
                            </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreAnalytics;