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
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  vegiDurationWeeks: number;
  flowerDurationWeeks: number;
  stages: {
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
  nutrients?: NutrientEntry[];
  environment?: EnvironmentLog;
}

export interface StrainDistribution {
  id: string;
  name: string;
  count: number;
}

export interface Grow {
  id: string;
  name: string;
  startDate: string; // ISO Date
  profileId?: string;
  status: 'active' | 'archived';
  currentStage: Stage;
  logs: LogEntry[];
  customNutrients?: Nutrient[]; // Nutrients added specifically for this grow
  plantCount?: number;
  strains?: string[]; // List of strain names (Legacy/Simple)
  strainDistribution?: StrainDistribution[]; // Detailed strain counts
}

export interface GrowContextType {
  grows: Grow[];
  profiles: Profile[];
  addGrow: (grow: Grow) => void;
  updateGrow: (grow: Grow) => void;
  deleteGrow: (id: string) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (profile: Profile) => void;
  deleteProfile: (id: string) => void;
  importData: (data: { grows: Grow[]; profiles: Profile[] }) => void;
  clearData: () => void;
}
