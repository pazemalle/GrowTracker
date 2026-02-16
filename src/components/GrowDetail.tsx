import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import type { LogEntry, Stage, NutrientEntry, Nutrient, StrainDistribution } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays, differenceInDays } from 'date-fns';
import {
    Calendar, Camera, Save, Share2,
    Download, Trash2, Edit2, X, Droplets, Thermometer, Sun, Beaker, Plus, Wind,
    AlertCircle, ArrowUpDown, Hexagon, ChevronDown, Zap, Activity
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
    // const { isAuthenticated } = useAuth(); // Unused
    const { grows, profiles, setups, seeds = [], updateGrow, deleteGrow } = useStore();
    const { t } = useLanguage();

    const grow = grows.find(g => g.id === id);
    const profile = profiles.find(p => p.id === grow?.profileId);
    const linkedSetups = setups.filter(s => grow?.setupIds?.includes(s.id) || grow?.setupId === s.id);

    // Grow Edit State
    const [isEditingGrow, setIsEditingGrow] = useState(false);
    const [editGrowName, setEditGrowName] = useState('');
    const [editGrowDate, setEditGrowDate] = useState('');
    const [editGrowProfileId, setEditGrowProfileId] = useState('');
    const [editGrowSetupIds, setEditGrowSetupIds] = useState<string[]>([]);
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
    const [editLogEc, setEditLogEc] = useState<string>('');
    const [editLogPh, setEditLogPh] = useState<string>('');
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
    const [newLogEc, setNewLogEc] = useState<string>('');
    const [newLogPh, setNewLogPh] = useState<string>('');
    const [newLogLightCycle, setNewLogLightCycle] = useState<string>('');
    const [newLogNutrients, setNewLogNutrients] = useState<NutrientEntry[]>([]);

    // Nutrient Selection State
    const [selectedNutrientId, setSelectedNutrientId] = useState<string>('');
    const [nutrientAmount, setNutrientAmount] = useState<string>('');
    const [nutrientUnit, setNutrientUnit] = useState<'ml/L Wasser' | 'g/L Wasser' | 'g/L Substrat'>('ml/L Wasser');
    const [isAddingCustomNutrient, setIsAddingCustomNutrient] = useState(false);
    const [customNutrientName, setCustomNutrientName] = useState('');
    const [customNutrientType, setCustomNutrientType] = useState<'veg' | 'bloom' | 'booster' | 'other'>('other');

    const [showValidation, setShowValidation] = useState(false);

    // Auto-Title States
    const [isNewLogTitleManual, setIsNewLogTitleManual] = useState(false);
    const [isEditLogTitleManual, setIsEditLogTitleManual] = useState(false);
    const [isAddingLog, setIsAddingLog] = useState(false);

    if (!grow) return <div>Grow not found</div>;

    // Available Nutrients (Profile + Custom)
    const availableNutrients = useMemo(() => {
        const profileNutrients = profile?.nutrients || [];
        const customNutrients = grow.customNutrients || [];
        return [...profileNutrients, ...customNutrients]
            .filter(n => n && n.name) // Filter out null/undefined or missing names
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
    // Auto-fill removed in favor of manual load buttons
    // useEffect(() => {
    //     if (profile && newLogStage && newLogNutrients.length === 0) {
    //         const stageConfig = profile.stages?.[newLogStage];
    //         if (stageConfig?.nutrients?.length > 0) {
    //             setNewLogNutrients(stageConfig.nutrients);
    //         }
    //     }
    // }, [newLogStage, profile]); 

    // Helper to resolve the correct WeekConfig or StageConfig based on stage and date
    const getProfileConfigForStage = (stage: Stage, date: string, day: number) => {
        if (!profile || !stage) return null;

        // Try Week-based first
        if (profile.phases && (stage === 'vegetation' || stage === 'flowering' || stage === 'drying')) {
            const phase = profile.phases[stage];
            if (phase && phase.weeks.length > 0) {
                let weekIndex = 0;
                if (stage === 'vegetation') {
                    weekIndex = Math.ceil((day || 1) / 7) - 1;
                } else if (stage === 'flowering') {
                    const targetDate = new Date(date);
                    const flowerStart = grow.logs.find(l => l.stage === 'flowering')?.date;
                    if (flowerStart) {
                        const diff = differenceInDays(targetDate, new Date(flowerStart));
                        const d = diff >= 0 ? diff + 1 : 1;
                        weekIndex = Math.ceil(d / 7) - 1;
                    } else {
                        weekIndex = 0;
                    }
                } else if (stage === 'drying') {
                    const targetDate = new Date(date);
                    const dryingStart = grow.logs.find(l => l.stage === 'drying')?.date;
                    if (dryingStart) {
                        const diff = differenceInDays(targetDate, new Date(dryingStart));
                        const d = diff >= 0 ? diff + 1 : 1;
                        weekIndex = Math.ceil(d / 7) - 1;
                    } else {
                        weekIndex = 0;
                    }
                }

                if (weekIndex < 0) weekIndex = 0;
                if (weekIndex >= phase.weeks.length) weekIndex = phase.weeks.length - 1;
                return phase.weeks[weekIndex];
            }
        }

        // Fallback to legacy stages
        if (profile.stages) {
            return profile.stages[stage];
        }

        return null;
    };

    const loadProfileEnvironment = (isEdit: boolean = false) => {
        const stage = isEdit ? editLogStage : newLogStage;
        const date = isEdit ? editLogDate : newLogDate;
        const day = isEdit ? editLogDay : newLogDay;

        const config = getProfileConfigForStage(stage, date, day);
        if (!config) return;

        if (isEdit) {
            if (config.temp) setEditLogTemp(config.temp);
            if (config.humidity) setEditLogHumidity(config.humidity);
            if (config.vpd) setEditLogVpd(config.vpd);
            if (config.dli) setEditLogDli(config.dli);
            if (config.ppfd) setEditLogPpfd(config.ppfd);
            if (config.lightCycle) setEditLogLightCycle(config.lightCycle);
            if (config.ec) setEditLogEc(config.ec || '');
            if (config.ph) setEditLogPh(config.ph || '');
        } else {
            if (config.temp) setNewLogTemp(config.temp);
            if (config.humidity) setNewLogHumidity(config.humidity);
            if (config.vpd) setNewLogVpd(config.vpd);
            if (config.dli) setNewLogDli(config.dli);
            if (config.ppfd) setNewLogPpfd(config.ppfd);
            if (config.lightCycle) setNewLogLightCycle(config.lightCycle);
            if (config.ec) setNewLogEc(config.ec || '');
            if (config.ph) setNewLogPh(config.ph || '');
        }

        // Auto-calculate PPFD if DLI and LightCycle are available
        if (config.dli && config.lightCycle) {
            const hours = getHoursFromCycle(config.lightCycle);
            if (hours > 0) {
                const calculated = calculatePPFD(parseFloat(config.dli.toString()), hours);
                if (calculated) {
                    if (isEdit) setEditLogPpfd(calculated);
                    else setNewLogPpfd(calculated);
                }
            }
        }
    };

    const loadProfileNutrients = (isEdit: boolean = false) => {
        const stage = isEdit ? editLogStage : newLogStage;
        const date = isEdit ? editLogDate : newLogDate;
        const day = isEdit ? editLogDay : newLogDay;

        const config = getProfileConfigForStage(stage, date, day);

        if (config?.nutrients?.length > 0) {
            if (isEdit) setEditLogNutrients(config.nutrients);
            else setNewLogNutrients(config.nutrients);
        }
    };

    // Auto-select Stage from Last Log


    // --- Helper for Title Generation & Metadata ---
    const generateLogMetadata = (dateStr: string, stage: Stage) => {
        const date = new Date(dateStr);
        const start = new Date(grow.startDate);
        const diffTime = Math.abs(date.getTime() - start.getTime());
        const day = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Day 1 is start date
        const week = Math.ceil(day / 7);

        let title = `${t.growDetail.day} ${day} / ${t.growDetail.week} ${week}`;
        let flowerDay: number | undefined;
        let flowerWeek: number | undefined;

        if (stage === 'flowering') {
            // Find flowering start
            const floweringLogs = grow.logs
                .filter(l => l.stage === 'flowering')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            let flowerStart = floweringLogs.length > 0 ? new Date(floweringLogs[0].date) : date;

            // If the current log date is BEFORE the first recorded flowering log, treat current as start?
            // Or if we are creating the FIRST flowering log.
            if (floweringLogs.length > 0 && date.getTime() < flowerStart.getTime()) {
                flowerStart = date;
            }

            const flowerDiff = Math.max(0, date.getTime() - flowerStart.getTime());
            flowerDay = Math.floor(flowerDiff / (1000 * 60 * 60 * 24)) + 1;
            flowerWeek = Math.ceil(flowerDay / 7);

            title += ` / BT ${flowerDay} / BW ${flowerWeek}`;
        }

        return { title, day, week, flowerDay, flowerWeek };
    };

    // --- Effects for Auto-Title ---

    // New Log Auto-Title
    useEffect(() => {
        if (!isNewLogTitleManual && newLogDate) {
            const { title } = generateLogMetadata(newLogDate, newLogStage);
            setNewLogTitle(title);
        }
    }, [newLogDate, newLogStage, isNewLogTitleManual, grow.startDate, grow.logs]);

    // Edit Log Auto-Title
    useEffect(() => {
        if (!isEditLogTitleManual && editLogDate && editingLogId) {
            const { title } = generateLogMetadata(editLogDate, editLogStage);
            setEditLogTitle(title);
        }
    }, [editLogDate, editLogStage, isEditLogTitleManual, editingLogId, grow.startDate, grow.logs]);

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

    // Auto-select Stage from Last Log
    useEffect(() => {
        if (lastLog?.stage) {
            setNewLogStage(lastLog.stage);
        }
    }, [lastLog]);

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
        // User Request: Use lastLog date as reference if available, effectively "Grow Time"
        const referenceDate = lastLog ? new Date(lastLog.date) : new Date();

        // Vegi End
        const vegiWeeks = profile?.vegiDurationWeeks || 4;
        const vegiEndDate = addDays(startDate, vegiWeeks * 7);
        events.push({
            date: vegiEndDate,
            title: t.growDetail.predictions.switchToFlower,
            type: 'major',
            description: t.growDetail.predictions.switchToFlowerDesc
        });

        // Harvest Window
        const flowerWeeks = profile?.flowerDurationWeeks || 9;
        const harvestDate = addDays(vegiEndDate, flowerWeeks * 7);
        events.push({
            date: harvestDate,
            title: t.growDetail.predictions.estimatedHarvest,
            type: 'major',
            description: t.growDetail.predictions.estimatedHarvestDesc
        });

        return events
            .filter(e => {
                const diff = differenceInDays(e.date, referenceDate);
                return diff >= 0 && diff <= 14; // Next 2 weeks only
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 3);
    }, [grow.startDate, profile, t, lastLog]);

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

    // --- Consumption Stats ---
    const consumptionStats = useMemo(() => {
        let totalWater = 0;
        const nutrientTotals: Record<string, { amount: number, unit: string }> = {};

        grow.logs.forEach(log => {
            if (log.water) {
                totalWater += log.water;
            }

            if (log.nutrients) {
                log.nutrients.forEach(n => {
                    // Only sum up if we can calculate a total (ml/L or g/L) AND we have water volume
                    // OR if it's an absolute value (not handled yet, assuming mostly mix-ins)
                    // User Request: "ml/L or g/L ... multiplied by water"

                    let addedAmount = 0;
                    let targetUnit: string = n.unit; // Default to current unit if not convertible

                    // Normalize unit check for backward compatibility (ml/L vs ml/L Wasser)
                    const unitStr = n.unit as string;
                    const isMlPerL = unitStr === 'ml/L' || unitStr === 'ml/L Wasser';
                    const isGPerL = unitStr === 'g/L' || unitStr === 'g/L Wasser';

                    if ((isMlPerL || isGPerL) && log.water) {
                        addedAmount = n.amount * log.water;
                        // Convert unit for display
                        targetUnit = isMlPerL ? 'ml' : 'g';
                    }
                    // 'g/L Substrat' is ignored for total consumption

                    if (addedAmount > 0) {
                        const key = `${n.name}_${targetUnit}`; // Group by Name + Unit
                        if (!nutrientTotals[key]) {
                            nutrientTotals[key] = { amount: 0, unit: targetUnit as any };
                        }
                        nutrientTotals[key].amount += addedAmount;
                    }
                });
            }
        });

        return { totalWater, nutrientTotals };
    }, [grow.logs]);

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
        setEditGrowSetupIds(grow.setupIds || (grow.setupId ? [grow.setupId] : []));
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
            setupIds: editGrowSetupIds,
            plantCount: typeof finalPlantCount === 'number' ? finalPlantCount : (finalPlantCount ? parseInt(finalPlantCount as string) : undefined),
            strainDistribution: editStrainDistribution
        });
        setIsEditingGrow(false);
    };

    // --- Log Edit Handlers ---
    const startEditLog = (log: LogEntry) => {
        setShowValidation(false);
        setEditingLogId(log.id);
        setIsEditLogTitleManual(true); // Treat existing logs as manually titeld to avoid overwrite on open
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
        setEditLogEc(log.ec?.toString() || log.environment?.ec?.toString() || '');
        setEditLogPh(log.ph?.toString() || log.environment?.ph?.toString() || '');
        setEditLogLightCycle(log.environment?.lightCycle || '');
        setEditLogNutrients(log.nutrients || []);
        setEditLogImages(log.images || []);
    };

    const saveEditLog = () => {
        setShowValidation(true);
        if (!editingLogId) return;
        if (!editLogTitle) return;

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

                    ec: editLogEc ? parseFloat(editLogEc) : undefined,
                    ph: editLogPh ? parseFloat(editLogPh) : undefined,
                    environment: {
                        temp: editLogTemp ? parseFloat(editLogTemp) : undefined,
                        humidity: editLogHumidity ? parseFloat(editLogHumidity) : undefined,
                        vpd: editLogVpd ? parseFloat(editLogVpd) : undefined,
                        dli: editLogDli ? parseFloat(editLogDli) : undefined,
                        ppfd: editLogPpfd ? parseFloat(editLogPpfd) : undefined,
                        lightCycle: editLogLightCycle,
                        ec: editLogEc ? parseFloat(editLogEc) : undefined,
                        ph: editLogPh ? parseFloat(editLogPh) : undefined
                    },
                    nutrients: editLogNutrients,
                    images: editLogImages
                };
            }
            return log;
        });

        updateGrow({ ...grow, logs: updatedLogs });
        setEditingLogId(null);
        setShowValidation(false);
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

    const updateNutrientInLog = (index: number, field: keyof NutrientEntry, value: any, isEditMode: boolean) => {
        const list = isEditMode ? editLogNutrients : newLogNutrients;
        const updated = [...list];
        updated[index] = { ...updated[index], [field]: field === 'amount' ? parseFloat(value) : value };

        if (isEditMode) setEditLogNutrients(updated);
        else setNewLogNutrients(updated);
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
            id: `custom-${Date.now()}`,
            name: customNutrientName,
            type: customNutrientType
        };
        const updatedCustomNutrients = [...(grow.customNutrients || []), newNutrient];
        updateGrow({ ...grow, customNutrients: updatedCustomNutrients });
        setCustomNutrientName('');
        setCustomNutrientType('veg');
        setIsAddingCustomNutrient(false);
        setSelectedNutrientId(newNutrient.id);
    };

    const deleteCustomNutrient = (id: string) => {
        if (confirm(t.common?.confirm || 'Delete?')) {
            const updatedCustomNutrients = (grow.customNutrients || []).filter(n => n.id !== id);
            updateGrow({ ...grow, customNutrients: updatedCustomNutrients });
            if (selectedNutrientId === id) {
                setSelectedNutrientId("");
            }
        }
    };

    // --- New Log Handlers ---
    const handleAddLog = () => {
        setShowValidation(true);
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
            ec: newLogEc ? parseFloat(newLogEc) : undefined,
            ph: newLogPh ? parseFloat(newLogPh) : undefined,
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
        setNewLogEc('');
        setNewLogPh('');
        setNewLogTemp('');
        setNewLogHumidity('');
        setNewLogVpd('');
        setNewLogDli('');
        setNewLogPpfd('');
        setNewLogLightCycle('');
        setNewLogNutrients([]);
        setShowValidation(false);
        setIsNewLogTitleManual(false); // Reset manual flag for next log
        const { title } = generateLogMetadata(new Date().toISOString(), grow.currentStage);
        setNewLogTitle(title); // Pre-fill for next
        setIsAddingLog(false); // Collapse form after add
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

    const generateForumBBCode = (log: LogEntry) => {
        const dateStr = format(new Date(log.date), 'dd.MM.yyyy');
        let bbcode = `[b]${dateStr} - ${log.title}[/b]\n\n`;

        // Environment Block
        const envParts = [];
        if (log.environment?.temp) envParts.push(`${log.environment.temp}°C`);
        if (log.environment?.humidity) envParts.push(`${log.environment.humidity}% RLF`);
        if (log.environment?.vpd) envParts.push(`VPD: ${log.environment.vpd} kPa`);
        if (log.environment?.dli) envParts.push(`DLI: ${log.environment.dli}`);
        if (log.environment?.ppfd) envParts.push(`PPFD: ${log.environment.ppfd}`);
        if (log.environment?.lightCycle) envParts.push(`Licht: ${log.environment.lightCycle}`);

        if (envParts.length > 0) {
            bbcode += `[b]${t.growDetail.environment}:[/b] ${envParts.join(', ')}\n`;
        }

        // Water & Nutrients Block
        const nutriParts = [];
        if (log.water) nutriParts.push(`Wasser: ${log.water}L`);
        if (log.nutrients && log.nutrients.length > 0) {
            const nutrientsStr = log.nutrients.map(n => `${n.name} (${n.amount} ${n.unit})`).join(', ');
            nutriParts.push(`Dünger: ${nutrientsStr}`);
        }

        if (nutriParts.length > 0) {
            bbcode += `[b]Wasser & Nährstoffe:[/b] ${nutriParts.join(' - ')}\n`;
        }

        // Content
        if (log.content) {
            bbcode += `\n${log.content}\n`;
        }

        // Images
        if (log.images && log.images.length > 0) {
            bbcode += `\n[i]${log.images.length} Bild(er) angehängt (Upload im Forum erforderlich)[/i]`;
        }

        return bbcode;
    };

    const handleExportForum = (log: LogEntry) => {
        const bbcode = generateForumBBCode(log);
        navigator.clipboard.writeText(bbcode);
        alert(t.growDetail.bbcodeCopied);
    };

    const handleExportAllLogsForum = () => {
        // Sort logs by date ascending (chronological) for the report
        const sortedLogs = [...grow.logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const fullReport = sortedLogs.map(log => generateForumBBCode(log)).join('\n\n------------------------------------------------\n\n');

        navigator.clipboard.writeText(fullReport);
        alert(t.growDetail.bbcodeCopied);
    };

    const stages: Stage[] = ['seedling', 'vegetation', 'flowering', 'drying', 'curing'];

    // Render Helper for Log Form (Shared between New and Edit)
    const renderLogFormUpdated = (isEdit: boolean) => {
        const title = isEdit ? editLogTitle : newLogTitle;
        const setTitle = isEdit ? setEditLogTitle : setNewLogTitle;
        const setIsManual = isEdit ? setIsEditLogTitleManual : setIsNewLogTitleManual;

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
        const setDli = isEdit ? setEditLogDli : setNewLogDli; // Replaced by specific handlers
        const ec = isEdit ? editLogEc : newLogEc;
        const setEc = isEdit ? setEditLogEc : setNewLogEc;
        const ph = isEdit ? editLogPh : newLogPh;
        const setPh = isEdit ? setEditLogPh : setNewLogPh;
        const ppfd = isEdit ? editLogPpfd : newLogPpfd;
        // const setPpfd = isEdit ? setEditLogPpfd : setNewLogPpfd; // Replaced by specific handlers
        const lightCycle = isEdit ? editLogLightCycle : newLogLightCycle;
        // const setLightCycle = isEdit ? setEditLogLightCycle : setNewLogLightCycle; // Replaced by specific handlers

        const handlePpfdChange = isEdit ? handleEditLogPpfdChange : handleNewLogPpfdChange;
        const handleDliChange = isEdit ? handleEditLogDliChange : handleNewLogDliChange;
        const handleLightCycleChange = isEdit ? handleEditLogLightCycleChange : handleNewLogLightCycleChange;

        const nutrients = isEdit ? editLogNutrients : newLogNutrients;

        return (
            <div className="space-y-2">
                {/* Header Section: Compact Card */}
                <div className="bg-slate-800/50 p-2 rounded-lg space-y-2 border border-slate-700">
                    {/* Title (Full Width) */}
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">{t.growDetail?.title || 'Title'}</label>
                        <input
                            className="input font-bold w-full p-1.5 text-sm h-8 bg-slate-900 border-slate-700"
                            style={{
                                borderColor: showValidation && !title ? '#ef4444' : undefined,
                                boxShadow: showValidation && !title ? '0 0 0 1px #ef4444' : undefined
                            }}
                            placeholder={`${t.growDetail?.titlePlaceholder || 'Title'} *`}
                            value={title}
                            onChange={e => {
                                setTitle(e.target.value);
                                setIsManual(true);
                                setShowValidation(false);
                            }}
                        />
                    </div>

                    {/* Grid: Date, Day, Stage */}
                    <div className="grid grid-cols-3 gap-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        {/* Date */}
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">{t.growDetail?.date || 'Date'}</label>
                            <input
                                type="date"
                                className="input w-full p-1.5 text-sm h-8 bg-slate-900 border-slate-700"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>

                        {/* Day */}
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">{t.growDetail?.day || 'Day'}</label>
                            <input
                                type="number"
                                className="input w-full p-1.5 text-sm h-8 bg-slate-900 border-slate-700"
                                placeholder={t.growDetail?.manualDay || 'Day (Manual)'}
                                value={day}
                                onChange={e => setDay(parseInt(e.target.value))}
                            />
                        </div>

                        {/* Stage */}
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">{t.growDetail?.stage || 'Stage'}</label>
                            <div className="relative">
                                <select
                                    className="input w-full p-1.5 text-sm h-8 bg-slate-900 border-slate-700 appearance-none"
                                    value={stage}
                                    onChange={e => setStage(e.target.value as Stage)}
                                >
                                    {stages.map(s => (
                                        <option key={s} value={s}>
                                            {t.profiles?.stages?.[s] || s}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-2 text-slate-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Environment & Water - Compact */}
                <div className="bg-slate-800/50 p-2 rounded-lg space-y-2 border border-slate-700">
                    <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-emerald-400 flex items-center gap-2 text-xs">
                            <Thermometer size={14} /> {t.growDetail?.environment || 'Environment'}
                        </h4>
                        {profile && (
                            <button
                                onClick={() => loadProfileEnvironment(isEdit)}
                                className="text-xs text-white/70 hover:text-white hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 transition-colors"
                                title="Load from Profile"
                                style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none', color: 'rgba(255,255,255,0.7)' }}
                            >
                                <Download size={12} /> <span className="text-[10px]">{t.profiles?.loadFromProfile || 'Load'}</span>
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {/* Water input moved to Nutrients section */}
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 truncate" title={t.growDetail?.temp || 'Temp'}>{t.growDetail?.temp || 'Temp'}</label>
                            <input className="input text-xs py-1 px-2 h-8 w-full" placeholder="24.0" value={temp} onChange={e => setTemp(e.target.value)} type="number" step="0.1" title={t.growDetail?.temp || 'Temp'} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 truncate" title={t.growDetail?.humidity || 'Humidity'}>{t.growDetail?.humidity || 'Humidity'}</label>
                            <input className="input text-xs py-1 px-2 h-8 w-full" placeholder="60" value={humidity} onChange={e => setHumidity(e.target.value)} type="number" title={t.growDetail?.humidity || 'Humidity'} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 truncate" title={t.growDetail?.vpd || 'VPD'}>{t.growDetail?.vpd || 'VPD'}</label>
                            <input className="input text-xs py-1 px-2 h-8 w-full" placeholder="1.0" value={vpd} onChange={e => setVpd(e.target.value)} type="number" step="0.1" title={t.growDetail?.vpd || 'VPD'} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 truncate" title={t.growDetail?.dli || 'DLI'}>{t.growDetail?.dli || 'DLI'}</label>
                            <input className="input text-xs py-1 px-2 h-8 w-full" placeholder="40" value={dli} onChange={e => handleDliChange(e.target.value)} type="number" step="0.1" title={t.growDetail?.dli || 'DLI'} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 truncate" title={t.growDetail?.ppfd || 'PPFD'}>{t.growDetail?.ppfd || 'PPFD'}</label>
                            <input className="input text-xs py-1 px-2 h-8 w-full" placeholder="800" value={ppfd} onChange={e => handlePpfdChange(e.target.value)} type="number" title={t.growDetail?.ppfd || 'PPFD'} />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 truncate" title={t.growDetail?.lightCycle || 'Light Cycle'}>{t.growDetail?.lightCycle || 'Light Cycle'}</label>
                            <input
                                className="input text-xs py-1 px-2 h-8 w-full"
                                placeholder="18/6"
                                value={lightCycle}
                                onChange={e => handleLightCycleChange(e.target.value)}
                                list="light-cycles"
                                title={t.growDetail?.lightCycle || 'Light Cycle'}
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

                {/* Nutrients & Water - Compact */}
                <div className="bg-slate-800/50 p-2 rounded-lg space-y-2 border border-slate-700">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h4 className="font-bold text-purple-400 flex items-center gap-2 text-xs">
                                <Beaker size={14} /> {t.growDetail?.nutrients || 'Nutrients'}
                            </h4>
                            {profile && (
                                <button
                                    onClick={() => loadProfileNutrients(isEdit)}
                                    className="text-xs text-white/70 hover:text-white hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 transition-colors"
                                    title="Load from Profile"
                                    style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none', color: 'rgba(255,255,255,0.7)' }}
                                >
                                    <Download size={12} /> <span className="text-[10px]">{t.profiles?.loadFromProfile || 'Load'}</span>
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsAddingCustomNutrient(!isAddingCustomNutrient)} className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-colors hover:underline p-0 cursor-pointer" style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
                                <Plus size={14} /> {t.growDetail.customNutrient}
                            </button>
                        </div>
                    </div>

                    {isAddingCustomNutrient && (
                        <div className="bg-slate-900 p-3 rounded space-y-3 mb-2 border border-slate-700">
                            <div className="flex gap-2 items-center">
                                <input className="input text-sm flex-1" placeholder={t.growDetail.nutrientName} value={customNutrientName} onChange={e => setCustomNutrientName(e.target.value)} />
                                <select className="input text-sm w-32" value={customNutrientType} onChange={e => setCustomNutrientType(e.target.value as any)}>
                                    <option value="veg">Veg</option>
                                    <option value="bloom">Bloom</option>
                                    <option value="booster">Booster</option>
                                    <option value="other">Other</option>
                                </select>
                                <button onClick={createCustomNutrient} className="btn btn-primary text-xs p-2 h-10 w-10 flex items-center justify-center"><Plus size={16} /></button>
                            </div>

                            {/* List of Existing Custom Nutrients */}
                            {grow.customNutrients && grow.customNutrients.length > 0 && (
                                <div className="space-y-1 pt-2 border-t border-slate-800">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">{t.growDetail?.customNutrient || 'Custom Nutrients'}</p>
                                    {grow.customNutrients.map(nut => (
                                        <div key={nut.id} className="flex justify-between items-center bg-slate-800 px-3 py-2 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${nut.type === 'veg' ? 'bg-emerald-500' :
                                                    nut.type === 'bloom' ? 'bg-purple-500' :
                                                        nut.type === 'booster' ? 'bg-amber-500' : 'bg-slate-500'
                                                    }`}></span>
                                                <span className="text-sm text-slate-300 font-medium">{nut.name}</span>
                                                <span className="text-xs text-slate-500 ml-1">({nut.type})</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => deleteCustomNutrient(nut.id)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                                                    title={t.common.delete}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2">
                        {/* Water Input - span 4 */}

                        <div className="md:col-span-4 flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-blue-900/10 p-1.5 rounded border border-blue-500/20 h-auto min-h-[2.5rem] flex-1">
                                <span className="text-xs text-slate-400 w-8">{t.growDetail?.water || 'Water'}</span>
                                <div className="flex items-center gap-1 flex-1">
                                    <Droplets size={14} className="text-blue-400" />
                                    <input
                                        className="input flex-1 text-xs py-1 px-1 h-8 min-w-0"
                                        placeholder="0.0"
                                        value={water}
                                        onChange={e => setWater(e.target.value)}
                                        type="number"
                                        step="0.1"
                                    />
                                    <span className="text-xs text-slate-500">L</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-yellow-900/10 p-1.5 rounded border border-yellow-500/20 h-auto min-h-[2.5rem] flex-1">
                                <span className="text-xs text-slate-400 w-8">EC</span>
                                <div className="flex items-center gap-1 flex-1">
                                    <Zap size={14} className="text-yellow-400" />
                                    <input
                                        className="input flex-1 text-xs py-1 px-1 h-8 min-w-0"
                                        placeholder="1.2"
                                        value={ec}
                                        onChange={e => setEc(e.target.value)}
                                        type="number"
                                        step="0.1"
                                    />
                                    <span className="text-xs text-slate-500">dS/m</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-teal-900/10 p-1.5 rounded border border-teal-500/20 h-auto min-h-[2.5rem] flex-1">
                                <span className="text-xs text-slate-400 w-8">pH</span>
                                <div className="flex items-center gap-1 flex-1">
                                    <Activity size={14} className="text-teal-400" />
                                    <input
                                        className="input flex-1 text-xs py-1 px-1 h-8 min-w-0"
                                        placeholder="6.2"
                                        value={ph}
                                        onChange={e => setPh(e.target.value)}
                                        type="number"
                                        step="0.1"
                                    />
                                    <span className="text-xs text-slate-500">pH</span>
                                </div>
                            </div>
                        </div>

                        {/* Nutrient Adder - span 8 */}
                        <div className="md:col-span-8 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center min-h-[2.5rem]">
                            <select className="input w-full sm:flex-1 text-xs py-1 px-2 h-8" value={selectedNutrientId} onChange={e => setSelectedNutrientId(e.target.value)}>
                                <option value="">{t.growDetail.selectNutrient}</option>
                                {availableNutrients.map(n => (
                                    <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <input className="input flex-1 sm:w-20 text-xs py-1 px-2 h-8" placeholder={t.growDetail.amount} value={nutrientAmount} onChange={e => setNutrientAmount(e.target.value)} type="number" step="0.1" />
                                <select className="input flex-1 sm:w-24 text-xs py-1 px-2 h-8" value={nutrientUnit} onChange={e => setNutrientUnit(e.target.value as any)}>
                                    <option value="ml/L Wasser">ml/L Wasser</option>
                                    <option value="g/L Wasser">g/L Wasser</option>
                                    <option value="g/L Substrat">g/L Substrat</option>
                                </select>
                                <button onClick={() => addNutrientToLog(isEdit)} className="btn btn-secondary p-1 h-8 w-8 flex items-center justify-center shrink-0">
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {nutrients.length > 0 && (
                        <div className="space-y-2">
                            {nutrients.map((n, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-purple-900/20 border border-purple-500/30 p-2 rounded text-sm">
                                    <span className="text-purple-300 font-bold min-w-[100px] truncate" title={n.name}>{n.name}:</span>
                                    <input
                                        type="number"
                                        value={n.amount}
                                        onChange={e => updateNutrientInLog(idx, 'amount', e.target.value, isEdit)}
                                        className="input w-20 h-8 text-sm py-1 px-2"
                                    />
                                    <select
                                        value={n.unit}
                                        onChange={e => updateNutrientInLog(idx, 'unit', e.target.value, isEdit)}
                                        className="input w-32 h-8 text-sm py-1 px-2"
                                    >
                                        <option value="ml/L Wasser">ml/L Wasser</option>
                                        <option value="g/L Wasser">g/L Wasser</option>
                                        <option value="g/L Substrat">g/L Substrat</option>
                                    </select>
                                    <div className="flex items-center gap-1.5 ml-auto">
                                        {/* Total Calc Display */}
                                        {((n.unit as string) === 'ml/L' || n.unit === 'ml/L Wasser' || (n.unit as string) === 'g/L' || n.unit === 'g/L Wasser') && (isEdit ? editLogWater : newLogWater) && (
                                            <span className="text-xs font-mono text-emerald-400 bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                                To: {
                                                    (n.amount * parseFloat((isEdit ? editLogWater : newLogWater) || '0')).toFixed(1)
                                                }{((n.unit as string) === 'ml/L' || n.unit === 'ml/L Wasser') ? 'ml' : 'g'}
                                            </span>
                                        )}
                                        <button onClick={() => removeNutrientFromLog(idx, isEdit)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors opacity-70 hover:opacity-100 cursor-pointer" style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <textarea
                    className="input min-h-[80px] text-sm"
                    placeholder={t.growDetail.contentPlaceholder}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
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

                            {/* Setup Selection (Multi) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Grow Setups</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {setups.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => {
                                                if (editGrowSetupIds.includes(s.id)) {
                                                    setEditGrowSetupIds(editGrowSetupIds.filter(id => id !== s.id));
                                                } else {
                                                    setEditGrowSetupIds([...editGrowSetupIds, s.id]);
                                                }
                                            }}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${editGrowSetupIds.includes(s.id)
                                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${editGrowSetupIds.includes(s.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                                                {editGrowSetupIds.includes(s.id) && <Hexagon size={10} className="text-white fill-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{s.name}</div>
                                                <div className="text-xs opacity-70">{s.tent || 'No Size'}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {setups.length === 0 && (
                                        <p className="text-slate-500 text-sm italic">No setups available.</p>
                                    )}
                                </div>
                            </div>

                            {/* Plant & Strain Manager */}
                            <div className="bg-slate-900/50 p-3 rounded space-y-3">
                                <label className="text-sm font-bold text-slate-400 block">{t.newGrow.plantCount} & {t.newGrow.strains}</label>

                                {/* Add New Strain */}
                                {seeds.length > 0 && (
                                    <div className="mb-2">
                                        <select
                                            className="input text-xs w-full py-1"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setNewStrainName(e.target.value);
                                                    e.target.value = "";
                                                }
                                            }}
                                        >
                                            <option value="">-- {t.seedBank?.title ? (t.seedBank as any).selectFromStash || 'Aus Samenbestand wählen' : 'Aus Samenbestand wählen'} --</option>
                                            {seeds.filter(s => s.stock > 0).map(s => (
                                                <option key={s.id} value={s.name}>{s.name} ({s.breeder}) - {s.stock}x</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

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
                                        <span className="text-xs text-slate-500 whitespace-nowrap">{t.newGrow?.plantCount || 'Plant Count'}:</span>
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
                                    {t.common?.cancel || 'Cancel'}
                                </button>
                                <button onClick={saveEditGrow} className="btn btn-primary text-sm">
                                    <Save size={16} /> {t.common?.saveChanges || 'Save'}
                                </button>

                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-3 mb-1 group">
                                <h2 className="text-3xl font-bold gradient-text">{grow.name}</h2>
                                <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 uppercase border border-emerald-500/30">
                                    {t.profiles.stages[lastLog?.stage || grow.currentStage] || (lastLog?.stage || grow.currentStage)}
                                </span>
                                <button onClick={startEditGrow} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                            <p className="text-slate-400 flex items-center gap-2 mb-2">
                                <Calendar size={14} /> {t.dashboard?.started || 'Started'} {format(new Date(grow.startDate), 'MMMM do, yyyy')}
                                {profile && <span className="text-emerald-500">• {profile.name}</span>}
                            </p>

                            {/* Combined Info: Setups & Strains */}
                            {(linkedSetups.length > 0 || (grow.strainDistribution && grow.strainDistribution.length > 0) || grow.plantCount) && (
                                <div className="flex flex-wrap gap-2 mb-3 items-center">
                                    {/* Setups - Name Only, Details on Hover */}
                                    {linkedSetups.map(s => (
                                        <div
                                            key={s.id}
                                            className="text-sm text-slate-300 flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-600/50 cursor-help transition-colors hover:bg-slate-700"
                                            title={[
                                                `${t.setupManager?.setupName || 'Name'}: ${s.name}`,
                                                s.tent ? `${t.setupManager?.tent || 'Tent'}: ${s.tent}` : null,
                                                s.lights ? `${t.setupManager?.lights || 'Light'}: ${s.lights}` : null,
                                                s.exhaust ? `${t.setupManager?.exhaust || 'Exhaust'}: ${s.exhaust}` : null,
                                                s.filter ? `${t.setupManager?.filter || 'Filter'}: ${s.filter}` : null,
                                                s.circulation ? `${t.setupManager?.circulation || 'Fan'}: ${s.circulation}` : null,
                                                s.notes ? `${t.setupManager?.notes || 'Note'}: ${s.notes}` : null
                                            ].filter(Boolean).join('\n')}
                                        >
                                            <Hexagon size={12} className="text-emerald-500" />
                                            <span className="font-medium text-xs">{s.name}</span>
                                        </div>
                                    ))}

                                    {/* Strains - Consolidated into one field */}
                                    {grow.strainDistribution && grow.strainDistribution.length > 0 ? (
                                        <div className="text-sm text-slate-300 flex items-center gap-1.5 bg-slate-800/50 px-2.5 py-1 rounded border border-slate-700/50">
                                            {/* <span className="text-emerald-400 font-bold text-xs">🧬</span> */}
                                            <span className="font-medium text-xs">
                                                {grow.strainDistribution.map(s => `${s.count}x ${s.name}`).join(', ')}
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            {grow.plantCount && (
                                                <div className="text-sm text-slate-300 flex items-center gap-1.5 bg-slate-800/50 px-2.5 py-1 rounded border border-slate-700/50">
                                                    <span className="text-emerald-400 font-bold text-xs">🌱</span>
                                                    <span className="font-medium text-xs">{grow.plantCount} {t.newGrow.plantCount || 'Plants'}</span>
                                                </div>
                                            )}
                                            {grow.strains && grow.strains.length > 0 && (
                                                <div className="text-sm text-slate-300 flex items-center gap-1.5 bg-slate-800/50 px-2.5 py-1 rounded border border-slate-700/50" title={grow.strains.join(', ')}>
                                                    <span className="text-emerald-400 font-bold text-xs">🧬</span>
                                                    <span className="font-medium text-xs">{grow.strains.length} {t.newGrow.strains || 'Strains'}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {!isEditingGrow && (
                    <div className="flex gap-2">
                        <button onClick={handleExportProject} className="btn btn-secondary" title={t.growDetail?.export || 'Export'}>
                            <Download size={18} /> {t.growDetail?.export || 'Export'}
                        </button>
                        <button onClick={handleDeleteGrow} className="btn btn-secondary text-red-400 hover:text-red-300 hover:bg-red-900/20 hover:border-red-900/50" title={t.growDetail?.delete || 'Delete'}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Badges - Dashboard Style */}
            <div className="flex flex-wrap gap-2 mb-4">
                <div className="px-3 py-1 rounded-md text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2 shadow-sm">
                    <span>⏱️ {daysSinceStart} {t.growDetail?.totalDays || 'Days'}</span>
                </div>
                <div className="px-3 py-1 rounded-md text-sm font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-2 shadow-sm">
                    <span>📆 {weeksSinceStart} {t.growDetail?.weeks || 'Weeks'}</span>
                </div>

                {/* Flower Stats (Only visible if flowering started) */}
                {flowerDays > 0 && (
                    <>
                        <div className="px-3 py-1 rounded-md text-sm font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center gap-2 shadow-sm">
                            <span>🌺 {flowerDays} {t.growDetail.flowerDays || 'Blütetage'}</span>
                        </div>
                        <div className="px-3 py-1 rounded-md text-sm font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center gap-2 shadow-sm">
                            <span>📅 {flowerWeeks} {t.growDetail.flowerWeeks || 'Blütewochen'}</span>
                        </div>
                    </>
                )}

                {profile && (
                    <>
                        <div className="px-3 py-1 rounded-md text-sm font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-2 shadow-sm" title={t.growDetail.estVegiWeeks}>
                            <span>🌱 {profile.vegiDurationWeeks} {t.growDetail.estVegiWeeks}</span>
                        </div>
                        <div className="px-3 py-1 rounded-md text-sm font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-2 shadow-sm" title={t.growDetail.estFlowerWeeks}>
                            <span>🌻 {profile.flowerDurationWeeks} {t.growDetail.estFlowerWeeks}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Predictions */}
            {
                predictions.length > 0 && (
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
                )
            }

            {/* Upcoming Tasks (Profile Schedule) */}
            {
                upcomingTasks.length > 0 && (
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
                )
            }

            {/* Log Editor - Collapsible */}

            {/* Consumption Stats Card */}
            {(consumptionStats.totalWater > 0 || Object.keys(consumptionStats.nutrientTotals).length > 0) && (
                <div className="glass-panel p-6 mb-8 border-l-4 border-l-emerald-500 animate-fade-in">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Beaker size={20} className="text-emerald-400" /> {t.growDetail?.consumption || 'Verbrauch'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Water Total */}
                        {consumptionStats.totalWater > 0 && (
                            <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-full text-blue-400">
                                    <Droplets size={20} />
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 uppercase font-bold">{t.growDetail?.water ? t.growDetail.water.split('(')[0].trim() : 'Wasser'}</span>
                                    <span className="text-xl font-bold text-blue-300">{consumptionStats.totalWater.toFixed(1)} L</span>
                                </div>
                            </div>
                        )}

                        {/* Nutrient Totals */}
                        {Object.entries(consumptionStats.nutrientTotals).map(([key, data]) => {
                            const [name] = key.split('_');
                            return (
                                <div key={key} className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-full text-purple-400">
                                        <Beaker size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-xs text-slate-400 uppercase font-bold truncate" title={name}>{name}</span>
                                        <span className="text-xl font-bold text-purple-300">{data.amount.toFixed(1)} {data.unit}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="glass-panel p-4">
                {!isAddingLog ? (
                    <button
                        onClick={() => setIsAddingLog(true)}
                        className="btn btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                    >
                        <Plus size={24} /> {t.growDetail.newLogEntry || "Neuer Log Eintrag"}
                    </button>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                            <h3 className="text-lg font-bold text-white">{t.growDetail?.newLogEntry || 'New Log Entry'}</h3>
                            <button
                                onClick={() => setIsAddingLog(false)}
                                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {renderLogFormUpdated(false)}

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                            <label className="btn btn-secondary cursor-pointer text-sm py-1.5">
                                <Camera size={16} /> {t.growDetail?.addPhotos || 'Add Photos'}
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                            <div className="flex gap-2">
                                <button onClick={() => setIsAddingLog(false)} className="btn btn-secondary text-sm py-1.5">
                                    {t.common.cancel}
                                </button>
                                <button onClick={handleAddLog} className="btn btn-primary bg-emerald-500 hover:bg-emerald-600 text-sm py-1.5">
                                    <Save size={18} /> {t.growDetail?.saveEntry || 'Save'}
                                </button>
                            </div>
                        </div>

                        {newLogImages.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-2 mt-2">
                                {newLogImages.map((img, idx) => (
                                    <img key={idx} src={img} alt="Preview" className="h-16 w-16 object-cover rounded border border-slate-600" />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Log History */}
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{t.growDetail?.logHistory || 'History'}</h3>
                        <button onClick={handleExportAllLogsForum} className="bg-slate-800 border border-slate-700 hover:bg-emerald-900/30 text-slate-300 hover:text-emerald-400 px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors" title={t.growDetail?.copyAllForForum || 'Copy All'}>
                            <Share2 size={12} /> {t.growDetail?.copyAllForForum || 'Copy All'}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sort Toggle */}
                        <button
                            onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors"
                        >
                            <ArrowUpDown size={14} />
                            {sortDirection === 'desc' ? (t.common?.newestFirst || 'Newest') : (t.common?.oldestFirst || 'Oldest')}
                        </button>

                        {/* Stage Filter */}
                        <select
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm outline-none focus:border-emerald-500"
                        >
                            <option value="all">{t.common?.allStages || 'All Stages'}</option>
                            {Object.entries(t.profiles?.stages || {}).map(([key, label]) => (
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

                                {renderLogFormUpdated(true)}

                                {/* Edit Log Images */}
                                <div className="mt-4 border-t border-slate-700 pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-bold text-slate-400 text-sm flex items-center gap-2">
                                            <Camera size={14} /> {t.growDetail.photos || 'Photos'}
                                        </h5>
                                        <label className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-colors hover:underline cursor-pointer" style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
                                            <Plus size={14} /> {t.growDetail.addPhotos}
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
                                    <button onClick={() => {
                                        setEditingLogId(null);
                                        setShowValidation(false);
                                    }} className="btn btn-secondary text-sm">
                                        {t.common.cancel}
                                    </button>
                                    <button onClick={saveEditLog} className="btn btn-primary text-sm">
                                        <Save size={16} /> {t.common.saveChanges}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="absolute top-6 right-6 flex gap-2">
                                    <button onClick={() => startEditLog(log)} className="bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-blue-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm" title={t.common.edit}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => deleteLog(log.id)} className="bg-slate-800/50 hover:bg-red-900/20 text-slate-400 hover:text-red-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm" title={t.common.delete}>
                                        <Trash2 size={16} />
                                    </button>
                                    <button onClick={() => handleExportForum(log)} className="bg-slate-800/50 hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-400 p-2 rounded-lg border border-slate-700/50 transition-colors shadow-sm" title={t.growDetail.copyForForum}>
                                        <Share2 size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-slate-800 px-3 py-1 rounded text-center min-w-[80px]">
                                        <span className="block text-sm font-bold text-white">{format(new Date(log.date), 'dd.MM.yyyy')}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-emerald-400">{log.title}</h4>
                                        <span className="text-xs text-slate-500">
                                            {(() => {
                                                // Re-calculate metadata for display
                                                // Note: We could store this in the log object, but calculating it ensures it's always up to date with start date changes
                                                const meta = generateLogMetadata(log.date, log.stage);
                                                return (
                                                    <>
                                                        {t.growDetail.day} {meta.day} / {t.growDetail.week} {meta.week} • {t.profiles.stages[log.stage] || log.stage}
                                                        {meta.flowerDay && (
                                                            <> • BT {meta.flowerDay} / BW {meta.flowerWeek}</>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                {/* Environment Data Display - Compact Badges */}
                                {(log.water || log.environment || (log.nutrients && log.nutrients.length > 0)) && (
                                    <div className="flex flex-wrap gap-2 mb-4 text-xs font-mono">
                                        {/* Water */}
                                        {log.water && (
                                            <span className="flex items-center gap-1.5 bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-500/30" title={t.growDetail.water}>
                                                <Droplets size={12} /> {log.water}L
                                            </span>
                                        )}

                                        {/* Environment */}
                                        {log.environment?.temp && (
                                            <span className="flex items-center gap-1.5 bg-red-900/30 text-red-300 px-2 py-1 rounded border border-red-500/30" title={t.growDetail.temp}>
                                                <Thermometer size={12} /> {log.environment.temp}°C
                                            </span>
                                        )}
                                        {log.environment?.humidity && (
                                            <span className="flex items-center gap-1.5 bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-500/30" title={t.growDetail.humidity}>
                                                <Droplets size={12} /> {log.environment.humidity}%
                                            </span>
                                        )}
                                        {log.environment?.vpd && (
                                            <span className="flex items-center gap-1.5 bg-emerald-900/30 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30" title={t.growDetail.vpd}>
                                                <Wind size={12} /> {log.environment.vpd} kPa
                                            </span>
                                        )}
                                        {log.environment?.dli && (
                                            <span className="flex items-center gap-1.5 bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded border border-yellow-500/30" title={t.growDetail.dli}>
                                                <Sun size={12} /> DLI {log.environment.dli}
                                            </span>
                                        )}
                                        {log.environment?.ppfd && (
                                            <span className="flex items-center gap-1.5 bg-orange-900/30 text-orange-300 px-2 py-1 rounded border border-orange-500/30" title={t.growDetail.ppfd}>
                                                <Sun size={12} /> {log.environment.ppfd}
                                            </span>
                                        )}
                                        {log.environment?.lightCycle && (
                                            <span className="flex items-center gap-1.5 bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600" title={t.growDetail.lightCycle}>
                                                <Sun size={12} /> {log.environment.lightCycle}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Nutrients */}



                                {/* Nutrients (Separate Block) */}
                                {((log.nutrients && log.nutrients.length > 0) || false) && (
                                    <div className="mt-4 mb-4 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 block">
                                        <h5 className="font-bold text-slate-400 flex items-center gap-2 border-b border-slate-700/50 pb-2 mb-3 text-sm">
                                            <Beaker size={14} className="text-purple-400" /> {t.growDetail.nutrients}
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {log.nutrients!.map((n, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
                                                    <span className="text-purple-300 text-sm font-medium">{n.name}</span>
                                                    <span className="font-mono text-xs text-slate-400 border-l border-slate-600 pl-2">
                                                        {n.amount} {n.unit?.split(' ')[0]}
                                                        {((n.unit as string) === 'ml/L' || n.unit === 'ml/L Wasser' || (n.unit as string) === 'g/L' || n.unit === 'g/L Wasser') && log.water && (
                                                            <span className="text-slate-500 ml-1">
                                                                ({(n.amount * log.water).toFixed(1)}{((n.unit as string) === 'ml/L' || n.unit === 'ml/L Wasser') ? 'ml' : 'g'})
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
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
        </div >
    );
};
