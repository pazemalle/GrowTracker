import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import type { Seed } from '../types';

import { Plus, Trash2, Edit2, Sprout, ArrowUpDown, X, Download, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export default function SeedBank() {
    const { t } = useLanguage();
    const { seeds, addSeed, updateSeed, deleteSeed } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Seed; direction: 'asc' | 'desc' } | null>(null);

    const [formData, setFormData] = useState<Omit<Seed, 'id'>>({
        name: '',
        breeder: '',
        strainType: 'feminized',
        thc: '',
        flowerTime: '',
        taste: '',
        stock: 0,
        notes: '',
        onWatchlist: false
    });

    const handleSort = (key: keyof Seed) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedSeeds = useMemo(() => {
        let sortableSeeds = [...seeds];
        if (sortConfig !== null) {
            sortableSeeds.sort((a, b) => {
                // Handle potentially undefined values safely
                const aValue = a[sortConfig.key] ?? '';
                const bValue = b[sortConfig.key] ?? '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableSeeds;
    }, [seeds, sortConfig]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const seedData = { ...formData };

        if (editingId) {
            updateSeed({ ...seedData, id: editingId });
        } else {
            addSeed({ ...seedData, id: uuidv4() });
        }
        resetForm();
    };

    const handleEdit = (seed: Seed) => {
        setFormData({
            name: seed.name,
            breeder: seed.breeder,
            strainType: seed.strainType,
            thc: seed.thc || '',
            flowerTime: seed.flowerTime || '',
            taste: seed.taste || '',
            stock: seed.stock,
            notes: seed.notes,
            onWatchlist: seed.onWatchlist // Keep existing watchlist status
        });
        setEditingId(seed.id);
        setIsEditing(true);
    };

    const resetForm = () => {
        setFormData({
            name: '', breeder: '', strainType: 'feminized',
            thc: '', flowerTime: '', taste: '', stock: 0, notes: '',
            onWatchlist: false
        });
        setEditingId(null);
        setIsEditing(false);
    };

    const handleExport = (seed: Seed) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(seed, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `seed_${seed.name.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleExportAll = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(seeds, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `all_seeds_${format(new Date(), 'yyyy-MM-dd')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target?.result as string);
                const seedsToImport = Array.isArray(importedData) ? importedData : [importedData];

                let count = 0;
                seedsToImport.forEach((s: any) => {
                    if (s.name) {
                        addSeed({
                            ...s,
                            id: uuidv4()
                        });
                        count++;
                    }
                });
                alert(`Imported ${count} seeds successfully.`);
            } catch (error) {
                console.error("Import error:", error);
                alert("Failed to import seeds. Invalid file format.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };


    const getTypeColor = (type: string) => {
        switch (type) {
            case 'automatic': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
            case 'photoperiodic': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
            case 'regular': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
            default: return 'text-pink-400 border-pink-400/30 bg-pink-400/10';
        }
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof Seed }) => {
        if (sortConfig?.key === columnKey) {
            return <ArrowUpDown size={14} className={`ml-1 inline transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />;
        }
        return <ArrowUpDown size={14} className="ml-1 inline text-slate-600 opacity-50 group-hover:opacity-100" />;
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
                        {t.seedBank.title}
                    </h1>
                    <p className="text-slate-400 mt-1">{t.seedBank.subtitle}</p>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
                >
                    {isEditing ? <><X size={20} /> {t.common.cancel}</> : <><Plus size={20} /> {t.seedBank.addStrain}</>}
                </button>
            </div>

            {isEditing && (
                <div className="glass-panel p-6 animate-fade-in border-emerald-500/20">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        {editingId ? <Edit2 size={20} className="text-emerald-400" /> : <Plus size={20} className="text-emerald-400" />}
                        {editingId ? t.seedBank.editStrain : t.seedBank.addStrain}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.seedBank.strainName}</label>
                                <input
                                    type="text"
                                    required
                                    className="input w-full"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.seedBank.breeder}</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.breeder}
                                    onChange={e => setFormData({ ...formData, breeder: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.seedBank.type}</label>
                                <select
                                    className="input w-full"
                                    value={formData.strainType}
                                    onChange={e => setFormData({ ...formData, strainType: e.target.value as any })}
                                >
                                    <option value="feminized">{t.seedBank.feminized}</option>
                                    <option value="automatic">{t.seedBank.automatic}</option>
                                    <option value="photoperiodic">{t.seedBank.photoperiodic}</option>
                                    <option value="regular">{t.seedBank.regular}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.seedBank.stock}</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="input w-full"
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.seedBank.thc}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 25%"
                                    className="input w-full"
                                    value={formData.thc}
                                    onChange={e => setFormData({ ...formData, thc: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t.seedBank.flowerTime}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 8-9 W"
                                    className="input w-full"
                                    value={formData.flowerTime}
                                    onChange={e => setFormData({ ...formData, flowerTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">{t.seedBank.taste}</label>
                            <input
                                type="text"
                                placeholder="e.g. Fruity, Berry, Diesel"
                                className="input w-full"
                                value={formData.taste}
                                onChange={e => setFormData({ ...formData, taste: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">{t.seedBank.notes}</label>
                            <textarea
                                className="input w-full min-h-[80px] resize-y"
                                placeholder="Planned for next run? Specific pheno details?"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={resetForm} className="btn btn-secondary">{t.common.cancel}</button>
                            <button type="submit" className="btn btn-primary min-w-[120px]">{t.common.save}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table View */}
            {!isEditing && (
                <div className="glass-panel overflow-hidden">
                    {sortedSeeds.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sprout className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-white text-lg font-medium mb-1">{t.seedBank.noSeeds}</h3>
                            <p className="mb-6">{t.seedBank.addFirst}</p>
                            <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                                <Plus size={20} /> {t.seedBank.addStrain}
                            </button>
                            <label className="btn btn-secondary cursor-pointer ml-2">
                                <Upload size={18} /> {t.profiles?.import || 'Import'}
                                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                            </label>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="flex justify-end p-4 border-b border-slate-700/50 gap-2">
                                <button onClick={handleExportAll} className="btn btn-secondary" title={t.profiles?.export || 'Export All'}>
                                    <Download size={18} /> {t.profiles?.export || 'Export All'}
                                </button>
                                <label className="btn btn-secondary cursor-pointer" title={t.profiles?.import || 'Import'}>
                                    <Upload size={18} /> {t.profiles?.import || 'Import'}
                                    <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                                </label>
                                <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                                    <Plus size={18} /> {t.seedBank.addStrain}
                                </button>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/20">
                                        <th className="p-4 cursor-pointer hover:text-emerald-400 group transition-colors" onClick={() => handleSort('name')}>
                                            {t.seedBank.strainName} <SortIcon columnKey="name" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-emerald-400 group transition-colors" onClick={() => handleSort('breeder')}>
                                            {t.seedBank.breeder} <SortIcon columnKey="breeder" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-emerald-400 group transition-colors" onClick={() => handleSort('strainType')}>
                                            {t.seedBank.type} <SortIcon columnKey="strainType" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-emerald-400 group transition-colors text-right" onClick={() => handleSort('stock')}>
                                            {t.seedBank.stock} <SortIcon columnKey="stock" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-emerald-400 group transition-colors" onClick={() => handleSort('thc')}>
                                            {t.seedBank.thc} <SortIcon columnKey="thc" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-emerald-400 group transition-colors" onClick={() => handleSort('flowerTime')}>
                                            {t.seedBank.flowerTime} <SortIcon columnKey="flowerTime" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-emerald-400 group transition-colors" onClick={() => handleSort('taste')}>
                                            {t.seedBank.taste} <SortIcon columnKey="taste" />
                                        </th>
                                        <th className="p-4 text-right">{t.seedBank.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {sortedSeeds.map(seed => (
                                        <tr key={seed.id} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="p-4 font-medium text-white">
                                                {seed.name}
                                                {seed.notes && <div className="text-xs text-slate-500 font-normal truncate max-w-[150px]">{seed.notes}</div>}
                                            </td>
                                            <td className="p-4 text-slate-300">{seed.breeder || '-'}</td>
                                            <td className="p-4">
                                                <span className={`text-xs px-2 py-0.5 rounded border ${getTypeColor(seed.strainType)}`}>
                                                    {seed.strainType}
                                                </span>
                                            </td>
                                            <td className={`p-4 text-right font-bold ${seed.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {seed.stock}
                                            </td>
                                            <td className="p-4 text-slate-400">{seed.thc || '-'}</td>
                                            <td className="p-4 text-slate-400">{seed.flowerTime || '-'}</td>
                                            <td className="p-4 text-slate-400 truncate max-w-[150px]" title={seed.taste}>{seed.taste || '-'}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(seed)} className="bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-blue-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm" title={t.common.edit}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleExport(seed)} className="bg-slate-800/50 hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm" title={t.common?.export || "Export"}>
                                                        <Download size={16} />
                                                    </button>
                                                    <button onClick={() => deleteSeed(seed.id)} className="bg-slate-800/50 hover:bg-red-900/20 text-slate-400 hover:text-red-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm" title={t.common.delete}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
