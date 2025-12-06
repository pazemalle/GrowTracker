import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { LogEntry, Stage, NutrientEntry, Nutrient, StrainDistribution } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays, differenceInDays } from 'date-fns';
import {
    Calendar, Camera, Save, Share2,
    AlertCircle, Download, Trash2, Edit2, X, Droplets, Thermometer, Sun, Beaker, Plus, Wind, Activity, ArrowUpDown
} from 'lucide-react';

const calculateVPD = (temp: number, humidity: number): string => {
    if (!temp || !humidity) return '';
    const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
    const vpd = svp * (1 - humidity / 100);
    return vpd.toFixed(2);
};

const calculateDLI = (ppfd: number, hours: number): string => {
    if (!ppfd || !hours) return '';
    const dli = (ppfd * hours * 3600) / 1000000;
    return dli.toFixed(1);
};

const calculatePPFD = (dli: number, hours: number): string => {
    if (!dli || !hours) return '';
    const ppfd = (dli * 1000000) / (hours * 3600);
    return Math.round(ppfd).toString();
};

const getHoursFromCycle = (cycle: string): number => {
    if (!cycle) return 0;
    // Try to match "18/6" format
    const match = cycle.match(/^(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
};

export const GrowDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { grows, profiles, updateGrow, deleteGrow } = useStore();
    const { t } = useLanguage();

    const grow = grows.find(g => g.id === id);
    const profile = profiles.find(p => p.id === grow?.profileId);

    // Grow Edit State
    const [isEditingGrow, setIsEditingGrow] = useState(false);
    const [editGrowName, setEditGrowName] = useState('');
    const [editGrowDate, setEditGrowDate] = useState('');
    const [editGrowProfileId, setEditGrowProfileId] = useState('');
    const [editPlantCount, setEditPlantCount] = useState<number | ''>('');
    const [editStrainDistribution, setEditStrainDistribution] = useState<StrainDistribution[]>([]);

    // Strain Edit Helper State
    const [newStrainName, setNewStrainName] = useState('');
    const [newStrainCount, setNewStrainCount] = useState<number>(1);

    // Log Edit State
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editLogTitle, setEditLogTitle] = useState('');
    const [editLogContent, setEditLogContent] = useState('');
    const [editLogDate, setEditLogDate] = useState('');
    const [editLogStage, setEditLogStage] = useState<Stage>('seedling');
    const [editLogDay, setEditLogDay] = useState<number>(0);
    const [editLogWater, setEditLogWater] = useState<string>('');
    const [editLogTemp, setEditLogTemp] = useState<string>('');
    const [editLogHumidity, setEditLogHumidity] = useState<string>('');
    const [editLogVpd, setEditLogVpd] = useState<string>('');
    const [editLogDli, setEditLogDli] = useState<string>('');
    const [editLogPpfd, setEditLogPpfd] = useState<string>('');
    const [editLogLightCycle, setEditLogLightCycle] = useState<string>('');
    const [editLogNutrients, setEditLogNutrients] = useState<NutrientEntry[]>([]);
    const [editLogImages, setEditLogImages] = useState<string[]>([]);

    // New Log State
    const [newLogContent, setNewLogContent] = useState('');
    const [newLogTitle, setNewLogTitle] = useState('');
    const [newLogStage, setNewLogStage] = useState<Stage>('seedling');
    const [newLogImages, setNewLogImages] = useState<string[]>([]);

    // Sort & Filter State
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filterStage, setFilterStage] = useState<string>('all');

    const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [newLogDay, setNewLogDay] = useState<number>(0);
    const [newLogWater, setNewLogWater] = useState<string>('');
    const [newLogTemp, setNewLogTemp] = useState<string>('');
    const [newLogHumidity, setNewLogHumidity] = useState<string>('');
    const [newLogVpd, setNewLogVpd] = useState<string>('');
    const [newLogDli, setNewLogDli] = useState<string>('');
    const [newLogPpfd, setNewLogPpfd] = useState<string>('');
    const [newLogLightCycle, setNewLogLightCycle] = useState<string>('');
    const [newLogNutrients, setNewLogNutrients] = useState<NutrientEntry[]>([]);

    // Nutrient Selection State
    const [selectedNutrientId, setSelectedNutrientId] = useState<string>('');
    const [nutrientAmount, setNutrientAmount] = useState<string>('');
    const [nutrientUnit, setNutrientUnit] = useState<'ml/L' | 'g/L'>('ml/L');
    const [isAddingCustomNutrient, setIsAddingCustomNutrient] = useState(false);
    const [customNutrientName, setCustomNutrientName] = useState('');
    const [customNutrientType, setCustomNutrientType] = useState<'veg' | 'bloom' | 'booster' | 'other'>('other');

    if (!grow) return <div>Grow not found</div>;

    // Available Nutrients (Profile + Custom)
    const availableNutrients = useMemo(() => {
        const profileNutrients = profile?.nutrients || [];
        const customNutrients = grow.customNutrients || [];
        return [...profileNutrients, ...customNutrients];
    }, [profile, grow.customNutrients]);

    // Auto-calculate Day when Date changes
    useEffect(() => {
        if (grow.startDate && newLogDate) {
            const diff = differenceInDays(new Date(newLogDate), new Date(grow.startDate)) + 1;
            setNewLogDay(diff > 0 ? diff : 1);
        }
    }, [newLogDate, grow.startDate]);

    useEffect(() => {
        if (grow.startDate && editLogDate) {
            // Only update if not manually set? For now, auto-update is safer
            const diff = differenceInDays(new Date(editLogDate), new Date(grow.startDate)) + 1;
            setEditLogDay(diff > 0 ? diff : 1);
        }
    }, [editLogDate, grow.startDate]);

    // Auto-calculate VPD for New Log
    useEffect(() => {
        if (newLogTemp && newLogHumidity) {
            const vpd = calculateVPD(parseFloat(newLogTemp), parseFloat(newLogHumidity));
            setNewLogVpd(vpd);
        }
    }, [newLogTemp, newLogHumidity]);

    // Auto-calculate VPD for Edit Log
    useEffect(() => {
        if (editLogTemp && editLogHumidity) {
            const vpd = calculateVPD(parseFloat(editLogTemp), parseFloat(editLogHumidity));
            setEditLogVpd(vpd);
        }
    }, [editLogTemp, editLogHumidity]);

    // Auto-calculate VPD for New Log
    useEffect(() => {
        if (newLogTemp && newLogHumidity) {
            const vpd = calculateVPD(parseFloat(newLogTemp), parseFloat(newLogHumidity));
            setNewLogVpd(vpd);
        }
    }, [newLogTemp, newLogHumidity]);

    // Auto-calculate VPD for Edit Log
    useEffect(() => {
        if (editLogTemp && editLogHumidity) {
            const vpd = calculateVPD(parseFloat(editLogTemp), parseFloat(editLogHumidity));
            setEditLogVpd(vpd);
        }
    }, [editLogTemp, editLogHumidity]);

    // Auto-fill Nutrients from Profile when Stage changes (New Log)
    useEffect(() => {
        if (profile && newLogStage && newLogNutrients.length === 0) {
            const stageConfig = profile.stages?.[newLogStage];
            if (stageConfig?.nutrients?.length > 0) {
                setNewLogNutrients(stageConfig.nutrients);
            }
        }
    }, [newLogStage, profile]); // Only run when stage changes or profile loads

    // --- DLI / PPFD / Light Cycle Handlers (Event-Driven) ---

    // New Log Handlers
    const handleNewLogPpfdChange = (val: string) => {
        setNewLogPpfd(val);
        const hours = getHoursFromCycle(newLogLightCycle);
        if (val && hours > 0) {
            setNewLogDli(calculateDLI(parseFloat(val), hours));
        }
    };

    const handleNewLogDliChange = (val: string) => {
        setNewLogDli(val);
        const hours = getHoursFromCycle(newLogLightCycle);
        if (val && hours > 0) {
            setNewLogPpfd(calculatePPFD(parseFloat(val), hours));
        }
    };

    const handleNewLogLightCycleChange = (val: string) => {
        setNewLogLightCycle(val);
        const hours = getHoursFromCycle(val);
        if (hours > 0 && newLogPpfd) {
            setNewLogDli(calculateDLI(parseFloat(newLogPpfd), hours));
        }
    };

    // Edit Log Handlers
    const handleEditLogPpfdChange = (val: string) => {
        setEditLogPpfd(val);
        const hours = getHoursFromCycle(editLogLightCycle);
        if (val && hours > 0) {
            setEditLogDli(calculateDLI(parseFloat(val), hours));
        }
    };

    const handleEditLogDliChange = (val: string) => {
        setEditLogDli(val);
        const hours = getHoursFromCycle(editLogLightCycle);
        if (val && hours > 0) {
            setEditLogPpfd(calculatePPFD(parseFloat(val), hours));
        }
    };

    const handleEditLogLightCycleChange = (val: string) => {
        setEditLogLightCycle(val);
        const hours = getHoursFromCycle(val);
        if (hours > 0 && editLogPpfd) {
            setEditLogDli(calculateDLI(parseFloat(editLogPpfd), hours));
        }
    };


    // Date/Week Calculation (Synced with Dashboard)
    const lastLog = useMemo(() => {
        if (grow.logs.length === 0) return null;
        return [...grow.logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }, [grow.logs]);

    const daysSinceStart = useMemo(() => {
        const endDate = lastLog ? new Date(lastLog.date) : new Date();
        // If lastLog has a manual day override, use it. Otherwise calculate diff from start.
        if (lastLog?.day) return lastLog.day;
        return differenceInDays(endDate, new Date(grow.startDate)) + 1;
    }, [lastLog, grow.startDate]);

    const weeksSinceStart = Math.ceil(daysSinceStart / 7);

    // Flower Stage Calculation
    const flowerStartDate = useMemo(() => {
        const firstFlowerLog = [...grow.logs]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .find(log => log.stage === 'flowering');
        return firstFlowerLog ? new Date(firstFlowerLog.date) : null;
    }, [grow.logs]);

    const flowerDays = useMemo(() => {
        if (!flowerStartDate) return 0;
        const endDate = lastLog ? new Date(lastLog.date) : new Date();
        return differenceInDays(endDate, flowerStartDate) + 1;
    }, [flowerStartDate, lastLog]);

    const flowerWeeks = Math.ceil(flowerDays / 7);

    // Prediction Engine
    const predictions = useMemo(() => {
        if (!profile) return [];

        const events = [];
        const startDate = new Date(grow.startDate);

        // Vegi End
        const vegiEndDate = addDays(startDate, profile.vegiDurationWeeks * 7);
        events.push({
            date: vegiEndDate,
            title: t.growDetail.predictions.switchToFlower,
            type: 'major',
            description: t.growDetail.predictions.switchToFlowerDesc
        });

        // Harvest Window
        const harvestDate = addDays(vegiEndDate, profile.flowerDurationWeeks * 7);
        events.push({
            date: harvestDate,
            title: t.growDetail.predictions.estimatedHarvest,
            type: 'major',
            description: t.growDetail.predictions.estimatedHarvestDesc
        });

        return events.filter(e => differenceInDays(e.date, new Date()) >= 0).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 3);
    }, [grow.startDate, profile, t]);

    // Upcoming Tasks (from Profile Schedule)
    const upcomingTasks = useMemo(() => {
        if (!profile) return [];

        // Determine start date of current stage
        // Find the earliest log with the current stage
        const stageLogs = grow.logs.filter(l => l.stage === grow.currentStage);
        const stageStartDate = stageLogs.length > 0
            ? new Date(stageLogs[stageLogs.length - 1].date)
            : new Date(); // Fallback to today if no logs yet

        const currentStageDay = differenceInDays(new Date(), stageStartDate) + 1;
        const stageConfig = profile.stages?.[grow.currentStage];

        if (!stageConfig?.schedule) return [];

        return stageConfig.schedule
            .filter(task => task.day >= currentStageDay && task.day <= currentStageDay + 7)
            .sort((a, b) => a.day - b.day)
            .map(task => ({
                ...task,
                date: addDays(stageStartDate, task.day - 1)
            }));
    }, [grow.logs, grow.currentStage, profile]);

    // Computed Logs for Display
    const displayedLogs = useMemo(() => {
        let logs = [...grow.logs];

        // Filter
        if (filterStage !== 'all') {
            logs = logs.filter(log => log.stage === filterStage);
        }

        // Sort
        logs.sort((a, b) => {
            const timeA = new Date(a.date).getTime();
            const timeB = new Date(b.date).getTime();
            return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        });

        return logs;
    }, [grow.logs, sortDirection, filterStage]);

    // --- Grow Edit Handlers ---
    const startEditGrow = () => {
        setEditGrowName(grow.name);
        setEditGrowDate(grow.startDate);
        setEditGrowProfileId(grow.profileId || '');
        setEditPlantCount(grow.plantCount || '');

        // Auto-migrate legacy strains to distribution if distribution is empty
        let initialDistribution = grow.strainDistribution || [];
        if (initialDistribution.length === 0 && grow.strains && grow.strains.length > 0) {
            initialDistribution = grow.strains.map(name => ({
                id: uuidv4(),
                name: name,
                count: 1 // Default to 1, user can adjust
            }));
        }
        setEditStrainDistribution(initialDistribution);
        setIsEditingGrow(true);
    };

    const addStrain = () => {
        if (!newStrainName) return;
        const newStrain: StrainDistribution = {
            id: uuidv4(),
            name: newStrainName,
            count: newStrainCount
        };
        setEditStrainDistribution([...editStrainDistribution, newStrain]);
        setNewStrainName('');
        setNewStrainCount(1);
    };

    const removeStrain = (id: string) => {
        setEditStrainDistribution(editStrainDistribution.filter(s => s.id !== id));
    };

    const saveEditGrow = () => {
        // Recalculate total plant count if distribution exists and count is not manually overridden (or just sync them)
        let finalPlantCount = editPlantCount;
        if (editStrainDistribution.length > 0) {
            finalPlantCount = editStrainDistribution.reduce((acc, curr) => acc + curr.count, 0);
        }

        updateGrow({
            ...grow,
            name: editGrowName,
            startDate: editGrowDate,
            profileId: editGrowProfileId || undefined,
            plantCount: typeof finalPlantCount === 'number' ? finalPlantCount : (finalPlantCount ? parseInt(finalPlantCount as string) : undefined),
            strainDistribution: editStrainDistribution
        });
        setIsEditingGrow(false);
    };

    // --- Log Edit Handlers ---
    const startEditLog = (log: LogEntry) => {
        setEditingLogId(log.id);
        setEditLogTitle(log.title);
        setEditLogContent(log.content);
        setEditLogDate(log.date.split('T')[0]);
        setEditLogStage(log.stage);
        setEditLogDay(log.day || log.stageDay);
        setEditLogWater(log.water?.toString() || '');
        setEditLogTemp(log.environment?.temp?.toString() || '');
        setEditLogHumidity(log.environment?.humidity?.toString() || '');
        setEditLogVpd(log.environment?.vpd?.toString() || '');
        setEditLogDli(log.environment?.dli?.toString() || '');
        setEditLogPpfd(log.environment?.ppfd?.toString() || '');
        setEditLogLightCycle(log.environment?.lightCycle || '');
        setEditLogNutrients(log.nutrients || []);
        setEditLogImages(log.images || []);
    };

    const saveEditLog = () => {
        if (!editingLogId) return;

        const updatedLogs = grow.logs.map(log => {
            if (log.id === editingLogId) {
                return {
                    ...log,
                    title: editLogTitle,
                    content: editLogContent,
                    date: new Date(editLogDate).toISOString(),
                    stage: editLogStage,
                    day: editLogDay,
                    water: editLogWater ? parseFloat(editLogWater) : undefined,
                    environment: {
                        temp: editLogTemp ? parseFloat(editLogTemp) : undefined,
                        humidity: editLogHumidity ? parseFloat(editLogHumidity) : undefined,
                        vpd: editLogVpd ? parseFloat(editLogVpd) : undefined,
                        dli: editLogDli ? parseFloat(editLogDli) : undefined,
                        ppfd: editLogPpfd ? parseFloat(editLogPpfd) : undefined,
                        lightCycle: editLogLightCycle
                    },
                    nutrients: editLogNutrients,
                    images: editLogImages
                };
            }
            return log;
        });

        updateGrow({ ...grow, logs: updatedLogs });
        setEditingLogId(null);
    };

    const deleteLog = (logId: string) => {
        if (confirm(t.common.confirm)) {
            const updatedLogs = grow.logs.filter(l => l.id !== logId);
            updateGrow({ ...grow, logs: updatedLogs });
        }
    };

    // --- Nutrient Helpers ---
    const addNutrientToLog = (isEditMode: boolean) => {
        if (!selectedNutrientId || !nutrientAmount) return;

        const nutrient = availableNutrients.find(n => n.id === selectedNutrientId);
        if (!nutrient) return;

        const entry: NutrientEntry = {
            nutrientId: nutrient.id,
            name: nutrient.name,
            amount: parseFloat(nutrientAmount),
            unit: nutrientUnit
        };

        if (isEditMode) {
            setEditLogNutrients([...editLogNutrients, entry]);
        } else {
            setNewLogNutrients([...newLogNutrients, entry]);
        }

        setSelectedNutrientId('');
        setNutrientAmount('');
    };

    const removeNutrientFromLog = (index: number, isEditMode: boolean) => {
        if (isEditMode) {
            setEditLogNutrients(editLogNutrients.filter((_, i) => i !== index));
        } else {
            setNewLogNutrients(newLogNutrients.filter((_, i) => i !== index));
        }
    };

    const createCustomNutrient = () => {
        if (!customNutrientName) return;
        const newNutrient: Nutrient = {
            id: uuidv4(),
            name: customNutrientName,
            type: customNutrientType
        };

        updateGrow({
            ...grow,
            customNutrients: [...(grow.customNutrients || []), newNutrient]
        });

        setCustomNutrientName('');
        setIsAddingCustomNutrient(false);
    };

    // --- New Log Handlers ---
    const handleAddLog = () => {
        if (!newLogTitle) return;

        const newLog: LogEntry = {
            id: uuidv4(),
            date: new Date(newLogDate).toISOString(),
            stage: newLogStage,
            stageDay: newLogDay, // Legacy field, kept for compatibility
            day: newLogDay,
            title: newLogTitle,
            content: newLogContent,
            images: newLogImages,
            tags: [],
            water: newLogWater ? parseFloat(newLogWater) : undefined,
            environment: {
                temp: newLogTemp ? parseFloat(newLogTemp) : undefined,
                humidity: newLogHumidity ? parseFloat(newLogHumidity) : undefined,
                vpd: newLogVpd ? parseFloat(newLogVpd) : undefined,
                dli: newLogDli ? parseFloat(newLogDli) : undefined,
                ppfd: newLogPpfd ? parseFloat(newLogPpfd) : undefined,
                lightCycle: newLogLightCycle
            },
            nutrients: newLogNutrients
        };

        updateGrow({
            ...grow,
            logs: [newLog, ...grow.logs]
        });

        // Reset Form
        setNewLogTitle('');
        setNewLogContent('');
        setNewLogImages([]);
        setNewLogStage(grow.currentStage);
        setNewLogWater('');
        setNewLogTemp('');
        setNewLogHumidity('');
        setNewLogVpd('');
        setNewLogDli('');
        setNewLogPpfd('');
        setNewLogLightCycle('');
        setNewLogNutrients([]);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setNewLogImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setEditLogImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeEditImage = (index: number) => {
        setEditLogImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleExportForum = (log: LogEntry) => {
        const bbcode = `[b]${log.title}[/b] - ${t.growDetail.day} ${log.day || log.stageDay}
${log.content}
${log.images.map(() => `[img]Image Upload Not Supported in Text Export[/img]`).join('\n')}`;
        navigator.clipboard.writeText(bbcode);
        alert(t.growDetail.bbcodeCopied);
    };

    const handleExportProject = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(grow));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${grow.name.replace(/\s+/g, '_')}_grow.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleDeleteGrow = () => {
        if (confirm(t.growDetail.deleteConfirm)) {
            deleteGrow(grow.id);
            navigate('/');
        }
    };

    const stages: Stage[] = ['seedling', 'vegetation', 'flowering', 'drying', 'curing'];

    // Render Helper for Log Form (Shared between New and Edit)
    const renderLogForm = (isEdit: boolean) => {
        const title = isEdit ? editLogTitle : newLogTitle;
        const setTitle = isEdit ? setEditLogTitle : setNewLogTitle;
        const content = isEdit ? editLogContent : newLogContent;
        const setContent = isEdit ? setEditLogContent : setNewLogContent;
        const date = isEdit ? editLogDate : newLogDate;
        const setDate = isEdit ? setEditLogDate : setNewLogDate;
        const stage = isEdit ? editLogStage : newLogStage;
        const setStage = isEdit ? setEditLogStage : setNewLogStage;
        const day = isEdit ? editLogDay : newLogDay;
        const setDay = isEdit ? setEditLogDay : setNewLogDay;

        // Environment
        const water = isEdit ? editLogWater : newLogWater;
        const setWater = isEdit ? setEditLogWater : setNewLogWater;
        const temp = isEdit ? editLogTemp : newLogTemp;
        const setTemp = isEdit ? setEditLogTemp : setNewLogTemp;
        const humidity = isEdit ? editLogHumidity : newLogHumidity;
        const setHumidity = isEdit ? setEditLogHumidity : setNewLogHumidity;
        const vpd = isEdit ? editLogVpd : newLogVpd;
        const setVpd = isEdit ? setEditLogVpd : setNewLogVpd;
        const dli = isEdit ? editLogDli : newLogDli;
        // const setDli = isEdit ? setEditLogDli : setNewLogDli; // Replaced by specific handlers
        const ppfd = isEdit ? editLogPpfd : newLogPpfd;
        // const setPpfd = isEdit ? setEditLogPpfd : setNewLogPpfd; // Replaced by specific handlers
        const lightCycle = isEdit ? editLogLightCycle : newLogLightCycle;
        // const setLightCycle = isEdit ? setEditLogLightCycle : setNewLogLightCycle; // Replaced by specific handlers

        const handlePpfdChange = isEdit ? handleEditLogPpfdChange : handleNewLogPpfdChange;
        const handleDliChange = isEdit ? handleEditLogDliChange : handleNewLogDliChange;
        const handleLightCycleChange = isEdit ? handleEditLogLightCycleChange : handleNewLogLightCycleChange;

        const nutrients = isEdit ? editLogNutrients : newLogNutrients;

        return (
            <div className="space-y-4">
                <input
                    className="input font-bold"
                    placeholder={t.growDetail.titlePlaceholder}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="date"
                        className="input"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400 whitespace-nowrap">{t.growDetail.manualDay}:</span>
                        <input
                            type="number"
                            className="input"
                            value={day}
                            onChange={e => setDay(parseInt(e.target.value))}
                        />
                    </div>
                    <select
                        className="input"
                        value={stage}
                        onChange={e => setStage(e.target.value as Stage)}
                    >
                        {stages.map(s => (
                            <option key={s} value={s}>{t.profiles.stages[s] || s}</option>
                        ))}
                    </select>
                </div>

                {/* Environment & Water */}
                <div className="bg-slate-800/50 p-4 rounded-lg space-y-4 border border-slate-700">
                    <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                        <Thermometer size={16} /> {t.growDetail.environment}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">{t.growDetail.water}</label>
                            <input className="input" placeholder="L" value={water} onChange={e => setWater(e.target.value)} type="number" step="0.1" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">{t.growDetail.temp}</label>
                            <input className="input" placeholder="°C" value={temp} onChange={e => setTemp(e.target.value)} type="number" step="0.1" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">{t.growDetail.humidity}</label>
                            <input className="input" placeholder="%" value={humidity} onChange={e => setHumidity(e.target.value)} type="number" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">{t.growDetail.vpd}</label>
                            <input className="input" placeholder="kPa" value={vpd} onChange={e => setVpd(e.target.value)} type="number" step="0.1" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">{t.growDetail.dli}</label>
                            <input className="input" placeholder="mol/m²/d" value={dli} onChange={e => handleDliChange(e.target.value)} type="number" step="0.1" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">{t.growDetail.ppfd}</label>
                            <input className="input" placeholder="µmol/m²/s" value={ppfd} onChange={e => handlePpfdChange(e.target.value)} type="number" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">{t.growDetail.lightCycle}</label>
                            <input
                                className="input"
                                placeholder="e.g. 18/6"
                                value={lightCycle}
                                onChange={e => handleLightCycleChange(e.target.value)}
                                list="light-cycles"
                            />
                            <datalist id="light-cycles">
                                <option value="12/12" />
                                <option value="18/6" />
                                <option value="20/4" />
                                <option value="24/0" />
                            </datalist>
                        </div>
                    </div>
                </div>

                {/* Nutrients */}
                <div className="bg-slate-800/50 p-4 rounded-lg space-y-4 border border-slate-700">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-purple-400 flex items-center gap-2">
                            <Beaker size={16} /> {t.growDetail.nutrients}
                        </h4>
                        <button onClick={() => setIsAddingCustomNutrient(!isAddingCustomNutrient)} className="text-xs text-emerald-400 hover:underline">
                            + {t.growDetail.customNutrient}
                        </button>
                    </div>

                    {isAddingCustomNutrient && (
                        <div className="flex gap-2 items-center bg-slate-900 p-2 rounded">
                            <input className="input text-sm" placeholder={t.growDetail.nutrientName} value={customNutrientName} onChange={e => setCustomNutrientName(e.target.value)} />
                            <select className="input text-sm w-32" value={customNutrientType} onChange={e => setCustomNutrientType(e.target.value as any)}>
                                <option value="veg">Veg</option>
                                <option value="bloom">Bloom</option>
                                <option value="booster">Booster</option>
                                <option value="other">Other</option>
                            </select>
                            <button onClick={createCustomNutrient} className="btn btn-primary text-xs p-2"><Plus size={14} /></button>
                        </div>
                    )}

                    <div className="flex gap-2 items-end">
                        <select className="input flex-1" value={selectedNutrientId} onChange={e => setSelectedNutrientId(e.target.value)}>
                            <option value="">{t.growDetail.selectNutrient}</option>
                            {availableNutrients.map(n => (
                                <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                            ))}
                        </select>
                        <input className="input w-24" placeholder={t.growDetail.amount} value={nutrientAmount} onChange={e => setNutrientAmount(e.target.value)} type="number" step="0.1" />
                        <select className="input w-24" value={nutrientUnit} onChange={e => setNutrientUnit(e.target.value as any)}>
                            <option value="ml/L">ml/L</option>
                            <option value="g/L">g/L</option>
                        </select>
                        <button onClick={() => addNutrientToLog(isEdit)} className="btn btn-secondary p-2">
                            <Plus size={18} />
                        </button>
                    </div>

                    {nutrients.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {nutrients.map((n, idx) => (
                                <span key={idx} className="bg-purple-900/30 border border-purple-500/30 text-purple-300 px-2 py-1 rounded text-sm flex items-center gap-2">
                                    {n.name}: {n.amount}{n.unit}
                                    <button onClick={() => removeNutrientFromLog(idx, isEdit)} className="hover:text-red-400"><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <textarea
                    className="input min-h-[120px]"
                    placeholder={t.growDetail.contentPlaceholder}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 w-full">
                    {isEditingGrow ? (
                        <div className="glass-panel p-4 space-y-4 border border-emerald-500/50">
                            <input
                                className="input text-xl font-bold"
                                value={editGrowName}
                                onChange={e => setEditGrowName(e.target.value)}
                                placeholder={t.newGrow.growName}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="date"
                                    className="input"
                                    value={editGrowDate}
                                    onChange={e => setEditGrowDate(e.target.value)}
                                />
                                <select
                                    className="input"
                                    value={editGrowProfileId}
                                    onChange={e => setEditGrowProfileId(e.target.value)}
                                >
                                    <option value="">{t.newGrow.noProfile}</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Plant & Strain Manager */}
                            <div className="bg-slate-900/50 p-3 rounded space-y-3">
                                <label className="text-sm font-bold text-slate-400 block">{t.newGrow.plantCount} & {t.newGrow.strains}</label>

                                {/* Add New Strain */}
                                <div className="flex gap-2">
                                    <input
                                        className="input text-sm flex-1"
                                        placeholder={t.newGrow.strain}
                                        value={newStrainName}
                                        onChange={e => setNewStrainName(e.target.value)}
                                    />
                                    <input
                                        className="input text-sm w-20"
                                        type="number"
                                        min="1"
                                        value={newStrainCount}
                                        onChange={e => setNewStrainCount(parseInt(e.target.value))}
                                    />
                                    <button onClick={addStrain} className="btn btn-secondary p-2"><Plus size={16} /></button>
                                </div>

                                {/* List Strains */}
                                {editStrainDistribution.length > 0 && (
                                    <div className="space-y-1">
                                        {editStrainDistribution.map(s => (
                                            <div key={s.id} className="flex justify-between items-center bg-slate-800 px-3 py-1.5 rounded text-sm">
                                                <span>{s.count}x {s.name}</span>
                                                <button onClick={() => removeStrain(s.id)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Total Count Fallback */}
                                {editStrainDistribution.length === 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 whitespace-nowrap">{t.newGrow.plantCount}:</span>
                                        <input
                                            className="input text-sm"
                                            type="number"
                                            value={editPlantCount}
                                            onChange={e => setEditPlantCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditingGrow(false)} className="btn btn-secondary text-sm">
                                    {t.common.cancel}
                                </button>
                                <button onClick={saveEditGrow} className="btn btn-primary text-sm">
                                    <Save size={16} /> {t.common.saveChanges}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-3 mb-1 group">
                                <h2 className="text-3xl font-bold gradient-text">{grow.name}</h2>
                                <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 uppercase border border-emerald-500/30">
                                    {t.profiles.stages[grow.currentStage] || grow.currentStage}
                                </span>
                                <button onClick={startEditGrow} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                            <p className="text-slate-400 flex items-center gap-2 mb-2">
                                <Calendar size={14} /> {t.dashboard.started} {format(new Date(grow.startDate), 'MMMM do, yyyy')}
                                {profile && <span className="text-emerald-500">• {profile.name}</span>}
                            </p>

                            {/* Plant & Strain Info */}
                            {grow.strainDistribution && grow.strainDistribution.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {grow.strainDistribution.map(s => (
                                        <div key={s.id} className="text-sm text-slate-300 flex items-center gap-1.5 bg-slate-800/50 px-2.5 py-1 rounded border border-slate-700/50">
                                            <span className="text-emerald-400 font-bold">{s.count}x</span>
                                            <span>{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                (grow.plantCount || (grow.strains && grow.strains.length > 0)) && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {grow.plantCount && (
                                            <span className="text-sm text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded border border-slate-700/50">
                                                🌱 {grow.plantCount} {t.newGrow.plantCount || 'Plants'}
                                            </span>
                                        )}
                                        {grow.strains && grow.strains.length > 0 && (
                                            <span className="text-sm text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded border border-slate-700/50" title={grow.strains.join(', ')}>
                                                🧬 {grow.strains.length} {t.newGrow.strains || 'Strains'}
                                            </span>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
                {!isEditingGrow && (
                    <div className="flex gap-2">
                        <button onClick={handleExportProject} className="btn btn-secondary" title={t.growDetail.export}>
                            <Download size={18} /> {t.growDetail.export}
                        </button>
                        <button onClick={handleDeleteGrow} className="btn btn-secondary text-red-400 hover:text-red-300 hover:bg-red-900/20 hover:border-red-900/50" title={t.growDetail.delete}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 text-center">
                    <span className="block text-3xl font-bold text-emerald-400">{daysSinceStart}</span>
                    <span className="text-xs text-slate-500 uppercase font-bold mt-1 block">{t.growDetail.totalDays}</span>
                </div>
                <div className="glass-panel p-4 text-center">
                    <span className="block text-3xl font-bold text-blue-400">{weeksSinceStart}</span>
                    <span className="text-xs text-slate-500 uppercase font-bold mt-1 block">{t.growDetail.weeks}</span>
                </div>

                {/* Flower Stats (Only visible if flowering started) */}
                {flowerDays > 0 && (
                    <>
                        <div className="glass-panel p-4 text-center border-t-2 border-t-pink-500">
                            <span className="block text-3xl font-bold text-pink-400">{flowerDays}</span>
                            <span className="text-xs text-slate-500 uppercase font-bold mt-1 block">{t.growDetail.flowerDays || 'Blütetage'}</span>
                        </div>
                        <div className="glass-panel p-4 text-center border-t-2 border-t-pink-500">
                            <span className="block text-3xl font-bold text-pink-400">{flowerWeeks}</span>
                            <span className="text-xs text-slate-500 uppercase font-bold mt-1 block">{t.growDetail.flowerWeeks || 'Blütewochen'}</span>
                        </div>
                    </>
                )}

                {profile && (
                    <>
                        <div className="glass-panel p-4 text-center">
                            <span className="block text-3xl font-bold text-purple-400">{profile.vegiDurationWeeks}</span>
                            <span className="text-xs text-slate-500 uppercase font-bold mt-1 block">{t.growDetail.estVegiWeeks}</span>
                        </div>
                        <div className="glass-panel p-4 text-center">
                            <span className="block text-3xl font-bold text-orange-400">{profile.flowerDurationWeeks}</span>
                            <span className="text-xs text-slate-500 uppercase font-bold mt-1 block">{t.growDetail.estFlowerWeeks}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Predictions */}
            {predictions.length > 0 && (
                <div className="glass-panel p-6 border-l-4 border-l-blue-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-blue-400" /> {t.growDetail.upcomingEvents}
                    </h3>
                    <div className="space-y-3">
                        {predictions.map((pred, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg">
                                <div className="text-center min-w-[60px]">
                                    <span className="block text-sm font-bold text-blue-400">{format(pred.date, 'MMM d')}</span>
                                    <span className="text-xs text-slate-500">{format(pred.date, 'EEE')}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-200">{pred.title}</h4>
                                    <p className="text-sm text-slate-400">{pred.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Tasks (Profile Schedule) */}
            {upcomingTasks.length > 0 && (
                <div className="glass-panel p-6 border-l-4 border-l-purple-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-purple-400" /> {t.growDetail.upcomingTasks || "Upcoming Tasks"}
                    </h3>
                    <div className="space-y-3">
                        {upcomingTasks.map((task, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg">
                                <div className="text-center min-w-[60px]">
                                    <span className="block text-sm font-bold text-purple-400">{format(task.date, 'MMM d')}</span>
                                    <span className="text-xs text-slate-500">Day {task.day}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-200">{task.task}</h4>
                                    <p className="text-sm text-slate-400">{t.profiles.stages[grow.currentStage]}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Log Editor */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white mb-4">{t.growDetail.newLogEntry}</h3>

                {renderLogForm(false)}

                <div className="flex justify-between items-center mt-4">
                    <label className="btn btn-secondary cursor-pointer text-sm">
                        <Camera size={16} /> {t.growDetail.addPhotos}
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <button onClick={handleAddLog} className="btn btn-primary">
                        <Save size={18} /> {t.growDetail.saveEntry}
                    </button>
                </div>

                {newLogImages.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-2 mt-2">
                        {newLogImages.map((img, idx) => (
                            <img key={idx} src={img} alt="Preview" className="h-20 w-20 object-cover rounded border border-slate-600" />
                        ))}
                    </div>
                )}
            </div>

            {/* Log History */}
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h3 className="text-xl font-bold text-white">{t.growDetail.logHistory}</h3>

                    <div className="flex items-center gap-2">
                        {/* Sort Toggle */}
                        <button
                            onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors"
                        >
                            <ArrowUpDown size={14} />
                            {sortDirection === 'desc' ? (t.common?.newestFirst || 'Neueste zuerst') : (t.common?.oldestFirst || 'Älteste zuerst')}
                        </button>

                        {/* Stage Filter */}
                        <select
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-emerald-500"
                        >
                            <option value="all">{t.common?.allStages || 'Alle Phasen'}</option>
                            {Object.entries(t.profiles.stages).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {displayedLogs.length === 0 && (
                    <div className="text-center py-10 text-slate-500 bg-slate-900/30 rounded-lg custom-dashed-border">
                        <p>{t.growDetail?.noLogsFound || 'Keine Einträge gefunden.'}</p>
                    </div>
                )}

                {displayedLogs.map(log => (
                    <div key={log.id} className="glass-panel p-6 relative group">
                        {editingLogId === log.id ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-bold text-emerald-400">{t.growDetail.editLog}</h4>
                                    <button onClick={() => setEditingLogId(null)} className="p-1 hover:bg-slate-700 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>

                                {renderLogForm(true)}

                                {/* Edit Log Images */}
                                <div className="mt-4 border-t border-slate-700 pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-bold text-slate-400 text-sm flex items-center gap-2">
                                            <Camera size={14} /> {t.growDetail.photos || 'Photos'}
                                        </h5>
                                        <label className="text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1">
                                            <Plus size={12} /> {t.growDetail.addPhotos}
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleEditImageUpload} />
                                        </label>
                                    </div>

                                    {editLogImages.length > 0 ? (
                                        <div className="flex gap-2 overflow-x-auto py-2">
                                            {editLogImages.map((img, idx) => (
                                                <div key={idx} className="relative group/img flex-shrink-0">
                                                    <img src={img} alt="Preview" className="h-20 w-20 object-cover rounded border border-slate-600" />
                                                    <button
                                                        onClick={() => removeEditImage(idx)}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 italic">No photos attached.</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setEditingLogId(null)} className="btn btn-secondary text-sm">
                                        {t.common.cancel}
                                    </button>
                                    <button onClick={saveEditLog} className="btn btn-primary text-sm">
                                        <Save size={16} /> {t.common.saveChanges}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEditLog(log)} className="p-2 hover:bg-slate-700 rounded text-blue-400 hover:text-blue-300" title={t.common.edit}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => deleteLog(log.id)} className="p-2 hover:bg-slate-700 rounded text-red-400 hover:text-red-300" title={t.common.delete}>
                                        <Trash2 size={16} />
                                    </button>
                                    <button onClick={() => handleExportForum(log)} className="p-2 hover:bg-slate-700 rounded text-slate-500 hover:text-emerald-400" title={t.growDetail.copyForForum}>
                                        <Share2 size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-slate-800 px-3 py-1 rounded text-center min-w-[80px]">
                                        <span className="block text-sm font-bold text-white">{format(new Date(log.date), 'dd.MM.yyyy')}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-emerald-400">{log.title}</h4>
                                        <span className="text-xs text-slate-500">{t.growDetail.day} {log.day || log.stageDay} • {t.profiles.stages[log.stage] || log.stage}</span>
                                    </div>
                                </div>

                                {/* Environment Data Display */}
                                {(log.water || log.environment || (log.nutrients && log.nutrients.length > 0)) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                        {/* Environment & Water */}
                                        <div className="space-y-2">
                                            <h5 className="font-bold text-slate-400 flex items-center gap-2 border-b border-slate-700 pb-1 mb-2">
                                                <Activity size={14} /> {t.growDetail.environment}
                                            </h5>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                {log.water && (
                                                    <span className="flex items-center justify-between text-slate-300">
                                                        <span className="flex items-center gap-1 text-slate-500"><Droplets size={12} /> {t.growDetail.water}</span>
                                                        <span className="font-mono text-blue-400">{log.water}L</span>
                                                    </span>
                                                )}
                                                {log.environment?.temp && (
                                                    <span className="flex items-center justify-between text-slate-300">
                                                        <span className="flex items-center gap-1 text-slate-500"><Thermometer size={12} /> {t.growDetail.temp}</span>
                                                        <span className="font-mono text-red-400">{log.environment.temp}°C</span>
                                                    </span>
                                                )}
                                                {log.environment?.humidity && (
                                                    <span className="flex items-center justify-between text-slate-300">
                                                        <span className="flex items-center gap-1 text-slate-500"><Droplets size={12} /> {t.growDetail.humidity}</span>
                                                        <span className="font-mono text-blue-300">{log.environment.humidity}%</span>
                                                    </span>
                                                )}
                                                {log.environment?.vpd && (
                                                    <span className="flex items-center justify-between text-slate-300">
                                                        <span className="flex items-center gap-1 text-slate-500"><Wind size={12} /> {t.growDetail.vpd}</span>
                                                        <span className="font-mono text-emerald-400">{log.environment.vpd} kPa</span>
                                                    </span>
                                                )}
                                                {log.environment?.dli && (
                                                    <span className="flex items-center justify-between text-slate-300">
                                                        <span className="flex items-center gap-1 text-slate-500"><Sun size={12} /> {t.growDetail.dli}</span>
                                                        <span className="font-mono text-yellow-500">{log.environment.dli}</span>
                                                    </span>
                                                )}
                                                {log.environment?.ppfd && (
                                                    <span className="flex items-center justify-between text-slate-300">
                                                        <span className="flex items-center gap-1 text-slate-500"><Sun size={12} /> {t.growDetail.ppfd}</span>
                                                        <span className="font-mono text-yellow-400">{log.environment.ppfd}</span>
                                                    </span>
                                                )}
                                                {log.environment?.lightCycle && (
                                                    <span className="flex items-center justify-between text-slate-300 col-span-2">
                                                        <span className="flex items-center gap-1 text-slate-500"><Sun size={12} /> {t.growDetail.lightCycle}</span>
                                                        <span className="font-mono text-white">{log.environment.lightCycle}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Nutrients */}
                                        {(log.nutrients && log.nutrients.length > 0) && (
                                            <div className="space-y-2">
                                                <h5 className="font-bold text-slate-400 flex items-center gap-2 border-b border-slate-700 pb-1 mb-2">
                                                    <Beaker size={14} /> {t.growDetail.nutrients}
                                                </h5>
                                                <div className="space-y-1">
                                                    {log.nutrients.map((n, i) => (
                                                        <div key={i} className="flex justify-between items-center bg-slate-800/50 px-2 py-1 rounded">
                                                            <span className="text-purple-300">{n.name}</span>
                                                            <span className="font-mono text-xs text-slate-400">{n.amount}{n.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <p className="text-slate-300 whitespace-pre-wrap mb-4">{log.content}</p>

                                {log.images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {log.images.map((img, idx) => (
                                            <img key={idx} src={img} alt="Log attachment" className="rounded-lg border border-slate-700 w-full h-48 object-cover" />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
