// Storage Mode Indicator Component
// Add this to any component that needs to show storage status

import { useAuth } from '../context/AuthContext';

export const StorageIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { isAuthenticated } = useAuth();

    return (
        <span
            className={`text-xs opacity-60 ${className}`}
            title={isAuthenticated ? 'Auf Server gespeichert' : 'Nur lokal gespeichert'}
        >
            {isAuthenticated ? '☁️' : '💾'}
        </span>
    );
};

// Usage in Dashboard.tsx (grow cards):
// Add after grow name:
// <StorageIndicator />

// Usage in GrowDetail.tsx (log entries):
// Add in log entry header:
// <StorageIndicator />

// Usage in Profiles.tsx (profile cards):
// Add in profile card header:
// <StorageIndicator />
