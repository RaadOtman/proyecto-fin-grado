type ToastProps = {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
  };
  
  export default function Toast({ message, type, onClose }: ToastProps) {
    return (
      <div className={`toast toast-${type}`}>
        <span>{message}</span>
        <button onClick={onClose}>✕</button>
      </div>
    );
  }