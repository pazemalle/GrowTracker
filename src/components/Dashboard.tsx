import React from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { Sprout, Calendar, Archive, PlusCircle, Download, Upload, Hexagon } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
    const { grows, profiles, setups = [], addGrow, addProfile, importData } = useStore();
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();

    const activeGrows = grows.filter(g => g.status === 'active');
    const archivedGrows = grows.filter(g => g.status === 'archived');

    const handleExportAll = () => {
        const data = { grows, profiles, setups };
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
                        if (data.grows) {
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

    const handleSetupClick = (e: React.MouseEvent, setupId: string) => {
        e.preventDefault();
        const setup = setups.find(s => s.id === setupId);
        if (setup) {
            alert(`Setup: ${setup.name}\n\nTent: ${setup.tent}\nLights: ${setup.lights}\nExhaust: ${setup.exhaust}\nFilter: ${setup.filter}\nCirculation: ${setup.circulation}\n\nNotes: ${setup.notes}`);
        }
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
                    <div className="flex flex-col space-y-8">
                        {activeGrows.map(grow => {
                            // Calculate active days/stage
                            const lastLog = grow.logs.length > 0
                                ? grow.logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                                : null;
                            const endDate = lastLog ? new Date(lastLog.date) : new Date();
                            const days = lastLog?.day ? lastLog.day : differenceInDays(endDate, new Date(grow.startDate)) + 1;
                            const weeks = Math.ceil(days / 7);

                            // Get Profile
                            const profile = grow.profileId ? profiles.find(p => p.id === grow.profileId) : null;



                            return (
                                <Link key={grow.id} to={`/grow/${grow.id}`} className="glass-panel p-6 grow-card block !no-underline" style={{ textDecoration: 'none' }}>
                                    <div className="grow-card-header">
                                        <div className="flex flex-col w-full">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="text-xl font-bold text-white mr-2">{grow.name}</h3>
                                                <span className="text-xs opacity-60" title={isAuthenticated ? 'Auf Server gespeichert' : 'Nur lokal gespeichert'}>{isAuthenticated ? '☁️' : '💾'}</span>

                                                {/* Linked Setups */}
                                                {(() => {
                                                    const linkedSetups = setups.filter(s =>
                                                        (grow.setupIds && grow.setupIds.includes(s.id)) ||
                                                        (grow.setupId === s.id)
                                                    );

                                                    if (linkedSetups.length > 0) {
                                                        return (
                                                            <div className="flex flex-wrap gap-1 ml-2">
                                                                {linkedSetups.map(s => (
                                                                    <div
                                                                        key={s.id}
                                                                        onClick={(e) => handleSetupClick(e, s.id)}
                                                                        className="flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-700/50 hover:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-600 cursor-pointer transition-colors"
                                                                        title={[
                                                                            `${t.setupManager.setupName}: ${s.name}`,
                                                                            s.tent ? `${t.setupManager.tent}: ${s.tent}` : null,
                                                                            s.lights ? `${t.setupManager.lights}: ${s.lights}` : null,
                                                                            s.exhaust ? `${t.setupManager.exhaust}: ${s.exhaust}` : null,
                                                                            s.filter ? `${t.setupManager.filter}: ${s.filter}` : null,
                                                                            s.circulation ? `${t.setupManager.circulation}: ${s.circulation}` : null,
                                                                            s.notes ? `${t.setupManager.notes}: ${s.notes}` : null
                                                                        ].filter(Boolean).join('\n')}
                                                                    >
                                                                        <Hexagon size={10} className="text-emerald-500" />
                                                                        {s.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>

                                            {/* Stats Row (Horizontal & Compact) */}
                                            <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                                {/* Flower Stats */}
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
                                                                    <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                                        <span>🌺 {flowerDays} {t.growDetail?.flowerDays || 'BT'}</span>
                                                                    </div>
                                                                    <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                                        <span>📅 {flowerWeeks} {t.growDetail?.flowerWeeks || 'BW'}</span>
                                                                    </div>
                                                                </>
                                                            );
                                                        }
                                                    }
                                                    return null;
                                                })()}

                                                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                    <span>⏱️ {days} {t.dashboard.totalDays}</span>
                                                </div>
                                                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                    <span>📆 {weeks} {t.growDetail.weeks}</span>
                                                </div>
                                                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                    <span>📝 {grow.logs.length} Logs</span>
                                                </div>
                                            </div>

                                            {/* Date & Stage (Secondary Info) */}
                                            <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-3 ml-1">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    <span>{format(new Date(grow.startDate), 'dd.MM.yyyy')}</span>
                                                </div>
                                                <div className="text-slate-400">
                                                    {t.profiles.stages[lastLog ? lastLog.stage : grow.currentStage] || (lastLog ? lastLog.stage : grow.currentStage)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-start">
                                            <button
                                                onClick={(e) => handleExportGrow(e, grow)}
                                                className="bg-slate-800/50 hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm"
                                                title={t.growDetail.export}
                                            >
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Plant & Strain Info (Compact Line) */}
                                    {(grow.plantCount || (grow.strains && grow.strains.length > 0)) && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {grow.strainDistribution?.map(s => (
                                                <div key={s.id} className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-800/40 px-2 py-0.5 rounded-md border border-slate-700/40">
                                                    <span className="text-emerald-500 font-bold">{s.count}x</span>
                                                    <span>{s.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upcoming Events (Timeline Style) */}
                                    {(() => {
                                        let events: { day?: number, date?: Date, task: string, type?: string }[] = [];

                                        // 1. Profile Schedule Tasks
                                        if (profile) {
                                            const currentStage = lastLog ? lastLog.stage : grow.currentStage;
                                            const stageConfig = profile.stages[currentStage];
                                            if (stageConfig && stageConfig.schedule) {
                                                const currentStageDay = lastLog?.stageDay || 1;
                                                const scheduleEvents = stageConfig.schedule
                                                    .filter(t => t.day >= currentStageDay && t.day <= currentStageDay + 14)
                                                    .map(t => ({ day: t.day, task: t.task, type: 'task' }));
                                                events = [...events, ...scheduleEvents];
                                            }

                                            // 2. Major Events (Switch, Harvest)
                                            // Simplification: Assume startDate is start of veg. 
                                            // For more accuracy we'd need to track stage changes in logs, but this mimics GrowDetail basic logic.
                                            const referenceDate = lastLog ? new Date(lastLog.date) : new Date();

                                            // Switch to Flower
                                            const vegiDays = profile.vegiDurationWeeks * 7;
                                            const switchDate = addDays(new Date(grow.startDate), vegiDays);
                                            const switchDiff = differenceInDays(switchDate, referenceDate);

                                            // Always add if within window, regardless of current stage (fixes manual stage override issue)
                                            if (switchDiff >= 0 && switchDiff <= 14) {
                                                events.push({
                                                    date: switchDate,
                                                    task: t.growDetail.predictions?.switchToFlower || 'Auf Blüte umstellen (12/12)',
                                                    type: 'major'
                                                });
                                            }

                                            // Harvest
                                            const flowerDays = profile.flowerDurationWeeks * 7;
                                            const harvestDate = addDays(switchDate, flowerDays);
                                            const harvestDiff = differenceInDays(harvestDate, referenceDate);

                                            if (harvestDiff >= 0 && harvestDiff <= 14) {
                                                events.push({
                                                    date: harvestDate,
                                                    task: t.growDetail.predictions?.estimatedHarvest || 'Erntefenster beginnt',
                                                    type: 'major'
                                                });
                                            }
                                        }

                                        // Sort all events by date/day

                                        if (events.length === 0) return null;

                                        return (
                                            <div className="mt-5 pt-4 border-t border-slate-700/50">
                                                <h4 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                                                    <Calendar size={10} />
                                                    {t.dashboard?.upcomingEvents || 'Anstehende Ereignisse (2 Wochen)'}
                                                </h4>
                                                <div className="space-y-1">
                                                    {events.map((event, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 text-xs group">
                                                            <span className="text-emerald-500 font-mono text-[10px] min-w-[60px] bg-emerald-900/10 px-1 rounded border border-emerald-500/10 text-center uppercase">
                                                                {event.date
                                                                    ? format(event.date, 'dd. MMM')
                                                                    : `Tag ${event.day}`}
                                                            </span>
                                                            <span className={`text-slate-300 group-hover:text-emerald-300 transition-colors truncate ${event.type === 'major' ? 'font-bold text-emerald-400' : ''}`}>
                                                                {event.task}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Archived Grows (Collapsed/Simple View) */}
            {
                archivedGrows.length > 0 && (
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
                )
            }
        </div>
    );
};
