import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import type { Profile, StageConfig, Nutrient, NutrientEntry, StageTask, WeekConfig } from '../types';
import { Plus, Edit2, Trash2, Save, X, Download, Upload, Beaker, Calendar, ChevronDown, ChevronUp, Activity } from 'lucide-react';

const EmptyStageConfig: StageConfig = {
    temp: '', humidity: '', vpd: '', dli: '', ppfd: '', lightCycle: '', ec: '',
    nutrients: [], notes: '', schedule: []
};

const InitialProfile: Profile = {
    id: '',
    name: '',
    description: '',
    vegiDurationWeeks: 4,
    flowerDurationWeeks: 9,
    phases: {
        vegetation: { weeks: [] },
        flowering: { weeks: [] },
        drying: { weeks: [] },
    },
    nutrients: [],
    notes: '',
};

interface StageEditorProps {
    title: string;
    config: StageConfig;
    availableNutrients: Nutrient[];
    onChange: (config: StageConfig) => void;
    onRemove?: () => void; // Optional remove handler for weeks
    t: any;
}

const StageEditor: React.FC<StageEditorProps> = ({ title, config, availableNutrients, onChange, onRemove, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newNutrientId, setNewNutrientId] = useState('');
    const [newNutrientAmount, setNewNutrientAmount] = useState('');
    const [newTaskDay, setNewTaskDay] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');

    const handleAddNutrient = () => {
        if (!newNutrientId || !newNutrientAmount) return;
        const nutrient = availableNutrients.find(n => n.id === newNutrientId);
        if (!nutrient) return;

        const entry: NutrientEntry = {
            nutrientId: nutrient.id,
            name: nutrient.name,
            amount: parseFloat(newNutrientAmount),
            unit: 'ml/L Wasser' // Default
        };

        onChange({ ...config, nutrients: [...config.nutrients, entry] });
        setNewNutrientId('');
        setNewNutrientAmount('');
    };

    const handleRemoveNutrient = (index: number) => {
        onChange({ ...config, nutrients: config.nutrients.filter((_, i) => i !== index) });
    };

    const handleAddTask = () => {
        if (!newTaskDay || !newTaskDesc) return;
        const task: StageTask = {
            id: uuidv4(),
            day: parseInt(newTaskDay),
            task: newTaskDesc
        };
        onChange({ ...config, schedule: [...config.schedule, task].sort((a, b) => a.day - b.day) });
        setNewTaskDay('');
        setNewTaskDesc('');
    };

    const handleRemoveTask = (id: string) => {
        onChange({ ...config, schedule: config.schedule.filter(t => t.id !== id) });
    };

    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden mb-2">
            <div className="w-full p-3 flex justify-between items-center bg-slate-800 hover:bg-slate-750 transition-colors">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex-1 flex justify-between items-center text-left bg-transparent border-none hover:bg-transparent"
                    style={{ background: 'transparent' }}
                >
                    <h4 className="capitalize font-medium text-slate-200 flex items-center gap-2">
                        {title}
                        <span className="text-xs text-slate-500 font-normal ml-2">
                            (EC: {config.ec || '-'}, {config.nutrients.length} nuts)
                        </span>
                    </h4>
                    {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                </button>
                {onRemove && (
                    <button onClick={onRemove} className="ml-2 bg-slate-800/50 text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-slate-600 transition-colors shadow-none border border-slate-600/30"
                        style={{ backgroundColor: 'rgba(51, 65, 85, 0.5)', color: '#94a3b8' }}>
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-slate-700 space-y-4 bg-slate-900/30">
                    {/* Environment */}
                    <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <Activity size={12} /> {t.growDetail.environment}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-1">{t.growDetail.temp}</label>
                                <input className="input text-xs w-full bg-slate-900/50 border-slate-700" placeholder={t.profiles.tempPlaceholder} value={config.temp} onChange={e => onChange({ ...config, temp: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-1">{t.growDetail.humidity}</label>
                                <input className="input text-xs w-full bg-slate-900/50 border-slate-700" placeholder={t.profiles.humidityPlaceholder} value={config.humidity} onChange={e => onChange({ ...config, humidity: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-1">{t.growDetail.vpd}</label>
                                <input className="input text-xs w-full bg-slate-900/50 border-slate-700" placeholder="kPa" value={config.vpd || ''} onChange={e => onChange({ ...config, vpd: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-1 text-yellow-400 font-bold">EC</label>
                                <input className="input text-xs w-full bg-slate-900/50 border-yellow-500/30 text-yellow-500" placeholder="dS/m" value={config.ec || ''} onChange={e => onChange({ ...config, ec: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-1 text-teal-400 font-bold">pH</label>
                                <input className="input text-xs w-full bg-slate-900/50 border-teal-500/30 text-teal-500" placeholder="pH" value={config.ph || ''} onChange={e => onChange({ ...config, ph: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-1">{t.growDetail.dli}</label>
                                <input className="input text-xs w-full bg-slate-900/50 border-slate-700" placeholder="mol/m²/d" value={config.dli || ''} onChange={e => onChange({ ...config, dli: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-1">{t.growDetail.ppfd}</label>
                                <input className="input text-xs w-full bg-slate-900/50 border-slate-700" placeholder="µmol/m²/s" value={config.ppfd || ''} onChange={e => onChange({ ...config, ppfd: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] text-slate-500 block mb-1">{t.growDetail.lightCycle}</label>
                                <input className="input text-xs w-full bg-slate-900/50 border-slate-700" placeholder="e.g. 18/6" value={config.lightCycle || ''} onChange={e => onChange({ ...config, lightCycle: e.target.value })} list="light-cycles" />
                            </div>
                        </div>
                    </div>

                    {/* Nutrients */}
                    <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <Beaker size={12} /> {t.growDetail.nutrients}
                        </h5>
                        <div className="flex gap-2 mb-2">
                            <select className="input text-xs flex-1 bg-slate-900/50 border-slate-700 text-slate-300" value={newNutrientId} onChange={e => setNewNutrientId(e.target.value)}>
                                <option value="">Select Nutrient</option>
                                {availableNutrients.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                            </select>
                            <input className="input text-xs w-16 bg-slate-900/50 border-slate-700" placeholder="ml/L" value={newNutrientAmount} onChange={e => setNewNutrientAmount(e.target.value)} type="number" />
                            <button onClick={handleAddNutrient} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg p-1 h-[34px] w-[34px] flex items-center justify-center transition-colors shadow-none border-none"
                                style={{ backgroundColor: '#059669', color: 'white' }}><Plus size={16} /></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {config.nutrients.map((n, idx) => (
                                <span key={idx} className="bg-purple-900/30 border border-purple-500/30 text-purple-300 px-2 py-1 rounded text-[10px] flex items-center gap-1">
                                    {n.name}: {n.amount} {n.unit}
                                    <button onClick={() => handleRemoveNutrient(idx)} className="hover:text-red-400 ml-1 !bg-transparent text-slate-400 p-0 border-none"><X size={10} /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Schedule */}
                    <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <Calendar size={12} /> Tasks
                        </h5>
                        <div className="flex gap-2 mb-2">
                            <input className="input text-xs w-16 bg-slate-900/50 border-slate-700" placeholder="Day" value={newTaskDay} onChange={e => setNewTaskDay(e.target.value)} type="number" />
                            <input className="input text-xs flex-1 bg-slate-900/50 border-slate-700" placeholder="Task description" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} />
                            <button onClick={handleAddTask} className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg p-1 h-[34px] w-[34px] flex items-center justify-center transition-colors shadow-none border-none"
                                style={{ backgroundColor: '#2563eb', color: 'white' }}><Plus size={16} /></button>
                        </div>
                        <div className="space-y-1">
                            {config.schedule.map(task => (
                                <div key={task.id} className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded text-[10px]">
                                    <span className="text-blue-300 font-bold w-10">Day {task.day}</span>
                                    <span className="text-slate-300 flex-1">{task.task}</span>
                                    <button onClick={() => handleRemoveTask(task.id)} className="text-slate-500 hover:text-red-400 !bg-transparent p-0 border-none"><X size={10} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Profiles: React.FC = () => {
    const { profiles, addProfile, updateProfile, deleteProfile } = useStore();
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [currentProfile, setCurrentProfile] = useState<Profile>(InitialProfile);
    const [activePhaseTab, setActivePhaseTab] = useState<'vegetation' | 'flowering' | 'drying'>('vegetation');

    // Nutrient State for Edit Form
    const [newNutrientName, setNewNutrientName] = useState('');
    const [newNutrientType, setNewNutrientType] = useState<'veg' | 'bloom' | 'booster' | 'other'>('other');

    const handleEdit = (profile: Profile) => {
        // MIGRATION LOGIC ON LOAD
        let phases = profile.phases;
        if (!phases && profile.stages) {
            phases = {
                vegetation: { weeks: [profile.stages.vegetation || EmptyStageConfig] },
                flowering: { weeks: [profile.stages.flowering || EmptyStageConfig] },
                drying: { weeks: [profile.stages.drying || EmptyStageConfig] }
            };
            // Add Seedling to Veg Week 1 if exists? Or separate? 
            // For simplicity, we just use the main stages. User can refine.
        } else if (!phases) {
            phases = { // Should not happen for new structure, but safe fallback
                vegetation: { weeks: [] },
                flowering: { weeks: [] },
                drying: { weeks: [] }
            };
        }

        setCurrentProfile({
            ...profile,
            phases,
            nutrients: profile.nutrients || []
        });
        setIsEditing(true);
    };

    const handleNew = () => {
        setCurrentProfile({ ...InitialProfile, id: uuidv4() });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (profiles.find(p => p.id === currentProfile.id)) {
            updateProfile(currentProfile);
        } else {
            addProfile(currentProfile);
        }
        setIsEditing(false);
    };

    const handleDelete = (id: string) => {
        if (confirm(t.profiles.deleteConfirm)) {
            deleteProfile(id);
        }
    };

    const handleExport = (profile: Profile) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${profile.name.replace(/\\s+/g, '_')}_profile.json`);
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
                        let importedProfile = JSON.parse(e.target.result as string) as Profile;
                        importedProfile.id = uuidv4();
                        // Basic migration if importing old json
                        if (!importedProfile.phases && importedProfile.stages) {
                            importedProfile.phases = {
                                vegetation: { weeks: [importedProfile.stages.vegetation] },
                                flowering: { weeks: [importedProfile.stages.flowering] },
                                drying: { weeks: [importedProfile.stages.drying] }
                            };
                        }
                        addProfile(importedProfile);
                    } catch (error) {
                        alert('Invalid profile file');
                    }
                }
            };
        }
    };

    const addNutrientToProfile = () => {
        if (!newNutrientName) return;
        const newNutrient: Nutrient = {
            id: uuidv4(),
            name: newNutrientName,
            type: newNutrientType
        };
        setCurrentProfile({
            ...currentProfile,
            nutrients: [...(currentProfile.nutrients || []), newNutrient]
        });
        setNewNutrientName('');
    };

    const removeNutrientFromProfile = (id: string) => {
        setCurrentProfile({
            ...currentProfile,
            nutrients: currentProfile.nutrients.filter(n => n.id !== id)
        });
    };

    const addWeek = (phase: 'vegetation' | 'flowering' | 'drying') => {
        const newWeek = { ...EmptyStageConfig };
        // Pre-fill with previous week's data if available
        const currentWeeks = currentProfile.phases[phase].weeks;
        if (currentWeeks.length > 0) {
            const lastWeek = currentWeeks[currentWeeks.length - 1];
            newWeek.temp = lastWeek.temp;
            newWeek.humidity = lastWeek.humidity;
            newWeek.vpd = lastWeek.vpd;
            newWeek.dli = lastWeek.dli;
            newWeek.ppfd = lastWeek.ppfd;
            newWeek.lightCycle = lastWeek.lightCycle;
            newWeek.ec = lastWeek.ec;
            // Maybe not copy nutrients directly to avoid implicit duplication? User might want that.
            // Let's copy everything for convenience.
            newWeek.nutrients = [...lastWeek.nutrients];
        }

        const updatedPhase = {
            ...currentProfile.phases[phase],
            weeks: [...currentWeeks, newWeek]
        };

        setCurrentProfile({
            ...currentProfile,
            phases: { ...currentProfile.phases, [phase]: updatedPhase }
        });
    };

    const updateWeek = (phase: 'vegetation' | 'flowering' | 'drying', index: number, config: WeekConfig) => {
        const updatedWeeks = [...currentProfile.phases[phase].weeks];
        updatedWeeks[index] = config;
        setCurrentProfile({
            ...currentProfile,
            phases: {
                ...currentProfile.phases,
                [phase]: { ...currentProfile.phases[phase], weeks: updatedWeeks }
            }
        });
    };

    const removeWeek = (phase: 'vegetation' | 'flowering' | 'drying', index: number) => {
        const updatedWeeks = currentProfile.phases[phase].weeks.filter((_, i) => i !== index);
        setCurrentProfile({
            ...currentProfile,
            phases: {
                ...currentProfile.phases,
                [phase]: { ...currentProfile.phases[phase], weeks: updatedWeeks }
            }
        });
    };


    if (isEditing) {
        return (
            <div className="glass-panel p-6 animate-fade-in max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-700/50">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        {profiles.find(p => p.id === currentProfile.id) ? t.profiles.editProfile : t.profiles.createProfile}
                    </h2>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="p-2 hover:bg-slate-700/50 rounded-full text-slate-400 hover:text-white transition-all duration-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.profiles.profileName}</label>
                        <input
                            className="input w-full bg-slate-800/50 border-slate-700 focus:border-emerald-500/50 focus:ring-emerald-500/20 py-2.5"
                            value={currentProfile.name}
                            onChange={e => setCurrentProfile({ ...currentProfile, name: e.target.value })}
                            placeholder="e.g., Northern Lights Auto"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.profiles.description}</label>
                        <input
                            className="input w-full bg-slate-800/50 border-slate-700 focus:border-emerald-500/50 focus:ring-emerald-500/20 py-2.5"
                            value={currentProfile.description}
                            onChange={e => setCurrentProfile({ ...currentProfile, description: e.target.value })}
                            placeholder="Optional description..."
                        />
                    </div>
                </div>

                {/* Nutrients Section (Global for Profile) */}
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50 mb-8 shadow-inner">
                    <h3 className="text-sm font-bold text-purple-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Beaker size={16} /> Global Nutrient Definitions
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-3 mb-5 p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                        <input
                            className="input text-sm flex-1 bg-transparent border-none focus:ring-0 px-0"
                            placeholder="Add new nutrient (e.g. BioGro)..."
                            value={newNutrientName}
                            onChange={e => setNewNutrientName(e.target.value)}
                        />
                        <div className="flex gap-2 shrink-0">
                            <select
                                className="input text-sm bg-slate-900 border-slate-700 w-32 focus:ring-purple-500/20"
                                value={newNutrientType}
                                onChange={e => setNewNutrientType(e.target.value as any)}
                            >
                                <option value="veg">Veg</option>
                                <option value="bloom">Bloom</option>
                                <option value="booster">Booster</option>
                                <option value="other">Other</option>
                            </select>
                            <button
                                onClick={addNutrientToProfile}
                                className="flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg shadow-lg shadow-purple-900/20 transition-all active:scale-95 w-[40px] h-[40px]"
                                style={{ backgroundColor: '#9333ea', color: 'white' }}
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {currentProfile.nutrients?.length === 0 && (
                            <p className="text-slate-500 text-xs italic w-full text-center py-2">No nutrients defined yet.</p>
                        )}
                        {currentProfile.nutrients?.map(nutrient => (
                            <div key={nutrient.id} className="group flex items-center gap-3 bg-slate-800/80 border border-slate-700/50 pl-3 pr-2 py-2 rounded-lg hover:border-slate-600 transition-all shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${nutrient.type === 'veg' ? 'bg-emerald-500 shadow-emerald-500/20' :
                                        nutrient.type === 'bloom' ? 'bg-purple-500 shadow-purple-500/20' :
                                            nutrient.type === 'booster' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-slate-400'
                                        }`} />
                                    <span className="text-slate-200 text-sm font-medium">{nutrient.name}</span>
                                </div>
                                <button
                                    onClick={() => removeNutrientFromProfile(nutrient.id)}
                                    className="text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Weeks Editor Tabs */}
                <div className="mb-8">
                    {/* Modern Tabs */}
                    <div className="flex p-1 bg-black/40 rounded-xl mb-6 relative border border-slate-700/50 shadow-inner">
                        {(['vegetation', 'flowering', 'drying'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActivePhaseTab(tab)}
                                className={`flex-1 py-3 text-sm font-bold capitalize rounded-lg transition-all duration-300 relative overflow-hidden group ${activePhaseTab === tab
                                    ? 'text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                                style={{
                                    backgroundColor: activePhaseTab === tab ? 'transparent' : 'rgba(30, 41, 59, 0.5)',
                                    color: activePhaseTab === tab ? 'white' : '#94a3b8'
                                }}
                            >
                                {/* Active Tab Background Indicator */}
                                {activePhaseTab === tab && (
                                    <div className={`absolute inset-0 opacity-100 transition-all duration-300 ${tab === 'vegetation' ? 'bg-emerald-600' :
                                        tab === 'flowering' ? 'bg-purple-600' : 'bg-blue-600'
                                        }`} />
                                )}
                                <span className="relative z-20 flex items-center justify-center gap-2">
                                    {tab === 'vegetation' && <span className={activePhaseTab === tab ? "text-emerald-400" : ""}>🌱</span>}
                                    {tab === 'flowering' && <span className={activePhaseTab === tab ? "text-purple-400" : ""}>🌻</span>}
                                    {tab === 'drying' && <span className={activePhaseTab === tab ? "text-blue-400" : ""}>🌬️</span>}
                                    {t.profiles.stages[tab] || tab}
                                </span>
                            </button>
                        ))}

                        {/* Selected Tab Indicator Shape (Optional, CSS-heavy) */}
                        {/* Instead, used simple BG change above */}
                    </div>

                    <div className="space-y-4">
                        {currentProfile.phases[activePhaseTab].weeks.map((weekConfig, idx) => (
                            <StageEditor
                                key={idx}
                                title={`Week ${idx + 1}`}
                                config={weekConfig}
                                availableNutrients={currentProfile.nutrients || []}
                                onChange={(cfg) => updateWeek(activePhaseTab, idx, cfg)}
                                onRemove={() => removeWeek(activePhaseTab, idx)}
                                t={t}
                            />
                        ))}

                        {/* Add Week Button - Styled */}
                        <button
                            onClick={() => addWeek(activePhaseTab)}
                            className="w-full py-4 bg-slate-800/40 border-2 border-dashed border-slate-700/50 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-slate-800 transition-all flex justify-center items-center gap-3 font-medium cursor-pointer mt-6 group"
                            style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', color: '#94a3b8' }}
                        >
                            <div className="bg-slate-800 p-2 rounded-full group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300">
                                <Plus size={20} />
                            </div>
                            <span className="uppercase tracking-wide text-xs font-bold">Add Week to {activePhaseTab}</span>
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.profiles.generalNotes}</label>
                    <textarea
                        className="input w-full min-h-[120px] bg-slate-800/50 border-slate-700 focus:border-emerald-500/50 focus:ring-emerald-500/20 p-4 leading-relaxed"
                        value={currentProfile.notes}
                        onChange={e => setCurrentProfile({ ...currentProfile, notes: e.target.value })}
                        placeholder={t.profiles.notesPlaceholder}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-slate-700/50">
                    <button onClick={() => setIsEditing(false)} className="btn btn-secondary px-6">
                        {t.profiles.cancel}
                    </button>
                    <button onClick={handleSave} className="btn btn-primary bg-emerald-600 hover:bg-emerald-500 px-6 shadow-lg shadow-emerald-900/20">
                        <Save size={18} /> {t.profiles.save}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold gradient-text">{t.profiles.title}</h2>
                    <p className="text-slate-400">{t.profiles.subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <label className="btn btn-secondary cursor-pointer">
                        <Upload size={18} /> {t.profiles.import}
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>
                    <button onClick={handleNew} className="btn btn-primary">
                        <Plus size={18} /> {t.profiles.newProfile}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(profile => (
                    <div key={profile.id} className="glass-panel p-6 hover:border-emerald-500/50 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-emerald-400">{profile.name}</h3>
                            <div className="flex gap-2 transition-opacity">
                                <button onClick={() => handleExport(profile)} className="bg-slate-800/50 hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm" title={t.profiles.export}>
                                    <Download size={16} />
                                </button>
                                <button onClick={() => handleEdit(profile)} className="bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-blue-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm" title={t.profiles.edit}>
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(profile.id)} className="bg-slate-800/50 hover:bg-red-900/20 text-slate-400 hover:text-red-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm" title={t.profiles.delete}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <p className="text-slate-300 text-sm mb-4 line-clamp-2">{profile.description || t.profiles.noDescription}</p>

                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 mb-4">
                            <div className="bg-slate-800/50 p-2 rounded text-center">
                                <span className="block font-bold text-emerald-500 mb-1">Veg</span>
                                {profile.phases?.vegetation?.weeks?.length || 0} wks
                            </div>
                            <div className="bg-slate-800/50 p-2 rounded text-center">
                                <span className="block font-bold text-purple-500 mb-1">Flower</span>
                                {profile.phases?.flowering?.weeks?.length || 0} wks
                            </div>
                            <div className="bg-slate-800/50 p-2 rounded text-center">
                                <span className="block font-bold text-blue-500 mb-1">Dry</span>
                                {profile.phases?.drying?.weeks?.length || 0} wks
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 flex justify-between">
                            <span>{profile.nutrients?.length || 0} Nutrient Defs</span>
                        </div>
                    </div>
                ))}

                {profiles.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                        <p className="mb-4">{t.profiles.noProfiles}</p>
                        <button onClick={handleNew} className="btn btn-secondary">{t.profiles.createFirst}</button>
                    </div>
                )}
            </div>
        </div>
    );
};
