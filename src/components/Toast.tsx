type ToastProps = {
  message: string | null;
  tone: 'info' | 'error';
};

// Auto-dismiss is App's job (timer in App); this just renders the snackbar.
export default function Toast({ message, tone }: ToastProps) {
  if (message === null) return null;

  return (
    <div className={`toast toast-${tone}`} role="status">
      {message}
    </div>
  );
}
