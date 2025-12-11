import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import type { Profile, StageConfig, Nutrient, NutrientEntry, StageTask } from '../types';
import { Plus, Edit2, Trash2, Save, X, Download, Upload, Beaker, Calendar, FileText, ChevronDown, ChevronUp, Activity } from 'lucide-react';

const EmptyStageConfig: StageConfig = {
    temp: '', humidity: '', vpd: '', dli: '', ppfd: '', lightCycle: '',
    nutrients: [], notes: '', schedule: []
};

const InitialProfile: Profile = {
    id: '',
    name: '',
    description: '',
    vegiDurationWeeks: 4,
    flowerDurationWeeks: 9,
    stages: {
        seedling: { ...EmptyStageConfig },
        vegetation: { ...EmptyStageConfig },
        flowering: { ...EmptyStageConfig },
        drying: { ...EmptyStageConfig },
        curing: { ...EmptyStageConfig },
    },
    nutrients: [],
    notes: '',
};

interface StageEditorProps {
    stage: string;
    config: StageConfig;
    availableNutrients: Nutrient[];
    onChange: (config: StageConfig) => void;
    t: any;
}

const StageEditor: React.FC<StageEditorProps> = ({ stage, config, availableNutrients, onChange, t }) => {
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
            unit: 'ml/L Wasser' // Default, could be selectable
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
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-800 transition-colors"
            >
                <h4 className="capitalize font-medium text-emerald-400 flex items-center gap-2">
                    {t.profiles.stages[stage] || stage}
                    <span className="text-xs text-slate-500 font-normal ml-2">
                        ({config.nutrients.length} nuts, {config.schedule.length} tasks)
                    </span>
                </h4>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isExpanded && (
                <div className="p-4 border-t border-slate-700 space-y-6">
                    {/* Environment */}
                    <div>
                        <h5 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                            <Activity size={14} /> {t.growDetail.environment}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">{t.growDetail.temp}</label>
                                <input className="input text-sm" placeholder={t.profiles.tempPlaceholder} value={config.temp} onChange={e => onChange({ ...config, temp: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">{t.growDetail.humidity}</label>
                                <input className="input text-sm" placeholder={t.profiles.humidityPlaceholder} value={config.humidity} onChange={e => onChange({ ...config, humidity: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">{t.growDetail.vpd}</label>
                                <input className="input text-sm" placeholder="kPa" value={config.vpd || ''} onChange={e => onChange({ ...config, vpd: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">{t.growDetail.dli}</label>
                                <input className="input text-sm" placeholder="mol/m²/d" value={config.dli || ''} onChange={e => onChange({ ...config, dli: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">{t.growDetail.ppfd}</label>
                                <input className="input text-sm" placeholder="µmol/m²/s" value={config.ppfd || ''} onChange={e => onChange({ ...config, ppfd: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">{t.growDetail.lightCycle}</label>
                                <input className="input text-sm" placeholder="e.g. 18/6" value={config.lightCycle || ''} onChange={e => onChange({ ...config, lightCycle: e.target.value })} list="light-cycles" />
                            </div>
                        </div>
                    </div>

                    {/* Nutrients */}
                    <div>
                        <h5 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
                            <Beaker size={14} /> {t.growDetail.nutrients}
                        </h5>
                        <div className="flex gap-2 mb-2">
                            <select className="input text-sm flex-1" value={newNutrientId} onChange={e => setNewNutrientId(e.target.value)}>
                                <option value="">Select Nutrient</option>
                                {availableNutrients.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                            </select>
                            <input className="input text-sm w-20" placeholder="ml/L" value={newNutrientAmount} onChange={e => setNewNutrientAmount(e.target.value)} type="number" />
                            <button onClick={handleAddNutrient} className="btn btn-secondary p-1"><Plus size={16} /></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {config.nutrients.map((n, idx) => (
                                <span key={idx} className="bg-purple-900/30 border border-purple-500/30 text-purple-300 px-2 py-1 rounded text-xs flex items-center gap-2">
                                    {n.name}: {n.amount} {n.unit}
                                    <button onClick={() => handleRemoveNutrient(idx)} className="hover:text-red-400"><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Schedule */}
                    <div>
                        <h5 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <Calendar size={14} /> Schedule
                        </h5>
                        <div className="flex gap-2 mb-2">
                            <input className="input text-sm w-20" placeholder="Day" value={newTaskDay} onChange={e => setNewTaskDay(e.target.value)} type="number" />
                            <input className="input text-sm flex-1" placeholder="Task description" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} />
                            <button onClick={handleAddTask} className="btn btn-secondary p-1"><Plus size={16} /></button>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {config.schedule.map(task => (
                                <div key={task.id} className="flex justify-between items-center bg-slate-900/50 p-2 rounded text-xs">
                                    <span className="text-blue-300 font-bold w-12">Day {task.day}</span>
                                    <span className="text-slate-300 flex-1">{task.task}</span>
                                    <button onClick={() => handleRemoveTask(task.id)} className="text-slate-500 hover:text-red-400"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <h5 className="text-sm font-bold text-slate-400 mb-2 flex items-center gap-2">
                            <FileText size={14} /> Notes
                        </h5>
                        <textarea
                            className="input text-sm min-h-[60px]"
                            placeholder="Stage specific notes..."
                            value={config.notes}
                            onChange={e => onChange({ ...config, notes: e.target.value })}
                        />
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

    // Nutrient State for Edit Form
    const [newNutrientName, setNewNutrientName] = useState('');
    const [newNutrientType, setNewNutrientType] = useState<'veg' | 'bloom' | 'booster' | 'other'>('other');

    const handleEdit = (profile: Profile) => {
        setCurrentProfile({ ...profile, nutrients: profile.nutrients || [] });
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
        downloadAnchorNode.setAttribute("download", `${profile.name.replace(/\s+/g, '_')}_profile.json`);
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
                        const importedProfile = JSON.parse(e.target.result as string) as Profile;
                        // Ensure new ID to avoid conflicts
                        importedProfile.id = uuidv4();
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

    if (isEditing) {
        return (
            <div className="glass-panel p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-emerald-400">
                        {profiles.find(p => p.id === currentProfile.id) ? t.profiles.editProfile : t.profiles.createProfile}
                    </h2>
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-700 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{t.profiles.profileName}</label>
                            <input
                                className="input"
                                value={currentProfile.name}
                                onChange={e => setCurrentProfile({ ...currentProfile, name: e.target.value })}
                                placeholder="e.g., Northern Lights Auto"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{t.profiles.description}</label>
                            <input
                                className="input"
                                value={currentProfile.description}
                                onChange={e => setCurrentProfile({ ...currentProfile, description: e.target.value })}
                                placeholder="Short description..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{t.profiles.estVegiWeeks}</label>
                            <input
                                type="number"
                                className="input"
                                value={currentProfile.vegiDurationWeeks}
                                onChange={e => setCurrentProfile({ ...currentProfile, vegiDurationWeeks: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{t.profiles.estFlowerWeeks}</label>
                            <input
                                type="number"
                                className="input"
                                value={currentProfile.flowerDurationWeeks}
                                onChange={e => setCurrentProfile({ ...currentProfile, flowerDurationWeeks: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {/* Nutrients Section */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                            <Beaker size={18} /> {t.growDetail.nutrients}
                        </h3>

                        <div className="flex gap-2 mb-4">
                            <input
                                className="input text-sm flex-1"
                                placeholder={t.growDetail.nutrientName}
                                value={newNutrientName}
                                onChange={e => setNewNutrientName(e.target.value)}
                            />
                            <select
                                className="input text-sm w-32"
                                value={newNutrientType}
                                onChange={e => setNewNutrientType(e.target.value as any)}
                            >
                                <option value="veg">Veg</option>
                                <option value="bloom">Bloom</option>
                                <option value="booster">Booster</option>
                                <option value="other">Other</option>
                            </select>
                            <button onClick={addNutrientToProfile} className="btn btn-primary p-2">
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {currentProfile.nutrients?.map(nutrient => (
                                <div key={nutrient.id} className="flex justify-between items-center bg-slate-900 p-2 rounded">
                                    <div>
                                        <span className="font-bold text-slate-200">{nutrient.name}</span>
                                        <span className="ml-2 text-xs text-slate-500 uppercase bg-slate-800 px-1 rounded">{nutrient.type}</span>
                                    </div>
                                    <button onClick={() => removeNutrientFromProfile(nutrient.id)} className="text-slate-500 hover:text-red-400">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {(!currentProfile.nutrients || currentProfile.nutrients.length === 0) && (
                                <p className="text-sm text-slate-500 italic">No default nutrients defined.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-emerald-500 mb-3">{t.profiles.environmentTargets}</h3>
                        <div className="grid gap-4">
                            {(Object.keys(currentProfile.stages) as Array<keyof typeof currentProfile.stages>).map((stage) => (
                                <StageEditor
                                    key={stage}
                                    stage={stage}
                                    config={currentProfile.stages[stage]}
                                    availableNutrients={currentProfile.nutrients || []}
                                    onChange={(newConfig) => setCurrentProfile({
                                        ...currentProfile,
                                        stages: {
                                            ...currentProfile.stages,
                                            [stage]: newConfig
                                        }
                                    })}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t.profiles.generalNotes}</label>
                        <textarea
                            className="input min-h-[100px]"
                            value={currentProfile.notes}
                            onChange={e => setCurrentProfile({ ...currentProfile, notes: e.target.value })}
                            placeholder={t.profiles.notesPlaceholder}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <button onClick={() => setIsEditing(false)} className="btn btn-secondary">{t.profiles.cancel}</button>
                        <button onClick={handleSave} className="btn btn-primary">
                            <Save size={18} /> {t.profiles.save}
                        </button>
                    </div>
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

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4">
                            <div className="bg-slate-800/50 p-2 rounded">
                                <span className="block font-semibold text-emerald-500">{t.profiles.stages.vegetation}</span>
                                {profile.vegiDurationWeeks} {t.profiles.weeks}
                            </div>
                            <div className="bg-slate-800/50 p-2 rounded">
                                <span className="block font-semibold text-purple-500">{t.profiles.stages.flowering}</span>
                                {profile.flowerDurationWeeks} {t.profiles.weeks}
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 flex justify-between">
                            <span>{Object.keys(profile.stages).length} {t.profiles.stagesConfigured}</span>
                            <span>{profile.nutrients?.length || 0} {t.growDetail.nutrients}</span>
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
