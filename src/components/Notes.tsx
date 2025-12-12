import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import type { Note } from '../types';
import { Plus, Trash2, Edit2, FileText, Search, X, Calendar, Tag } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Download, Upload } from 'lucide-react';

export default function Notes() {
    const { t } = useLanguage();
    const { notes, addNote, updateNote, deleteNote } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<Omit<Note, 'id' | 'date'>>({
        title: '',
        content: '',
        tags: []
    });

    // Tag management for form
    const [currentTag, setCurrentTag] = useState('');

    const filteredNotes = useMemo(() => {
        if (!searchTerm) return notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const lowerTerm = searchTerm.toLowerCase();
        return notes.filter(n =>
            n.title.toLowerCase().includes(lowerTerm) ||
            n.content.toLowerCase().includes(lowerTerm) ||
            n.tags?.some(tag => tag.toLowerCase().includes(lowerTerm))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [notes, searchTerm]);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentTag.trim()) {
            e.preventDefault();
            if (!formData.tags?.includes(currentTag.trim())) {
                setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), currentTag.trim()] }));
            }
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tagToRemove) || [] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            const existingNote = notes.find(n => n.id === editingId);
            if (existingNote) {
                updateNote({ ...existingNote, ...formData });
            }
        } else {
            addNote({
                ...formData,
                id: uuidv4(),
                date: new Date().toISOString()
            });
        }
        resetForm();
    };

    const handleEdit = (note: Note) => {
        setFormData({
            title: note.title,
            content: note.content,
            tags: note.tags || []
        });
        setEditingId(note.id);
        setIsEditing(true);
    };

    const resetForm = () => {
        setFormData({ title: '', content: '', tags: [] });
        setEditingId(null);
        setIsEditing(false);
        setCurrentTag('');
    };

    const handleDelete = (id: string) => {
        if (confirm(t.common?.deleteConfirm || 'Are you sure?')) {
            deleteNote(id);
        }
    };

    const handleExport = (note: Note) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(note, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `note_${note.title.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleExportAll = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `all_notes_${format(new Date(), 'yyyy-MM-dd')}.json`);
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

                // Handle single note or array of notes
                const notesToImport = Array.isArray(importedData) ? importedData : [importedData];

                let count = 0;
                notesToImport.forEach((n: any) => {
                    // Validations (simple check)
                    if (n.title && n.content) {
                        // Check if exists (by ID) to update, else add (with new ID if strictly new, but usually import keeps ID or generates new one)
                        // Here we'll generate new ID to avoid conflicts unless ID matches exactly existing one (overwrite?)
                        // User strategy: usually import adds copy if different ID, or updates if same.
                        // Let's assume safe import: new ID implies copy.
                        // To be safe and simple: just add as new note with new ID to preserve existing data.
                        addNote({
                            ...n,
                            id: uuidv4(),
                            date: n.date || new Date().toISOString()
                        });
                        count++;
                    }
                });
                alert(`Imported ${count} notes successfully.`);
            } catch (error) {
                console.error("Import error:", error);
                alert("Failed to import notes. Invalid file format.");
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
                        {t.notes?.title || 'Notes'}
                    </h1>
                    <p className="text-slate-400 mt-1">{t.notes?.subtitle || 'Manage your personal grow notes'}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {!isEditing && (
                        <>
                            <button onClick={handleExportAll} className="btn btn-secondary" title={t.profiles?.export || 'Export All'}>
                                <Download size={18} />
                            </button>
                            <label className="btn btn-secondary cursor-pointer" title={t.profiles?.import || 'Import'}>
                                <Upload size={18} />
                                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                            </label>
                        </>
                    )}
                    {!isEditing && (
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={t.common?.search || 'Search...'}
                                className="input pl-10 w-full"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'} whitespace-nowrap`}
                    >
                        {isEditing ? <><X size={20} /> {t.common?.cancel}</> : <><Plus size={20} /> {t.notes?.addNote || 'New Note'}</>}
                    </button>
                </div>
            </div>

            {isEditing && (
                <div className="glass-panel p-6 animate-fade-in border-emerald-500/20">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        {editingId ? <Edit2 size={20} className="text-emerald-400" /> : <Plus size={20} className="text-emerald-400" />}
                        {editingId ? (t.notes?.editNote || 'Edit Note') : (t.notes?.addNote || 'Add New Note')}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">{t.notes?.noteTitle || 'Title'}</label>
                            <input
                                type="text"
                                required
                                className="input w-full"
                                placeholder="e.g. Nutrient Observation"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">{t.notes?.noteContent || 'Content'}</label>
                            <textarea
                                className="input w-full min-h-[200px] resize-y font-mono text-sm"
                                placeholder="Write your notes here..."
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">{t.notes?.tags || 'Tags'} <span className="text-xs text-slate-500 font-normal">(Press Enter to add)</span></label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.tags?.map(tag => (
                                    <span key={tag} className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs flex items-center gap-1 border border-emerald-500/20">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-emerald-200"><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="Add a tag..."
                                value={currentTag}
                                onChange={e => setCurrentTag(e.target.value)}
                                onKeyDown={handleAddTag}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={resetForm} className="btn btn-secondary">{t.common?.cancel}</button>
                            <button type="submit" className="btn btn-primary min-w-[120px]">{t.common?.save}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* List View */}
            {!isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ gap: '2rem' }}>
                    {filteredNotes.length === 0 ? (
                        <div className="col-span-full p-12 text-center text-slate-400 glass-panel">
                            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-white text-lg font-medium mb-1">{t.notes?.noNotes || 'No notes found'}</h3>
                            <p className="mb-6">{t.notes?.createFirst || 'Create your first note to get started.'}</p>
                            <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                                <Plus size={20} /> {t.notes?.addNote || 'Create Note'}
                            </button>
                        </div>
                    ) : (
                        filteredNotes.map(note => (
                            <div key={note.id} className="glass-panel p-6 flex flex-col group hover:border-emerald-500/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{note.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar size={12} />
                                            <span>{format(new Date(note.date), 'dd. MMM yyyy')}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(note)}
                                            className="bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-blue-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm"
                                            title={t.common?.edit}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleExport(note)}
                                            className="bg-slate-800/50 hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm"
                                            title={t.common?.export || "Export"}
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            className="bg-slate-800/50 hover:bg-red-900/20 text-slate-400 hover:text-red-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm"
                                            title={t.common?.delete}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-slate-400 text-sm mb-4 line-clamp-4 whitespace-pre-line flex-1">
                                    {note.content}
                                </div>

                                {note.tags && note.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-700/50">
                                        {note.tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                                                <Tag size={10} /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
