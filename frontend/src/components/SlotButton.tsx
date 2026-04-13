// src/components/SlotButton.tsx

type SlotButtonProps = {
  busy: boolean;
  label: string;
  onClick?: () => void;
};

export default function SlotButton({ busy, label, onClick }: SlotButtonProps) {
  const className = `slot ${busy ? 'busy' : 'free'}`;

  return (
    <button className={className} disabled={busy} onClick={onClick}>
      {label}
    </button>
  );
}