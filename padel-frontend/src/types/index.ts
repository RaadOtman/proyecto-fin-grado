// src/types/index.ts

export type Court = {
  id: number;
  name: string;
  isActive: boolean;
};

export type Booking = {
  id: number;
  courtId: number;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CANCELLED';
};

export type Availability = {
  courts: Court[];
  bookings: Booking[];
};