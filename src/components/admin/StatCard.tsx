import type { ReactNode } from "react";

type Accent = "default" | "green" | "neutral" | "blue" | "amber";

type Props = {
  icon: ReactNode;
  value: number | string;
  label: string;
  accent?: Accent;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
};

export default function StatCard({ icon, value, label, accent = "default", trend }: Props) {
  const iconClass = [
    "stat-card-icon",
    accent !== "default" ? `stat-card-icon--${accent}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-card-body">
          <div className="stat-card-value">{value}</div>
          <div className="stat-card-label">{label}</div>
          {trend && (
            <div className={`stat-card-trend stat-card-trend--${trend.direction}`}>
              {trend.value}
            </div>
          )}
        </div>
        <div className={iconClass}>{icon}</div>
      </div>
    </div>
  );
}
