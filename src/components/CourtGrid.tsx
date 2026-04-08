// src/components/CourtGrid.tsx

import type { Court, Booking } from '../types';

type Slot = {
  startTime: string;
  endTime: string;
};

type CourtGridProps = {
  date: string;
  courts: Court[];
  bookings: Booking[];
  onSelect?: (selection: { courtId: number; startTime: string; endTime: string }) => void;
};

function buildSlots90(date: string): Slot[] {
  const slots: Slot[] = [];

  let current = new Date(date + 'T09:00:00');
  const endOfDay = new Date(date + 'T22:00:00');

  while (current < endOfDay) {
    const start = new Date(current);
    const end = new Date(current);
    end.setMinutes(end.getMinutes() + 90);

    if (end > endOfDay) break;

    slots.push({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });

    current = end;
  }

  return slots;
}

function formatRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

  return `${start.toLocaleTimeString([], opts)} - ${end.toLocaleTimeString([], opts)}`;
}

function isBusy(courtId: number, slot: Slot, bookings: Booking[]) {
  return bookings.some(
    (b) =>
      b.courtId === courtId &&
      b.status === 'CONFIRMED' &&
      b.startTime === slot.startTime
  );
}

export default function CourtGrid({ date, courts, bookings, onSelect }: CourtGridProps) {
  if (!courts || courts.length === 0) {
    return (
      <div className="card">
        <p>No hay pistas configuradas para este día.</p>
      </div>
    );
  }

  const slots = buildSlots90(date);

  if (!slots.length) {
    return (
      <div className="card">
        <p>No hay tramos horarios disponibles para este día.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Disponibilidad – {date}</h3>
        <span className="badge">Duración partido: 1h 30 min</span>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Tramo</th>
              {courts.map((court) => (
                <th key={court.id} style={{ textAlign: 'center', padding: '6px 8px' }}>
                  {court.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, idx) => (
              <tr key={idx}>
                <td style={{ padding: '6px 8px', fontWeight: 500 }}>
                  {formatRange(slot.startTime, slot.endTime)}
                </td>

                {courts.map((court) => {
                  const busy = isBusy(court.id, slot, bookings);

                  if (busy) {
                    return (
                      <td key={court.id} className="ocupado" style={{ textAlign: 'center' }}>
                        Ocupado
                      </td>
                    );
                  }

                  return (
                    <td key={court.id} className="libre" style={{ textAlign: 'center' }}>
                      {onSelect ? (
                        <button
                          className="slot-btn"
                          onClick={() =>
                            onSelect({
                              courtId: court.id,
                              startTime: slot.startTime,
                              endTime: slot.endTime,
                            })
                          }
                        >
                          Reservar
                        </button>
                      ) : (
                        'Libre'
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}