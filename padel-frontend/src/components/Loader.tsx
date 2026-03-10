export default function Loader({ text = "Cargando..." }: { text?: string }) {
    return (
      <div className="loader-wrap" role="status" aria-live="polite">
        <div className="loader-spinner" />
        <span>{text}</span>
      </div>
    );
  }