import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Globe, Download, Upload, Trash2, Key, Shield, ShieldOff, Lock, RotateCcw, User, LogOut, ChevronDown, ChevronUp, Server, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const API_URL = 'http://localhost:3001/api';

export const SettingsPage: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const {
        grows,
        profiles,
        setups,
        seeds,
        notes,
        importData,
        clearData
    } = useStore();
    const { isAuthenticated, username, role, login, logout } = useAuth();

    const [authUsername, setAuthUsername] = useState('');
    const [authPassword, setAuthPassword] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordChange, setShowPasswordChange] = useState(false);

    // Admin State
    const [adminUsers, setAdminUsers] = useState<any[]>([]);
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    React.useEffect(() => {
        if (isAuthenticated && role === 'admin' && showAdminPanel) {
            fetchUsers();
        }
    }, [isAuthenticated, role, showAdminPanel]);

    const [backups, setBackups] = useState<any[]>([]);
    const [showBackups, setShowBackups] = useState(false);
    const [showSyncDetails, setShowSyncDetails] = useState(false);
    const [selectedBackupId, setSelectedBackupId] = useState<number | null>(null);
    const [restoreCategories, setRestoreCategories] = useState({
        grows: true,
        profiles: true,
        setups: true,
        seeds: true,
        notes: true
    });

    React.useEffect(() => {
        if (isAuthenticated) {
            fetchBackups();
        }
    }, [isAuthenticated]);

    async function fetchBackups() {
        try {
            const token = localStorage.getItem('cgt_token');
            const response = await fetch(`${API_URL}/data/backups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setBackups(await response.json());
            }
        } catch (error) {
            console.error('Failed to fetch backups');
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Bist du dir sicher? Dein Account und ALLE deine Daten werden unwiderruflich gelöscht!')) return;

        // Second confirmation
        const currentUsername = username || '';
        const input = prompt(`Zur Bestätigung bitte deinen Benutzernamen eingeben: ${currentUsername}`);

        if (input !== currentUsername) {
            alert(`Benutzername stimmt nicht überein. (Erwartet: ${currentUsername})`);
            return;
        }

        try {
            const token = localStorage.getItem('cgt_token');
            const response = await fetch(`${API_URL}/data/user/delete-account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Account erfolgreich gelöscht. Auf Wiedersehen!');
                handleLogout(); // Cleans up and redirects
            } else {
                const data = await response.json();
                alert(data.error || 'Fehler beim Löschen des Accounts');
            }
        } catch (error) {
            alert('Verbindungsfehler');
        }
    };

    const handleRestoreBackup = async (id: number) => {
        const categoriesToRestore = Object.entries(restoreCategories)
            .filter(([_, checked]) => checked)
            .map(([key]) => key);

        if (categoriesToRestore.length === 0) {
            alert('Bitte wähle mindestens eine Kategorie aus.');
            return;
        }

        if (!confirm(`Möchtest du folgende Daten aus dem Backup wiederherstellen?\n${categoriesToRestore.join(', ')}\n\nAktuelle Daten in diesen Kategorien werden überschrieben!`)) return;

        try {
            const token = localStorage.getItem('cgt_token');
            const response = await fetch(`${API_URL}/data/backups/${id}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ categories: categoriesToRestore })
            });

            if (response.ok) {
                alert('Backup erfolgreich wiederhergestellt! Die Seite wird neu geladen.');
                window.location.reload();
            } else {
                alert('Fehler beim Wiederherstellen');
            }
        } catch (error) {
            alert('Verbindungsfehler');
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('All fields required');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        try {
            const token = localStorage.getItem('cgt_token');
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (response.ok) {
                alert('Password changed successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordChange(false);
            } else {
                const data = await response.json();
                alert(data.error || 'Error changing password');
            }
        } catch (error) {
            alert('Error connecting to server');
        }
    };

    async function fetchUsers() {
        try {
            const token = localStorage.getItem('cgt_token');
            const response = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAdminUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

        try {
            const token = localStorage.getItem('cgt_token');
            const response = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('User deleted');
                fetchUsers(); // Refresh list
            } else {
                const data = await response.json();
                alert(data.error || 'Error deleting user');
            }
        } catch (error) {
            alert('Error connecting to server');
        }
    };

    const handleToggleRole = async (userId: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!confirm(`Change role to ${newRole}?`)) return;

        try {
            const token = localStorage.getItem('cgt_token');
            const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                fetchUsers();
            } else {
                const data = await response.json();
                alert(data.error || 'Error updating role');
            }
        } catch (error) {
            alert('Error connecting to server');
        }
    };

    const handleAdminResetPassword = async (userId: number) => {
        const newPassword = prompt('Enter new password for user:');
        if (!newPassword || newPassword.length < 4) return alert('Password too short or cancelled');

        try {
            const token = localStorage.getItem('cgt_token');
            const response = await fetch(`${API_URL}/admin/users/${userId}/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: newPassword })
            });

            if (response.ok) {
                alert('Password reset successfully');
            } else {
                const data = await response.json();
                alert(data.error || 'Error resetting password');
            }
        } catch (error) {
            alert('Error connecting to server');
        }
    };

    const handleLogin = async () => {
        if (!authUsername || !authPassword) {
            alert(t.settings.usernameRequired);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: authUsername, password: authPassword })
            });

            if (!response.ok) {
                alert(t.settings.loginError);
                return;
            }

            const data = await response.json();
            login(data.token, data.username, data.role);
            alert(t.settings.loginSuccess);
            setAuthUsername('');
            setAuthPassword('');
        } catch (error) {
            alert(t.settings.loginError);
        }
    };

    const handleRegister = async () => {
        if (!authUsername || !authPassword) {
            alert(t.settings.usernameRequired);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: authUsername, password: authPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.error || t.settings.registerError);
                return;
            }

            const loginResponse = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: authUsername, password: authPassword })
            });

            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                login(loginData.token, loginData.username, loginData.role);
                alert(t.settings.registerSuccess);
                setAuthUsername('');
                setAuthPassword('');
            }
        } catch (error) {
            alert(t.settings.registerError);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleUploadLocalData = async () => {
        if (!isAuthenticated || !username) return;

        try {
            const token = localStorage.getItem('cgt_token');

            // Upload data to server
            const uploadResponse = await fetch(`${API_URL}/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ grows, profiles, setups, seeds, notes })
            });

            if (uploadResponse.ok) {
                // Clear local storage directly to exit Hybrid mode
                localStorage.removeItem('cgt_grows');
                localStorage.removeItem('cgt_profiles');
                localStorage.removeItem('cgt_setups');
                localStorage.removeItem('cgt_seeds');
                localStorage.removeItem('cgt_notes');

                // Reload page to refresh state
                window.location.reload();
            } else {
                alert(t.settings.uploadError);
            }
        } catch (error) {
            alert(t.settings.uploadError);
        }
    };

    const handleExportAll = () => {
        const data = { grows, profiles, setups, seeds, notes };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `growtracker_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (event.target.files && event.target.files[0]) {
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = e => {
                if (e.target?.result) {
                    try {
                        const importedData = JSON.parse(e.target.result as string);
                        importData(importedData);
                        alert('Data imported successfully!');
                    } catch (error) {
                        alert('Invalid data file');
                    }
                }
            };
        }
    };

    const handleClearAll = () => {
        if (confirm(t.settings.clearAllConfirm)) {
            clearData();
            alert('All data cleared!');
        }
    };

    const iconContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '32px', height: '100%' };
    const rowStyle = { display: 'grid', gridTemplateColumns: '32px 1fr', gap: '16px', alignItems: 'center', textAlign: 'left' as const };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold gradient-text">{t.settings.title}</h2>
                <p className="text-slate-400">{t.settings.subtitle}</p>
            </div>

            {/* Language Settings */}
            <div className="glass-panel p-6">
                <div style={rowStyle} className="mb-4">
                    <div style={iconContainerStyle}>
                        <Globe className="text-emerald-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">{t.settings.language}</h3>
                        <p className="text-sm text-slate-400">{t.settings.languageDesc}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <button
                        onClick={() => setLanguage('de')}
                        className={`p-4 rounded-lg border-2 transition-all ${language === 'de'
                            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        <div className="text-2xl mb-2">🇩🇪</div>
                        <div className="font-semibold">{t.settings.german}</div>
                    </button>

                    <button
                        onClick={() => setLanguage('en')}
                        className={`p-4 rounded-lg border-2 transition-all ${language === 'en'
                            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        <div className="text-2xl mb-2">🇬🇧</div>
                        <div className="font-semibold">{t.settings.english}</div>
                    </button>
                </div>
            </div>

            {/* Server Storage / Auth */}
            <div className="glass-panel p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-1">{t.settings.serverStorage}</h3>
                    <p className="text-sm text-slate-400">{t.settings.serverStorageDesc}</p>
                </div>

                {isAuthenticated ? (
                    <div className="space-y-4">

                        {/* 1. User Profile & Logout (Top Card) */}
                        <div className="glass-panel border border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="bg-emerald-500/20 p-3 rounded-full border border-emerald-500/30">
                                    <User className="text-emerald-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t.settings.loggedInAs}</p>
                                    <p className="font-bold text-white text-xl">{username}</p>
                                    {role === 'admin' && <span className="text-[10px] bg-red-900/50 text-red-200 px-2 py-0.5 rounded-full border border-red-900">ADMIN</span>}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full sm:w-auto px-4 py-2 flex items-center justify-center gap-2 text-slate-300 hover:text-red-300 rounded-lg border border-slate-600 hover:border-red-900/50 transition-all duration-300 group"
                                style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
                            >
                                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                                {t.settings.logout}
                            </button>
                        </div>

                        {/* 2. Storage Mode Status */}
                        <div className="border border-slate-700 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}>
                            <div className="p-4 flex items-center justify-between" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                                <div style={rowStyle}>
                                    <div style={iconContainerStyle}>
                                        <Server size={20} className="text-blue-400" />
                                    </div>
                                    <span className="font-semibold text-slate-200">{t.settings.storageMode}</span>
                                </div>
                                {localStorage.getItem('cgt_grows') || localStorage.getItem('cgt_profiles') || localStorage.getItem('cgt_notes') ? (
                                    <span className="text-xs font-bold text-blue-300 px-2 py-1 rounded border border-blue-900/30" style={{ backgroundColor: 'rgba(30, 58, 138, 0.2)' }}>{t.settings.hybridMode}</span>
                                ) : (
                                    <span className="text-xs font-bold text-emerald-400 px-2 py-1 rounded border border-emerald-900/30" style={{ backgroundColor: 'rgba(6, 78, 59, 0.2)' }}>{t.settings.serverMode}</span>
                                )}
                            </div>

                            {/* Upload Action for Hybrid Mode */}
                            {(localStorage.getItem('cgt_grows') || localStorage.getItem('cgt_profiles') || localStorage.getItem('cgt_notes')) && (
                                <div className="p-4 border-t border-slate-700" style={{ backgroundColor: 'rgba(30, 58, 138, 0.05)' }}>
                                    <p className="text-sm text-slate-300 mb-3">Du hast lokale Daten. Lade sie hoch, um sie zu synchronisieren.</p>
                                    <button
                                        onClick={handleUploadLocalData}
                                        className="btn btn-primary w-full text-sm flex items-center justify-center gap-2"
                                    >
                                        <Upload size={16} />
                                        {t.settings.uploadLocalData}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 3. Sync Details (Collapsible) */}
                        <div className="border border-slate-700 rounded-lg overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setShowSyncDetails(!showSyncDetails)}
                                className="w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-800/50"
                                style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}
                            >
                                <div style={rowStyle} className="text-left">
                                    <div style={iconContainerStyle}>
                                        <ShieldCheck size={20} className="text-emerald-400" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-white text-sm">Synchronisierte Daten</h4>
                                        <p className="text-[10px] text-slate-300">
                                            {grows.length} Grows • {profiles.length} Profile • {notes.length} Notizen
                                        </p>
                                    </div>
                                </div>
                                {showSyncDetails ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </button>

                            {showSyncDetails && (
                                <div className="p-4 border-t border-slate-700 space-y-2 animate-fade-in-down" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                                    {[
                                        { label: 'Grows', count: grows.length },
                                        { label: 'Profile', count: profiles.length },
                                        { label: 'Setups', count: setups.length },
                                        { label: 'Seeds', count: seeds.length },
                                        { label: 'Notizen', count: notes.length }
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between items-center text-xs p-2 rounded bg-slate-800/50">
                                            <span className="text-slate-300">{item.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-400 font-bold">{item.count}</span>
                                                <span className="text-slate-600">|</span>
                                                <span className="text-slate-500">Synchronisiert</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="text-[10px] text-center text-slate-600 mt-2">
                                        Zuletzt aktualisiert: {new Date().toLocaleTimeString()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Backups (Collapsible) */}
                        <div className="border border-slate-700 rounded-lg overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setShowBackups(!showBackups)}
                                className="w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-800/50"
                                style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}
                            >
                                <div style={rowStyle} className="text-left">
                                    <div style={iconContainerStyle}>
                                        <RotateCcw size={20} className="text-blue-400" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-white text-sm">Backups</h4>
                                        <p className="text-[10px] text-slate-300">{backups.length} verfügbar (Letzte 3)</p>
                                    </div>
                                </div>
                                {showBackups ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </button>

                            {showBackups && (
                                <div className="p-4 border-t border-slate-700 space-y-2 animate-fade-in-down" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                                    {backups.length > 0 ? (
                                        backups.map(backup => (
                                            <div key={backup.id} className="bg-slate-800/50 rounded border border-slate-700 p-3">
                                                <div className="flex items-center justify-between text-xs mb-2">
                                                    <span className="text-slate-300 font-mono">
                                                        {new Date(backup.created_at).toLocaleDateString('de-DE')} • {new Date(backup.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <button
                                                        onClick={() => setSelectedBackupId(selectedBackupId === backup.id ? null : backup.id)}
                                                        className={`px-3 py-1 rounded transition-colors text-[10px] font-bold uppercase tracking-wider ${selectedBackupId === backup.id ? 'text-white' : 'text-blue-400 hover:bg-blue-900/40'}`}
                                                        style={selectedBackupId === backup.id ? { backgroundColor: 'rgba(71, 85, 105, 1)' } : { backgroundColor: 'transparent' }}
                                                    >
                                                        {selectedBackupId === backup.id ? 'Abbrechen' : 'Wählen'}
                                                    </button>
                                                </div>

                                                {/* Restore Options */}
                                                {selectedBackupId === backup.id && (
                                                    <div className="pt-3 border-t border-slate-700 animate-fade-in">
                                                        <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold">Wiederherstellen:</p>
                                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                                            {Object.keys(restoreCategories).map(cat => (
                                                                <label key={cat} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={restoreCategories[cat as keyof typeof restoreCategories]}
                                                                        onChange={e => setRestoreCategories(prev => ({ ...prev, [cat]: e.target.checked }))}
                                                                        className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                                                                    />
                                                                    <span className="capitalize">{cat}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => handleRestoreBackup(backup.id)}
                                                            className="w-full py-1.5 text-white rounded text-xs font-bold uppercase tracking-wide transition-colors hover:opacity-90"
                                                            style={{ backgroundColor: 'rgba(16, 185, 129, 0.8)' }}
                                                        >
                                                            Auswahl wiederherstellen
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-500 italic p-2 text-center">Keine Backups vorhanden</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 5. Password Change (Collapsible) */}
                        <div className="border border-slate-700 rounded-lg overflow-hidden transition-all duration-300">
                            {!showPasswordChange ? (
                                <button
                                    onClick={() => setShowPasswordChange(true)}
                                    className="w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-800/50"
                                    style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}
                                >
                                    <div style={rowStyle} className="text-left">
                                        <div style={iconContainerStyle}>
                                            <Key size={20} className="text-amber-400" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-white text-sm">Passwort ändern</h4>
                                            <p className="text-[10px] text-slate-400">Sicherheit</p>
                                        </div>
                                    </div>
                                    <ChevronDown size={16} className="text-slate-400" />
                                </button>
                            ) : (
                                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                                    <button
                                        onClick={() => setShowPasswordChange(false)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700"
                                    >
                                        <div style={rowStyle} className="text-left">
                                            <div style={iconContainerStyle}>
                                                <Key size={20} className="text-amber-400" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-white text-sm">Passwort ändern</h4>
                                                <p className="text-[10px] text-slate-400">Sicherheit</p>
                                            </div>
                                        </div>
                                        <ChevronUp size={16} className="text-slate-400" />
                                    </button>

                                    <div className="p-4 space-y-3 animate-fade-in">
                                        <input
                                            type="password"
                                            className="input w-full text-sm bg-slate-900 border-slate-700 focus:border-amber-500/50"
                                            placeholder="Aktuelles Passwort"
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                        />
                                        <input
                                            type="password"
                                            className="input w-full text-sm bg-slate-900 border-slate-700 focus:border-amber-500/50"
                                            placeholder="Neues Passwort"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                        />
                                        <input
                                            type="password"
                                            className="input w-full text-sm bg-slate-900 border-slate-700 focus:border-amber-500/50"
                                            placeholder="Neues Passwort bestätigen"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                        />
                                        <button onClick={handleChangePassword} className="btn w-full bg-amber-600/20 text-amber-400 border border-amber-600/50 hover:bg-amber-600/40 text-sm">
                                            Passwort aktualisieren
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Admin Panel (Collapsible) */}
                        {role === 'admin' && (
                            <div className="border border-slate-700 rounded-lg overflow-hidden transition-all duration-300 mt-4">
                                <button
                                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                                    className="w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-800/50"
                                    style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}
                                >
                                    <div style={rowStyle} className="text-left">
                                        <div style={iconContainerStyle}>
                                            <Shield size={20} className="text-slate-400" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-white text-sm">Admin Panel</h4>
                                            <p className="text-[10px] text-slate-400">Benutzerverwaltung & System</p>
                                        </div>
                                    </div>
                                    {showAdminPanel ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                </button>

                                {showAdminPanel && (
                                    <div className="p-4 border-t border-slate-700 space-y-3 animate-fade-in-down" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Benutzerverwaltung</h3>
                                        <div className="space-y-2">
                                            {adminUsers.map(user => (
                                                <div key={user.id} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-700">
                                                    <div>
                                                        <span className="font-bold text-white block text-sm">{user.username}</span>
                                                        <span className="text-[10px] text-slate-500 uppercase">Rolle: {user.role} • ID: {user.id}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {/* User Actions */}
                                                        {user.id !== 1 && user.id !== parseInt((localStorage.getItem('cgt_token') ? JSON.parse(atob(localStorage.getItem('cgt_token')!.split('.')[1])).id : 0)) && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleToggleRole(user.id, user.role)}
                                                                    className={`p-1.5 rounded transition-colors ${user.role === 'admin' ? 'text-amber-400' : 'text-emerald-400'}`}
                                                                    title={user.role === 'admin' ? "Als User setzen" : "Als Admin setzen"}
                                                                    style={{ backgroundColor: 'transparent' }}
                                                                >
                                                                    {user.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    className="p-1.5 text-red-400 rounded transition-colors"
                                                                    title="Benutzer löschen"
                                                                    style={{ backgroundColor: 'transparent' }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                        {user.id !== 1 && (
                                                            <button
                                                                onClick={() => handleAdminResetPassword(user.id)}
                                                                className="p-1.5 text-blue-400 rounded transition-colors"
                                                                title="Passwort zurücksetzen"
                                                                style={{ backgroundColor: 'transparent' }}
                                                            >
                                                                <Key size={16} />
                                                            </button>
                                                        )}
                                                        {user.id === 1 && (
                                                            <div className="p-1.5 text-amber-500 opacity-50 cursor-not-allowed" title="Root Admin (Geschützt)">
                                                                <Lock size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {adminUsers.length === 0 && <p className="text-xs text-slate-500 italic p-2">Keine Benutzer geladen.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Delete Account Section */}
                        <div className="border border-red-900/30 rounded-lg overflow-hidden transition-all duration-300 mt-4">
                            <button
                                onClick={handleDeleteAccount}
                                className="w-full flex items-center justify-between p-4 transition-colors hover:bg-red-900/10 group"
                                style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}
                            >
                                <div style={rowStyle} className="text-left">
                                    <div style={iconContainerStyle}>
                                        <Trash2 size={20} className="text-red-500 group-hover:text-red-400" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-red-500 group-hover:text-red-400 text-sm">Account löschen</h4>
                                        <p className="text-[10px] text-red-300 group-hover:text-red-200">Unwiderruflich</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Guest Mode Warning */}
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                            <p className="text-xs font-bold text-yellow-300 mb-1">{t.settings.storageMode}</p>
                            <p className="text-sm text-yellow-200">{t.settings.guestModeWarning}</p>
                        </div>

                        <div className="space-y-3">
                            <input
                                className="input w-full"
                                placeholder={t.settings.username}
                                value={authUsername}
                                onChange={e => setAuthUsername(e.target.value)}
                            />
                            <input
                                className="input w-full"
                                type="password"
                                placeholder={t.settings.password}
                                value={authPassword}
                                onChange={e => setAuthPassword(e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleLogin} className="btn btn-primary">
                                    {t.settings.login}
                                </button>
                                <button onClick={handleRegister} className="btn btn-secondary">
                                    {t.settings.register}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Data Management */}
            <div className="glass-panel p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">{t.settings.dataManagement}</h3>
                </div>

                <div className="space-y-3">
                    <button onClick={handleExportAll} className="btn btn-secondary w-full justify-start">
                        <Download size={18} />
                        {t.settings.exportAll}
                    </button>

                    <label className="btn btn-secondary w-full justify-start cursor-pointer">
                        <Upload size={18} />
                        {t.settings.importData}
                        <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                    </label>

                    <button onClick={handleClearAll} className="btn btn-secondary w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 hover:border-red-900/50">
                        <Trash2 size={18} />
                        {t.settings.clearAll}
                    </button>
                </div>
            </div>
        </div >
    );
};
