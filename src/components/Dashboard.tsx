import React from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { Sprout, Calendar, Archive, PlusCircle, Download, Upload } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
    const { grows, profiles, addGrow, addProfile, importData } = useStore();
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();

    const activeGrows = grows.filter(g => g.status === 'active');
    const archivedGrows = grows.filter(g => g.status === 'archived');

    const handleExportAll = () => {
        const data = { grows, profiles };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `grow_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (event.target.files && event.target.files[0]) {
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = e => {
                if (e.target?.result) {
                    try {
                        const data = JSON.parse(e.target.result as string);
                        if (data.grows && data.profiles) {
                            importData(data);
                            alert('Import successful!');
                        } else {
                            // Fallback for partial data or legacy format if needed
                            if (data.grows && Array.isArray(data.grows)) {
                                data.grows.forEach((g: any) => addGrow(g));
                            }
                            if (data.profiles && Array.isArray(data.profiles)) {
                                data.profiles.forEach((p: any) => addProfile(p));
                            }
                            alert('Import successful (Partial)!');
                        }
                    } catch (error) {
                        alert('Invalid file format');
                    }
                }
            };
        }
    };

    const handleExportGrow = (e: React.MouseEvent, grow: any) => {
        e.preventDefault(); // Prevent navigation
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(grow));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${grow.name.replace(/\s+/g, '_')}_grow.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">{t.dashboard.title}</h1>
                    <p className="text-slate-400 mt-1">{t.dashboard.subtitle}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <label className="btn btn-secondary cursor-pointer" title={t.settings.importData}>
                        <Upload size={20} />
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>
                    <button onClick={handleExportAll} className="btn btn-secondary" title={t.settings.exportAll}>
                        <Download size={20} />
                    </button>
                    <Link to="/new-grow" className="btn btn-primary flex-1 md:flex-none justify-center">
                        <PlusCircle size={20} />
                        {t.dashboard.startNewGrow}
                    </Link>
                </div>
            </div>

            {/* Active Grows Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sprout className="text-emerald-400" />
                    {t.dashboard.activeGrows}
                </h2>

                {activeGrows.length === 0 ? (
                    <div className="no-grows-placeholder">
                        <Sprout size={48} className="mx-auto mb-4 text-slate-600" />
                        <p className="text-lg font-medium text-slate-300">{t.dashboard.noActiveGrows}</p>
                        <Link to="/new-grow" className="text-emerald-400 hover:text-emerald-300 mt-2 inline-block">
                            {t.dashboard.startNewGrow} →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeGrows.map(grow => {
                            // Calculate days based on LAST LOG ENTRY if available, otherwise current date
                            const lastLog = grow.logs.length > 0
                                ? grow.logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                                : null;

                            const endDate = lastLog ? new Date(lastLog.date) : new Date();
                            // If lastLog has a manual day override, use it. Otherwise calculate diff.
                            const days = lastLog?.day
                                ? lastLog.day
                                : differenceInDays(endDate, new Date(grow.startDate)) + 1;

                            const weeks = Math.ceil(days / 7);

                            return (
                                <Link key={grow.id} to={`/grow/${grow.id}`} className="glass-panel p-6 grow-card block !no-underline" style={{ textDecoration: 'none' }}>
                                    <div className="grow-card-header">
                                        <div className="flex items-center gap-2 w-full"><h3 className="grow-card-title !no-underline flex-1">{grow.name}</h3><span className="text-xs opacity-60" title={isAuthenticated ? 'Auf Server gespeichert' : 'Nur lokal gespeichert'}>{isAuthenticated ? '☁️' : '💾'}</span></div>
                                        <div className="flex items-center gap-2">
                                            <span className="grow-card-badge">
                                                {t.profiles.stages[lastLog ? lastLog.stage : grow.currentStage] || (lastLog ? lastLog.stage : grow.currentStage)}
                                            </span>
                                            <button
                                                onClick={(e) => handleExportGrow(e, grow)}
                                                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                                                title={t.growDetail.export}
                                            >
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grow-card-date">
                                        <Calendar size={14} />
                                        <span>{t.dashboard.started} {format(new Date(grow.startDate), 'MMM do, yyyy')}</span>
                                    </div>

                                    {/* Plant & Strain Info */}
                                    {/* Plant & Strain Info */}
                                    <div className="mt-3">
                                        {grow.strainDistribution && grow.strainDistribution.length > 0 ? (
                                            <div className="space-y-1">
                                                {grow.strainDistribution.map(s => (
                                                    <div key={s.id} className="text-xs text-slate-300 flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                                                        <span className="text-emerald-400 font-bold">{s.count}x</span>
                                                        <span>{s.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            (grow.plantCount || (grow.strains && grow.strains.length > 0)) && (
                                                <div className="text-xs text-slate-400 flex flex-wrap gap-2">
                                                    {grow.plantCount && (
                                                        <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                                            🌱 {grow.plantCount} {t.newGrow.plantCount || 'Plants'}
                                                        </span>
                                                    )}
                                                    {grow.strains && grow.strains.length > 0 && (
                                                        <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700" title={grow.strains.join(', ')}>
                                                            🧬 {grow.strains.length} {t.newGrow.strains || 'Strains'}
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>

                                    <div className="grow-stats-grid">
                                        {/* Flower Stats Calculation & Display */}
                                        {(() => {
                                            const flowerLog = grow.logs
                                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                .find(log => log.stage === 'flowering');

                                            if (flowerLog) {
                                                const endDate = lastLog ? new Date(lastLog.date) : new Date();
                                                const flowerDays = differenceInDays(endDate, new Date(flowerLog.date)) + 1;
                                                const flowerWeeks = Math.ceil(flowerDays / 7);

                                                if (flowerDays > 0) {
                                                    return (
                                                        <>
                                                            <div className="grow-stat-box border-pink-500/30 bg-pink-900/10">
                                                                <span className="grow-stat-value text-pink-400">{flowerDays}</span>
                                                                <span className="grow-stat-label text-pink-300/70">{t.growDetail?.flowerDays || 'Blütetage'}</span>
                                                            </div>
                                                            <div className="grow-stat-box border-pink-500/30 bg-pink-900/10">
                                                                <span className="grow-stat-value text-pink-400">{flowerWeeks}</span>
                                                                <span className="grow-stat-label text-pink-300/70">{t.growDetail?.flowerWeeks || 'Blütewochen'}</span>
                                                            </div>
                                                        </>
                                                    );
                                                }
                                            }
                                            return null;
                                        })()}

                                        <div className="grow-stat-box">
                                            <span className="grow-stat-value text-emerald-400">{days}</span>
                                            <span className="grow-stat-label">{t.dashboard.totalDays}</span>
                                        </div>
                                        <div className="grow-stat-box">
                                            <span className="grow-stat-value text-blue-400">{weeks}</span>
                                            <span className="grow-stat-label">{t.growDetail.weeks}</span>
                                        </div>
                                        <div className="grow-stat-box">
                                            <span className="grow-stat-value text-purple-400">{grow.logs.length}</span>
                                            <span className="grow-stat-label">{t.dashboard.logEntries}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Archived Grows (Collapsed/Simple View) */}
            {archivedGrows.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-slate-800">
                    <h2 className="text-xl font-bold text-slate-400 flex items-center gap-2">
                        <Archive size={20} />
                        {t.dashboard.archive}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {archivedGrows.map(grow => (
                            <Link key={grow.id} to={`/grow/${grow.id}`} className="glass-panel p-4 hover:bg-slate-800/50 transition-colors block">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-slate-300">{grow.name}</h3>
                                    <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400">
                                        {t.dashboard.archived}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">
                                    {format(new Date(grow.startDate), 'MMM yyyy')} • {grow.logs.length} Logs
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
