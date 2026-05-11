/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ProfileData {
    profilePic: string | null;
    collegeName: string;
    rollNo: string;
    aboutMe: string;
    pin: string | null;
    pinHint: string | null;
    name: string;
}

const DEFAULT_PROFILE: ProfileData = {
    profilePic: null,
    collegeName: '',
    rollNo: '',
    aboutMe: '',
    pin: null,
    pinHint: null,
    name: '',
};

interface ProfileContextType {
    profile: ProfileData;
    updateProfile: (updates: Partial<ProfileData>) => void;
    isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            try {
                setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(savedProfile) });
            } catch (e) {
                console.error('Failed to parse profile data', e);
            }
        }
        setIsLoading(false);
    }, []);

    const updateProfile = (updates: Partial<ProfileData>) => {
        setProfile((prev) => {
            const newProfile = { ...prev, ...updates };
            localStorage.setItem('userProfile', JSON.stringify(newProfile));
            return newProfile;
        });
    };

    return (
        <ProfileContext.Provider value={{ profile, updateProfile, isLoading }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}
