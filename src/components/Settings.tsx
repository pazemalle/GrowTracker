import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Globe, Download, Upload, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const API_URL = 'http://localhost:3001/api';

export const SettingsPage: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const { grows, profiles, importData } = useStore();
    const { isAuthenticated, username, login, logout } = useAuth();

    const [authUsername, setAuthUsername] = useState('');
    const [authPassword, setAuthPassword] = useState('');

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
            login(data.token, data.username);
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
                login(loginData.token, loginData.username);
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
                body: JSON.stringify({ grows, profiles })
            });

            if (uploadResponse.ok) {
                // Clear local storage directly to exit Hybrid mode
                localStorage.removeItem('cgt_grows');
                localStorage.removeItem('cgt_profiles');

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
            importData({ grows: [], profiles: [] });
            alert('All data cleared!');
        }
    };

    return (
        <div className="space-y-8">
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
                            {localStorage.getItem('cgt_grows') || localStorage.getItem('cgt_profiles') ? (
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

                            {/* Server Data Overview */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mt-3">
                                <p className="text-xs font-bold text-slate-400 mb-3">Auf Server gespeichert</p>

                                {/* Grows List */}
                                <div className="mb-4">
                                    <p className="text-sm font-semibold text-emerald-300 mb-2">
                                        Grows ({grows.length})
                                    </p>
                                    {grows.length > 0 ? (
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {grows.map(grow => {
                                                const lastUpdate = grow.logs.length > 0
                                                    ? new Date(Math.max(...grow.logs.map(log => new Date(log.date).getTime())))
                                                    : new Date(grow.startDate);

                                                return (
                                                    <div key={grow.id} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/50 rounded px-2 py-1">
                                                        <span className="text-emerald-400">✓</span>
                                                        <span className="flex-1 truncate">{grow.name}</span>
                                                        <span className="text-slate-500 text-[10px] whitespace-nowrap">
                                                            {lastUpdate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })} {lastUpdate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                );
                                            })}
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
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {profiles.map(profile => {
                                                const now = new Date();
                                                return (
                                                    <div key={profile.id} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/50 rounded px-2 py-1">
                                                        <span className="text-emerald-400">✓</span>
                                                        <span className="flex-1 truncate">{profile.name}</span>
                                                        <span className="text-slate-500 text-[10px] whitespace-nowrap">
                                                            {now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })} {now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 italic">Keine Profile gespeichert</p>
                                    )}
                                </div>
                            </div>

                            <button onClick={handleLogout} className="btn btn-secondary w-full justify-center text-red-400 hover:text-red-300">
                                {t.settings.logout}
                            </button>
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
