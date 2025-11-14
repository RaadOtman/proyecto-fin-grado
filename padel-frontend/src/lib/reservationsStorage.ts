// src/lib/reservationsStorage.ts

export type MyReservation = {
    id: string;
    courtId: number;
    courtName: string;
    date: string; // YYYY-MM-DD
    startTime: string;
    endTime: string;
    status: 'CONFIRMED' | 'CANCELLED';
  };
  
  const KEY = 'my_reservations_v1';
  
  export function loadMyReservations(): MyReservation[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }
  
  export function saveMyReservations(list: MyReservation[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(list));
  }
  
  export function addMyReservation(res: MyReservation) {
    const list = loadMyReservations();
    list.push(res);
    saveMyReservations(list);
  }
  
  export function updateReservationStatus(id: string, status: 'CONFIRMED' | 'CANCELLED') {
    const list = loadMyReservations();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return;
    list[idx].status = status;
    saveMyReservations(list);
  }