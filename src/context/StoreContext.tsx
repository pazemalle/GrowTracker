import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Grow, Profile, GrowContextType, GrowSetup, Seed, Note } from '../types';
import { useAuth } from './AuthContext';

const GrowContext = createContext<GrowContextType | undefined>(undefined);

const STORAGE_KEY_GROWS = 'cgt_grows';
const STORAGE_KEY_PROFILES = 'cgt_profiles';
const STORAGE_KEY_SETUPS = 'cgt_setups';
const STORAGE_KEY_SEEDS = 'cgt_seeds';
const STORAGE_KEY_NOTES = 'cgt_notes';
const API_URL = 'http://localhost:3001/api';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [grows, setGrows] = useState<Grow[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [setups, setSetups] = useState<GrowSetup[]>([]);
    const [seeds, setSeeds] = useState<Seed[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Get auth state (but only if AuthContext is available)
    let token: string | null = null;
    let isAuthenticated = false;
    try {
        const auth = useAuth();
        token = auth.token;
        isAuthenticated = auth.isAuthenticated;
    } catch {
        // AuthContext not available, continue in guest mode
    }

    // Load from LocalStorage on mount (only if not authenticated)
    useEffect(() => {
        // If authenticated, skip loading from localStorage - server is source of truth
        if (isAuthenticated) {
            setIsInitialized(true);
            return;
        }

        const loadedGrows = localStorage.getItem(STORAGE_KEY_GROWS);
        const loadedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES);
        const loadedSetups = localStorage.getItem(STORAGE_KEY_SETUPS);

        const loadedSeeds = localStorage.getItem(STORAGE_KEY_SEEDS);
        const loadedNotes = localStorage.getItem(STORAGE_KEY_NOTES);

        if (loadedGrows) { try { setGrows(JSON.parse(loadedGrows)); } catch (e) { console.error(e); } }
        if (loadedProfiles) { try { setProfiles(JSON.parse(loadedProfiles)); } catch (e) { console.error(e); } }
        if (loadedSetups) { try { setSetups(JSON.parse(loadedSetups)); } catch (e) { console.error(e); } }
        if (loadedSeeds) { try { setSeeds(JSON.parse(loadedSeeds)); } catch (e) { console.error(e); } }
        if (loadedNotes) { try { setNotes(JSON.parse(loadedNotes)); } catch (e) { console.error(e); } }

        setIsInitialized(true);
    }, [isAuthenticated]);

    // Fetch data from server when user logs in
    useEffect(() => {
        if (!isInitialized || !isAuthenticated || !token) return;

        const fetchServerData = async () => {
            try {
                const response = await fetch(`${API_URL}/data`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const serverData = await response.json();
                    if (serverData.grows) setGrows(serverData.grows);
                    if (serverData.profiles) setProfiles(serverData.profiles);
                    if (serverData.setups) setSetups(serverData.setups);
                    if (serverData.seeds) setSeeds(serverData.seeds);
                    if (serverData.notes) setNotes(serverData.notes);
                }
            } catch (error) {
                console.error('Failed to fetch server data:', error);
            }
        };

        fetchServerData();
    }, [isAuthenticated, token, isInitialized]);

    // Save to LocalStorage (Guest Mode)
    useEffect(() => {
        if (!isInitialized || isAuthenticated) return;
        localStorage.setItem(STORAGE_KEY_GROWS, JSON.stringify(grows));
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
        localStorage.setItem(STORAGE_KEY_SETUPS, JSON.stringify(setups));
        localStorage.setItem(STORAGE_KEY_SEEDS, JSON.stringify(seeds));
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    }, [grows, profiles, setups, seeds, notes, isInitialized, isAuthenticated]);

    // Sync to Server (Authenticated Mode)
    useEffect(() => {
        if (!isInitialized || !isAuthenticated || !token) return;

        const syncToServer = async () => {
            try {
                await fetch(`${API_URL}/data`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ grows, profiles, setups, seeds, notes })
                });
                console.log('Synced to server');
            } catch (error) {
                console.error('Failed to sync to server:', error);
            }
        };

        const timeoutId = setTimeout(syncToServer, 1000);
        return () => clearTimeout(timeoutId);
    }, [grows, profiles, setups, seeds, notes, isAuthenticated, token, isInitialized]);

    const addGrow = (grow: Grow) => setGrows((prev) => [...prev, grow]);
    const updateGrow = (u: Grow) => setGrows((prev) => prev.map((g) => (g.id === u.id ? u : g)));
    const deleteGrow = (id: string) => setGrows((prev) => prev.filter((g) => g.id !== id));

    const addProfile = (p: Profile) => setProfiles((prev) => [...prev, p]);
    const updateProfile = (u: Profile) => setProfiles((prev) => prev.map((p) => (p.id === u.id ? u : p)));
    const deleteProfile = (id: string) => setProfiles((prev) => prev.filter((p) => p.id !== id));

    const addSetup = (s: GrowSetup) => setSetups((prev) => [...prev, s]);
    const updateSetup = (u: GrowSetup) => setSetups((prev) => prev.map((s) => (s.id === u.id ? u : s)));
    const deleteSetup = (id: string) => setSetups((prev) => prev.filter((s) => s.id !== id));

    const addSeed = (s: Seed) => setSeeds((prev) => [...prev, s]);
    const updateSeed = (u: Seed) => setSeeds((prev) => prev.map((s) => (s.id === u.id ? u : s)));
    const deleteSeed = (id: string) => setSeeds((prev) => prev.filter((s) => s.id !== id));

    const addNote = (n: Note) => setNotes((prev) => [...prev, n]);
    const updateNote = (u: Note) => setNotes((prev) => prev.map((n) => (n.id === u.id ? u : n)));
    const deleteNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));

    const importData = (data: { grows: Grow[]; profiles: Profile[]; setups?: GrowSetup[]; seeds?: Seed[]; notes?: Note[] }) => {
        setGrows(data.grows);
        setProfiles(data.profiles);
        if (data.setups) setSetups(data.setups);
        if (data.seeds) setSeeds(data.seeds);
        if (data.notes) setNotes(data.notes);
    };

    const clearData = () => {
        console.log('[StoreContext] Clearing all data');
        setGrows([]);
        setProfiles([]);
        setSetups([]);
        setSeeds([]);
        setNotes([]);
    };

    return (
        <GrowContext.Provider
            value={{
                grows, profiles, setups, seeds, notes,
                addGrow, updateGrow, deleteGrow,
                addProfile, updateProfile, deleteProfile,
                addSetup, updateSetup, deleteSetup,
                addSeed, updateSeed, deleteSeed,
                addNote, updateNote, deleteNote,
                importData, clearData,
            }}
        >
            {children}
        </GrowContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(GrowContext);
    if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
    return context;
};
