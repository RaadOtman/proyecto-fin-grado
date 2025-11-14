import type { Availability } from '../types';

// Genera tramos de 1h 30 min desde las 09:00 hasta las 22:00
function buildSlots90(dateISO: string) {
  const slots: { startTime: string; endTime: string }[] = [];

  let current = new Date(dateISO + 'T09:00:00');
  const endOfDay = new Date(dateISO + 'T22:00:00'); // hora límite para fin del partido

  while (current < endOfDay) {
    const start = new Date(current);
    const end = new Date(current);
    end.setMinutes(end.getMinutes() + 90); // 1h 30 min

    if (end > endOfDay) break;

    slots.push({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });

    current = end;
  }

  return slots;
}

export async function getAvailability(date: string): Promise<Availability> {
  const courts = [
    { id: 1, name: 'Pista 1', isActive: true },
    { id: 2, name: 'Pista 2', isActive: true },
    { id: 3, name: 'Pista 3', isActive: true },
    { id: 4, name: 'Pista 4', isActive: true },
  ];

  const slots = buildSlots90(date);
  const bookings = [];

  const numSlots = slots.length;
  const maxBookings = Math.min(6, numSlots);

  for (let i = 0; i < maxBookings; i++) {
    const courtId = 1 + Math.floor(Math.random() * courts.length);
    const s = slots[Math.floor(Math.random() * numSlots)];
    bookings.push({
      id: i + 1,
      courtId,
      startTime: s.startTime,
      endTime: s.endTime,
      status: 'CONFIRMED' as const,
    });
  }

  await new Promise((r) => setTimeout(r, 200));

  return { courts, bookings };
}

export async function createBookingMock(payload: {
  courtId: number;
  startTime: string;
  endTime: string;
}) {
  console.log('Reserva simulada enviada:', payload);
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true };
}
