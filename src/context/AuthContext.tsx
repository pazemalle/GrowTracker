import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
    token: string | null;
    username: string | null;
    role: string | null; // Add role
    login: (token: string, username: string, role: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store reference to be set by App.tsx
let storeContextRef: any = null;

export const setStoreContextRef = (ref: any) => {
    storeContextRef = ref;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('cgt_token'));
    const [username, setUsername] = useState<string | null>(localStorage.getItem('cgt_username'));
    const [role, setRole] = useState<string | null>(localStorage.getItem('cgt_role')); // Restore role
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const login = (newToken: string, newUsername: string, newRole: string) => {
        localStorage.setItem('cgt_token', newToken);
        localStorage.setItem('cgt_username', newUsername);
        localStorage.setItem('cgt_role', newRole); // Save role
        setToken(newToken);
        setUsername(newUsername);
        setRole(newRole);
    };

    const logout = () => {
        console.log('[AuthContext] Logout initiated');

        // Set flag FIRST to prevent StoreContext from saving
        setIsLoggingOut(true);

        // Clear data from StoreContext BEFORE clearing localStorage
        if (storeContextRef && storeContextRef.clearData) {
            console.log('[AuthContext] Clearing StoreContext data');
            storeContextRef.clearData();
        }

        // Small delay to ensure clearData completes
        setTimeout(() => {
            // Clear localStorage
            localStorage.clear();
            console.log('[AuthContext] LocalStorage cleared');

            // Clear state
            setToken(null);
            setUsername(null);
            setRole(null);

            // Reload page
            setTimeout(() => {
                window.location.reload();
            }, 50);
        }, 100);
    };

    return (
        <AuthContext.Provider value={{ token, username, role, login, logout, isAuthenticated: !!token, isLoggingOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
