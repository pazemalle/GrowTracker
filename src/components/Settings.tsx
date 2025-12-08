import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Globe, Download, Upload, Trash2, Key, Shield, ShieldOff, Lock } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const API_URL = 'http://localhost:3001/api';

export const SettingsPage: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const {
        grows,
        profiles,
        setups,
        seeds,
        importData,
        clearData
    } = useStore();
    const { isAuthenticated, username, role, login, logout } = useAuth();

    const [authUsername, setAuthUsername] = useState('');
    const [authPassword, setAuthPassword] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Admin State
    const [adminUsers, setAdminUsers] = useState<any[]>([]);
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    React.useEffect(() => {
        if (isAuthenticated && role === 'admin' && showAdminPanel) {
            fetchUsers();
        }
    }, [isAuthenticated, role, showAdminPanel]);

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
            } else {
                const data = await response.json();
                alert(data.error || 'Error changing password');
            }
        } catch (error) {
            alert('Error connecting to server');
        }
    };

    const fetchUsers = async () => {
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
                body: JSON.stringify({ grows, profiles, setups, seeds })
            });

            if (uploadResponse.ok) {
                // Clear local storage directly to exit Hybrid mode
                localStorage.removeItem('cgt_grows');
                localStorage.removeItem('cgt_profiles');
                localStorage.removeItem('cgt_setups');
                localStorage.removeItem('cgt_seeds');

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
        const data = { grows, profiles };
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

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold gradient-text">{t.settings.title}</h2>
                <p className="text-slate-400">{t.settings.subtitle}</p>
            </div>

            {/* Language Settings */}
            <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Globe className="text-emerald-400" size={24} />
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
                    <h3 className="text-lg font-bold text-white">{t.settings.serverStorage}</h3>
                    <p className="text-sm text-slate-400">{t.settings.serverStorageDesc}</p>
                </div>

                {isAuthenticated ? (
                    <div className="space-y-3">
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                            <p className="text-sm text-emerald-300 mb-1">{t.settings.loggedInAs}</p>
                            <p className="font-bold text-white">{username}</p>
                        </div>

                        {/* Storage Mode Indicator */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                            <p className="text-xs font-bold text-slate-400 mb-2">{t.settings.storageMode}</p>
                            {localStorage.getItem('cgt_grows') || localStorage.getItem('cgt_profiles') || localStorage.getItem('cgt_setups') || localStorage.getItem('cgt_seeds') ? (
                                <>
                                    <p className="text-sm text-blue-300 mb-2">{t.settings.hybridMode}</p>
                                    <button
                                        onClick={handleUploadLocalData}
                                        className="btn btn-primary w-full text-sm"
                                    >
                                        {t.settings.uploadLocalData}
                                    </button>
                                </>
                            ) : (
                                <p className="text-sm text-emerald-300">{t.settings.serverMode}</p>
                            )}
                        </div>

                        {/* Server Data Overview */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mt-3">
                            <p className="text-xs font-bold text-slate-400 mb-3">Auf Server gespeichert</p>

                            {/* Grows List */}
                            <div className="mb-4">
                                <p className="text-sm font-semibold text-emerald-300 mb-2">
                                    Grows ({grows.length})
                                </p>
                                {grows.length > 0 ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/50 rounded px-2 py-1">
                                        <span className="text-emerald-400">✓</span>
                                        <span className="flex-1 truncate">GrowsDB (Synchronisiert)</span>
                                        <span className="text-slate-500 text-[10px] whitespace-nowrap">
                                            {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })} {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">Keine Grows gespeichert</p>
                                )}
                            </div>

                            {/* Profiles List */}
                            <div>
                                <p className="text-sm font-semibold text-emerald-300 mb-2">
                                    Profile ({profiles.length})
                                </p>
                                {profiles.length > 0 ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/50 rounded px-2 py-1">
                                        <span className="text-emerald-400">✓</span>
                                        <span className="flex-1 truncate">ProfileDB (Synchronisiert)</span>
                                        <span className="text-slate-500 text-[10px] whitespace-nowrap">
                                            {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })} {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">Keine Profile gespeichert</p>
                                )}
                            </div>

                            {/* Setups List */}
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-emerald-300 mb-2">
                                    Setups ({setups.length})
                                </p>
                                {setups.length > 0 ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/50 rounded px-2 py-1">
                                        <span className="text-emerald-400">✓</span>
                                        <span className="flex-1 truncate">SetupsDB (Synchronisiert)</span>
                                        <span className="text-slate-500 text-[10px] whitespace-nowrap">
                                            {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })} {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">Keine Setups gespeichert</p>
                                )}
                            </div>

                            {/* Seeds List */}
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-emerald-300 mb-2">
                                    Seeds ({seeds.length})
                                </p>
                                {seeds.length > 0 ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/50 rounded px-2 py-1">
                                        <span className="text-emerald-400">✓</span>
                                        <span className="flex-1 truncate">SeedsDB (Synchronisiert)</span>
                                        <span className="text-slate-500 text-[10px] whitespace-nowrap">
                                            {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })} {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">Keine Seeds gespeichert</p>
                                )}
                            </div>
                        </div>

                        <button onClick={handleLogout} className="btn btn-secondary w-full justify-center text-red-400 hover:text-red-300">
                            {t.settings.logout}
                        </button>

                        {/* Change Password Section */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mt-4">
                            <h4 className="font-bold text-slate-300 mb-3 text-sm">Passwort ändern</h4>
                            <div className="space-y-2">
                                <input
                                    type="password"
                                    className="input w-full text-sm"
                                    placeholder="Aktuelles Passwort"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                />
                                <input
                                    type="password"
                                    className="input w-full text-sm"
                                    placeholder="Neues Passwort"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                                <input
                                    type="password"
                                    className="input w-full text-sm"
                                    placeholder="Neues Passwort bestätigen"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                                <button onClick={handleChangePassword} className="btn btn-secondary w-full text-sm">
                                    Passwort ändern
                                </button>
                            </div>
                        </div>

                        {/* Admin Panel */}
                        {role === 'admin' && (
                            <div className="mt-6 border-t border-slate-700 pt-6">
                                <button
                                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                                    className="btn btn-danger w-full bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40 mb-4"
                                >
                                    {showAdminPanel ? 'Admin Panel ausblenden' : 'Admin Panel anzeigen'}
                                </button>

                                {showAdminPanel && (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-red-400">Admin Benutzerverwaltung</h3>
                                        <div className="space-y-2">
                                            {adminUsers.map(user => (
                                                <div key={user.id} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-700">
                                                    <div>
                                                        <span className="font-bold text-white block">{user.username}</span>
                                                        <span className="text-xs text-slate-500">Rolle: {user.role} • ID: {user.id}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {/* Role Management */}
                                                        {user.id !== 1 && user.id !== parseInt((localStorage.getItem('cgt_token') ? JSON.parse(atob(localStorage.getItem('cgt_token')!.split('.')[1])).id : 0)) && (
                                                            <button
                                                                onClick={() => handleToggleRole(user.id, user.role)}
                                                                className={`p-2 rounded ${user.role === 'admin' ? 'text-yellow-400 hover:bg-yellow-900/20' : 'text-emerald-400 hover:bg-emerald-900/20'}`}
                                                                title={user.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                                                            >
                                                                {user.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                                                            </button>
                                                        )}

                                                        {/* Password Reset */}
                                                        {user.id !== 1 && (
                                                            <button
                                                                onClick={() => handleAdminResetPassword(user.id)}
                                                                className="p-2 text-blue-400 hover:bg-blue-900/20 rounded"
                                                                title="Reset Password"
                                                            >
                                                                <Key size={16} />
                                                            </button>
                                                        )}

                                                        {/* Delete User */}
                                                        {user.id !== 1 && user.id !== parseInt((localStorage.getItem('cgt_token') ? JSON.parse(atob(localStorage.getItem('cgt_token')!.split('.')[1])).id : 0)) && (
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="p-2 text-red-400 hover:bg-red-900/20 rounded"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}

                                                        {/* Root Admin Indicator */}
                                                        {user.id === 1 && (
                                                            <div className="p-2 text-yellow-500" title="Root Admin (Protected)">
                                                                <Lock size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {adminUsers.length === 0 && <p className="text-slate-500 italic">Keine Benutzer geladen.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
        </div>
    );
};
