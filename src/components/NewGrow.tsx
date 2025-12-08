import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import type { Grow } from '../types';
import { Sprout, Calendar, ArrowRight, Hexagon } from 'lucide-react';

export const NewGrow: React.FC = () => {
    const navigate = useNavigate();
    const { profiles, addGrow, setups = [] } = useStore();
    const { t } = useLanguage();

    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [selectedSetupIds, setSelectedSetupIds] = useState<string[]>([]);
    const [strainDistribution, setStrainDistribution] = useState<{ id: string, name: string, count: number }[]>([]);
    const [newStrainName, setNewStrainName] = useState('');
    const [newStrainCount, setNewStrainCount] = useState<number>(1);

    // Helpers for Strain Distribution
    const addStrain = () => {
        if (!newStrainName) return;
        setStrainDistribution([...strainDistribution, {
            id: uuidv4(),
            name: newStrainName,
            count: newStrainCount
        }]);
        setNewStrainName('');
        setNewStrainCount(1);
    };

    const removeStrain = (id: string) => {
        setStrainDistribution(strainDistribution.filter(s => s.id !== id));
    };

    const toggleSetup = (id: string) => {
        if (selectedSetupIds.includes(id)) {
            setSelectedSetupIds(selectedSetupIds.filter(sId => sId !== id));
        } else {
            setSelectedSetupIds([...selectedSetupIds, id]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !startDate) return;

        // Calculate total plants from distribution
        const finalPlantCount = strainDistribution.reduce((acc, curr) => acc + curr.count, 0);

        const newGrow: Grow = {
            id: uuidv4(),
            name,
            startDate,
            profileId: selectedProfileId || undefined,
            setupIds: selectedSetupIds,
            status: 'active',
            currentStage: 'seedling',
            logs: [],
            plantCount: finalPlantCount > 0 ? finalPlantCount : undefined,
            strainDistribution: strainDistribution
        };

        addGrow(newGrow);
        navigate(`/grow/${newGrow.id}`);
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold gradient-text mb-2">{t.newGrow.title}</h2>
            <p className="text-slate-400 mb-8">{t.newGrow.subtitle}</p>

            <form onSubmit={handleSubmit} className="glass-panel p-8 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">{t.newGrow.growName}</label>
                    <div className="relative">
                        <Sprout className="absolute left-3 top-3 text-slate-500" size={20} />
                        <input
                            type="text"
                            required
                            className="input pl-10"
                            placeholder={t.newGrow.growNamePlaceholder}
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">{t.newGrow.startDate}</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 text-slate-500" size={20} />
                        <input
                            type="date"
                            required
                            className="input pl-10"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Setup Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                        <Hexagon size={16} className="text-emerald-500" /> Grow Setup
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {setups.map(s => (
                            <div
                                key={s.id}
                                onClick={() => toggleSetup(s.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${selectedSetupIds.includes(s.id)
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSetupIds.includes(s.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                                    {selectedSetupIds.includes(s.id) && <Hexagon size={10} className="text-white fill-white" />}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{s.name}</div>
                                    <div className="text-xs opacity-70">{s.tent || 'No Size'}</div>
                                </div>
                            </div>
                        ))}
                        {setups.length === 0 && (
                            <p className="text-slate-500 text-sm italic col-span-2">No setups created yet.</p>
                        )}
                    </div>
                </div>

                {/* Strains & Plant Count Section */}
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4">
                    <label className="block text-sm font-bold text-slate-300">{t.newGrow.plantCount} & {t.newGrow.strains}</label>

                    {/* Add Strain Input */}
                    <div className="flex gap-2">
                        <input
                            className="input flex-1 text-sm"
                            placeholder={t.newGrow.strain}
                            value={newStrainName}
                            onChange={e => setNewStrainName(e.target.value)}
                        />
                        <input
                            className="input w-20 text-sm"
                            type="number"
                            min="1"
                            value={newStrainCount}
                            onChange={e => setNewStrainCount(parseInt(e.target.value))}
                        />
                        <button type="button" onClick={addStrain} className="btn btn-secondary p-2 hover:bg-emerald-500/20 hover:text-emerald-400">
                            +
                        </button>
                    </div>

                    {/* Active Strains List */}
                    {strainDistribution.length > 0 && (
                        <div className="space-y-2">
                            {strainDistribution.map(s => (
                                <div key={s.id} className="flex justify-between items-center bg-slate-800 px-3 py-2 rounded text-sm border border-slate-700">
                                    <span className="text-slate-200">
                                        <span className="font-bold text-emerald-400 mr-2">{s.count}x</span>
                                        {s.name}
                                    </span>
                                    <button type="button" onClick={() => removeStrain(s.id)} className="text-slate-500 hover:text-red-400">
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <div className="text-right text-xs text-slate-500 mt-1">
                                Total Plants: <span className="text-emerald-400 font-bold">{strainDistribution.reduce((acc, curr) => acc + curr.count, 0)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">{t.newGrow.selectProfile}</label>
                    <select
                        className="input appearance-none"
                        value={selectedProfileId}
                        onChange={e => setSelectedProfileId(e.target.value)}
                    >
                        <option value="">{t.newGrow.noProfile}</option>
                        {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                        {t.newGrow.profileHelp}
                    </p>
                </div>

                <div className="pt-6 border-t border-slate-700 flex justify-end">
                    <button type="submit" className="btn btn-primary px-8 py-3 text-lg">
                        {t.newGrow.startGrow} <ArrowRight size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};
