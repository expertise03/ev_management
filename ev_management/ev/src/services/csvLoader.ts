import Papa from 'papaparse';
import { useDataStore } from '@/store/dataStore';
import type { Manager, Driver, TripRecord, HierarchyEntry } from '@/types';

const FILES = [
  { key: 'managers',  file: '/data/Manager_Master_12.csv' },
  { key: 'drivers',   file: '/data/Driver_Master_240.csv' },
  { key: 'trips',     file: '/data/Trip_Telemetry_5000.csv' },
  { key: 'hierarchy', file: '/data/Hierarchy_Map.csv' },
];

function parseCSV<T>(url: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data),
      error: reject,
    });
  });
}

export async function loadAllData() {
  const { setManagers, setDrivers, setTrips, setHierarchy, setProgress, setLoaded } = useDataStore.getState();
  const total = FILES.length;

  for (let i = 0; i < FILES.length; i++) {
    const { key, file } = FILES[i];
    setProgress(Math.round((i / total) * 90), `Loading ${key}... (${i + 1}/${total})`);
    try {
      const data = await parseCSV(file);
      if (key === 'managers')  setManagers(data as Manager[]);
      if (key === 'drivers')   setDrivers(data as Driver[]);
      if (key === 'trips')     setTrips(data as TripRecord[]);
      if (key === 'hierarchy') setHierarchy(data as HierarchyEntry[]);
    } catch (e) {
      console.warn(`Failed to load ${file}`, e);
    }
  }

  setProgress(100, 'Ready!');
  setTimeout(() => setLoaded(true), 400);
}
