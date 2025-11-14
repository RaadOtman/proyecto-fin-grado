// src/components/BackendStatus.tsx
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

type AvailabilityResponse = {
  date: string;
  timeSlots: string[];
  courts: {
    id: number;
    name: string;
    type: string;
    slots: {
      time: string;
      status: 'FREE' | 'OCCUPIED';
    }[];
  }[];
};

export default function BackendStatus() {
  const [healthText, setHealthText] = useState<string>('Cargando...');
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // 1) /health
        const healthRes = await fetch(`${API_BASE_URL}/health`);
        const healthJson = await healthRes.json();
        setHealthText(
          `${healthJson.status ?? 'OK'} - ${healthJson.message ?? 'Sin mensaje'}`
        );

        // 2) /availability con una fecha fija de prueba
        const date = '2025-11-20';
        const availRes = await fetch(
          `${API_BASE_URL}/availability?date=${encodeURIComponent(date)}`
        );

        if (!availRes.ok) {
          throw new Error(`Error HTTP ${availRes.status} en /availability`);
        }

        const availJson = (await availRes.json()) as AvailabilityResponse;
        setAvailability(availJson);
      } catch (err: any) {
        console.error('Error llamando al backend:', err);
        setError(err.message ?? 'Error desconocido');
      }
    }

    loadData();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 0' }}>
      <h1>Estado del backend (Demo)</h1>

      <section
        style={{
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 12,
          marginBottom: 16,
          background: '#f9fafb',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Health</h2>
        <p style={{ margin: 0 }}>{healthText}</p>
      </section>

      {error && (
        <section
          style={{
            borderRadius: 12,
            border: '1px solid #fecaca',
            padding: 12,
            marginBottom: 16,
            background: '#fef2f2',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Error</h2>
          <p style={{ margin: 0 }}>{error}</p>
        </section>
      )}

      {availability && (
        <section
          style={{
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 12,
            background: '#ffffff',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Disponibilidad (demo)</h2>
          <p style={{ margin: '4px 0 8px', fontSize: 13, color: '#6b7280' }}>
            Fecha: <strong>{availability.date}</strong>
          </p>

          <div style={{ display: 'grid', gap: 8 }}>
            {availability.courts.map((court) => (
              <div
                key={court.id}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  padding: 8,
                  background: '#f9fafb',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    fontSize: 13,
                  }}
                >
                  <span>
                    <strong>{court.name}</strong> · {court.type}
                  </span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>
                    Tramos: {court.slots.length}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    fontSize: 11,
                  }}
                >
                  {court.slots.map((slot) => (
                    <span
                      key={slot.time}
                      style={{
                        padding: '3px 7px',
                        borderRadius: 999,
                        background:
                          slot.status === 'OCCUPIED' ? '#fee2e2' : '#dcfce7',
                        color:
                          slot.status === 'OCCUPIED' ? '#b91c1c' : '#166534',
                      }}
                    >
                      {slot.time} ·{' '}
                      {slot.status === 'OCCUPIED' ? 'Ocupada' : 'Libre'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!availability && !error && (
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Cargando disponibilidad de ejemplo desde el backend...
        </p>
      )}
    </div>
  );
}