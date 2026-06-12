import { create } from 'zustand';
import type { Manager, Driver, TripRecord, HierarchyEntry } from '@/types';

interface DataState {
  managers: Manager[];
  drivers: Driver[];
  trips: TripRecord[];
  hierarchy: HierarchyEntry[];
  loaded: boolean;
  loadProgress: number;
  loadStatus: string;
  setManagers: (d: Manager[]) => void;
  setDrivers: (d: Driver[]) => void;
  setTrips: (d: TripRecord[]) => void;
  setHierarchy: (d: HierarchyEntry[]) => void;
  setLoaded: (v: boolean) => void;
  setProgress: (n: number, s: string) => void;
  // derived helpers
  getManagerDrivers: (managerId: string) => Driver[];
  getManagerTrips: (managerId: string) => TripRecord[];
  getDriverTrips: (driverId: string) => TripRecord[];
}

export const useDataStore = create<DataState>((set, get) => ({
  managers: [],
  drivers: [],
  trips: [],
  hierarchy: [],
  loaded: false,
  loadProgress: 0,
  loadStatus: 'Initialising...',
  setManagers: (d) => set({ managers: d }),
  setDrivers: (d) => set({ drivers: d }),
  setTrips: (d) => set({ trips: d }),
  setHierarchy: (d) => set({ hierarchy: d }),
  setLoaded: (v) => set({ loaded: v }),
  setProgress: (n, s) => set({ loadProgress: n, loadStatus: s }),

  getManagerDrivers: (managerId) =>
    get().drivers.filter(d => d.fleet_manager_id === managerId),

  getManagerTrips: (managerId) =>
    get().trips.filter(t => t.fleet_manager_id === managerId),

  getDriverTrips: (driverId) =>
    get().trips.filter(t => t.driver_id === driverId),
}));
