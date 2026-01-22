export type Stage = 'seedling' | 'vegetation' | 'flowering' | 'drying' | 'curing';

export interface StageTask {
  id: string;
  day: number;
  task: string;
}

export interface StageConfig {
  temp: string;
  humidity: string;
  vpd?: string;
  dli?: string;
  ppfd?: string;
  lightCycle?: string;
  light?: string;
  ec?: string; // New EC value
  ph?: string; // New pH value
  nutrients: NutrientEntry[];
  notes: string;
  schedule: StageTask[];
}

export interface Nutrient {
  id: string;
  name: string;
  type: 'veg' | 'bloom' | 'booster' | 'other';
}

export interface NutrientEntry {
  nutrientId: string;
  name: string;
  amount: number;
  unit: 'ml/L Wasser' | 'g/L Wasser' | 'g/L Substrat';
}

export interface EnvironmentLog {
  temp?: number;
  humidity?: number;
  vpd?: number;
  dli?: number;
  ppfd?: number;
  lightCycle?: string;
  ec?: number; // Added EC here too for consistency if we track env logs
  ph?: number;
}

export interface WeekConfig extends StageConfig {
  // Extending StageConfig for week-specific settings
}

export interface PhaseConfig {
  weeks: WeekConfig[]; // Array of weekly configs
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  vegiDurationWeeks?: number; // Optional/Derived
  flowerDurationWeeks?: number; // Optional/Derived
  phases: {
    vegetation: PhaseConfig;
    flowering: PhaseConfig;
    drying: PhaseConfig;
  };
  stages?: { // Legacy support during migration
    seedling: StageConfig;
    vegetation: StageConfig;
    flowering: StageConfig;
    drying: StageConfig;
    curing: StageConfig;
  };
  nutrients: Nutrient[]; // Available nutrients definitions
  notes: string; // General profile notes
}

export interface LogEntry {
  id: string;
  date: string; // ISO Date
  stage: Stage;
  stageDay: number; // e.g. Vegi Day 15
  day?: number; // Manual override for "Day X" of the grow
  title: string;
  content: string;
  images: string[]; // Base64 strings
  tags: string[];
  water?: number; // Liters
  ec?: number; // Electrical Conductivity
  ph?: number; // pH Value
  nutrients?: NutrientEntry[];
  environment?: EnvironmentLog;
}

export interface StrainDistribution {
  id: string;
  name: string;
  count: number;
}

export interface GrowSetup {
  id: string;
  name: string;
  tent: string; // e.g., "80x80x180"
  lights: string; // e.g., "Sanlight EVO 4-80"
  exhaust: string; // Abluft
  filter: string; // AKF
  circulation: string; // Umluft
  notes: string;
}

export interface Seed {
  id: string;
  name: string;
  breeder: string;
  strainType: 'automatic' | 'photoperiodic' | 'feminized' | 'regular';
  thc?: string; // e.g. "25%"
  flowerTime?: string; // e.g. "8-9 Weeks"
  taste?: string;
  stock: number;
  notes: string;
  onWatchlist: boolean;
}

export interface Grow {
  id: string;
  name: string;
  startDate: string; // ISO Date
  profileId?: string;
  setupIds?: string[]; // List of Linked GrowSetups
  setupId?: string; // Legacy: Single Linked GrowSetup
  status: 'active' | 'archived';
  currentStage: Stage;
  logs: LogEntry[];
  customNutrients?: Nutrient[]; // Nutrients added specifically for this grow
  plantCount?: number;
  strains?: string[]; // List of strain names (Legacy/Simple)
  strainDistribution?: StrainDistribution[]; // Detailed strain counts
}


export interface Note {
  id: string;
  title: string;
  content: string;
  date: string; // ISO Date
  tags?: string[];
}

export interface GrowContextType {
  grows: Grow[];
  profiles: Profile[];
  setups: GrowSetup[]; // New
  seeds: Seed[]; // New
  notes: Note[];
  addGrow: (grow: Grow) => void;
  updateGrow: (grow: Grow) => void;
  deleteGrow: (id: string) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (profile: Profile) => void;
  deleteProfile: (id: string) => void;
  addSetup: (setup: GrowSetup) => void;
  updateSetup: (setup: GrowSetup) => void;
  deleteSetup: (id: string) => void;
  addSeed: (seed: Seed) => void;
  updateSeed: (seed: Seed) => void;
  deleteSeed: (id: string) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  importData: (data: { grows: Grow[]; profiles: Profile[]; setups?: GrowSetup[]; seeds?: Seed[]; notes?: Note[] }) => void;
  clearData: () => void;
}
