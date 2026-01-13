import React, { createContext, useContext, useState, useEffect } from 'react';

interface PreferencesContextType {
    showGrades: boolean;
    setShowGrades: (show: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const [showGrades, setShowGrades] = useState<boolean>(() => {
        const saved = localStorage.getItem('preferences_show_grades');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('preferences_show_grades', JSON.stringify(showGrades));
    }, [showGrades]);

    return (
        <PreferencesContext.Provider value={{ showGrades, setShowGrades }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
}
