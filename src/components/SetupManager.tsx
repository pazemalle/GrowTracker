import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import type { GrowSetup } from '../types';
import { Plus, Trash2, Edit2, Hexagon, Wind, Lightbulb, X, Fan, Filter } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function SetupManager() {
    const { t } = useLanguage();
    const { setups, addSetup, updateSetup, deleteSetup } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Omit<GrowSetup, 'id'>>({
        name: '',
        tent: '',
        lights: '',
        exhaust: '',
        filter: '',
        circulation: '',
        notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            updateSetup({ ...formData, id: editingId });
        } else {
            addSetup({ ...formData, id: uuidv4() });
        }

        resetForm();
    };

    const handleEdit = (setup: GrowSetup) => {
        setFormData({
            name: setup.name,
            tent: setup.tent,
            lights: setup.lights,
            exhaust: setup.exhaust,
            filter: setup.filter,
            circulation: setup.circulation,
            notes: setup.notes
        });
        setEditingId(setup.id);
        setIsEditing(true);
    };

    const resetForm = () => {
        setFormData({ name: '', tent: '', lights: '', exhaust: '', filter: '', circulation: '', notes: '' });
        setEditingId(null);
        setIsEditing(false);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
                        {t.setupManager.title}
                    </h1>
                    <p className="text-slate-400 mt-1">{t.setupManager.subtitle}</p>
                </div>

                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
                >
                    {isEditing ? <><X size={20} /> {t.common.cancel}</> : <><Plus size={20} /> {t.setupManager.newSetup}</>}
                </button>
            </div>

            {isEditing && (
                <div className="glass-panel p-6 animate-fade-in border-emerald-500/20">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        {editingId ? <Edit2 size={20} className="text-emerald-400" /> : <Plus size={20} className="text-emerald-400" />}
                        {editingId ? t.setupManager.editSetup : t.setupManager.createSetup}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">{t.setupManager.setupName}</label>
                            <input
                                type="text"
                                required
                                className="input w-full"
                                placeholder={t.setupManager.setupName}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <Hexagon size={16} className="text-emerald-400" /> {t.setupManager.tent}
                                </label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="e.g. 80x80x180cm"
                                    value={formData.tent}
                                    onChange={e => setFormData({ ...formData, tent: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <Lightbulb size={16} className="text-emerald-400" /> {t.setupManager.lights}
                                </label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="e.g. Sanlight EVO 4-80"
                                    value={formData.lights}
                                    onChange={e => setFormData({ ...formData, lights: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <Wind size={16} className="text-emerald-400" /> {t.setupManager.exhaust}
                                </label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="e.g. AC Infinity T6"
                                    value={formData.exhaust}
                                    onChange={e => setFormData({ ...formData, exhaust: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <Filter size={16} className="text-emerald-400" /> {t.setupManager.filter}
                                </label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="e.g. Rhino Pro"
                                    value={formData.filter}
                                    onChange={e => setFormData({ ...formData, filter: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <Fan size={16} className="text-emerald-400" /> {t.setupManager.circulation}
                                </label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="e.g. 2x Secret Jardin Monkey Fan"
                                    value={formData.circulation}
                                    onChange={e => setFormData({ ...formData, circulation: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">{t.setupManager.notes}</label>
                            <textarea
                                className="input w-full min-h-[100px] resize-y"
                                placeholder="Additional equipment, details, etc."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="btn btn-secondary"
                            >
                                {t.common.cancel}
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary min-w-[120px]"
                            >
                                {editingId ? t.setupManager.updateSetup : t.setupManager.createSetup}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {setups.length === 0 && !isEditing ? (
                <div className="glass-panel p-12 text-center border-dashed border-slate-700">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Hexagon className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">{t.setupManager.noSetups}</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">
                        {t.setupManager.createFirst}
                    </p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-primary mt-6"
                    >

                        <Plus size={20} />
                        {t.setupManager.createFirst}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {setups.map(setup => (
                        <div key={setup.id} className="glass-panel p-5 group relative transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Hexagon size={24} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white leading-tight">{setup.name}</h3>
                                        {setup.tent && <p className="text-xs text-slate-400 mt-0.5">{setup.tent}</p>}
                                    </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(setup)}
                                        className="p-2 hover:bg-slate-700/50 rounded-lg text-blue-400 transition-colors"
                                        title="Edit Setup"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteSetup(setup.id)}
                                        className="p-2 hover:bg-slate-700/50 rounded-lg text-red-400 transition-colors"
                                        title="Delete Setup"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {setup.lights && (
                                        <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/50">
                                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                                <Lightbulb size={12} />
                                                <span>Lights</span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-200 truncate" title={setup.lights}>
                                                {setup.lights}
                                            </div>
                                        </div>
                                    )}
                                    {setup.exhaust && (
                                        <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/50">
                                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                                <Wind size={12} />
                                                <span>{t.setupManager.exhaust}</span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-200 truncate" title={setup.exhaust}>
                                                {setup.exhaust}
                                            </div>
                                        </div>
                                    )}
                                    {setup.filter && (
                                        <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/50">
                                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                                <Filter size={12} />
                                                <span>{t.setupManager.filter}</span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-200 truncate" title={setup.filter}>
                                                {setup.filter}
                                            </div>
                                        </div>
                                    )}
                                    {setup.circulation && (
                                        <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/50">
                                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                                <Fan size={12} />
                                                <span>{t.setupManager.circulation}</span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-200 truncate" title={setup.circulation}>
                                                {setup.circulation}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {setup.notes && (
                                    <div className="pt-3 border-t border-slate-700/50">
                                        <p className="text-xs text-slate-500 line-clamp-2 italic">
                                            {setup.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
