import { useState, useCallback } from 'react';
import type { MockDb } from '../App';
import type { Community } from '../types';

interface WhopMember {
    whop_user_id: string;
    username: string;
}

const mockWhopMembers: WhopMember[] = [
    { whop_user_id: 'whop_alex_123', username: 'Alex' }, // Existing user
    { whop_user_id: 'whop_zara_789', username: 'Zara' }, // New user
    { whop_user_id: 'whop_leo_101', username: 'Leo' },   // New user
];

const mockCommunityData: Community = {
    id: 'comm_123',
    name: 'Apex Traders',
    logoUrl: 'https://picsum.photos/seed/community/100',
    themeColor: 'purple',
    whop_store_id: 'store_aBcDeFg12345',
};

export const useWhop = (db: MockDb) => {
    const [isWhopConnected, setIsWhopConnected] = useState(false);
    const [community, setCommunity] = useState<Community | null>(null);
    
    const connectWhop = useCallback(() => {
        console.log('Connecting to Whop...');
        // In a real app, this would be an OAuth flow that returns community data.
        setIsWhopConnected(true);
        setCommunity(mockCommunityData);
        console.log('Successfully connected to Whop.');
    }, []);

    const syncWhopMembers = useCallback(async (): Promise<string> => {
        if (!isWhopConnected) {
            return "Error: Whop is not connected.";
        }
        console.log('Syncing members from Whop...');
        let newUsersCount = 0;
        let existingUsersCount = 0;

        for (const member of mockWhopMembers) {
            const existingUser = db.users.findByWhopId(member.whop_user_id);
            if (!existingUser) {
                db.users.create(member.username, member.whop_user_id);
                newUsersCount++;
            } else {
                existingUsersCount++;
            }
        }
        
        const summary = `Sync complete. Found ${existingUsersCount} existing members and added ${newUsersCount} new members.`;
        console.log(summary);
        return summary;
    }, [db, isWhopConnected]);

    return {
        isWhopConnected,
        community,
        connectWhop,
        syncWhopMembers,
    };
};
