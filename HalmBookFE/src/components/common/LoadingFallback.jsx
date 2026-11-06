export default function LoadingFallback({ message = 'Đang tải...' }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-paper-50 dark:bg-night-bg transition-colors duration-300">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-paper-border dark:border-night-border rounded-full animate-spin border-t-wine dark:border-t-gold"></div>
        <div className="absolute font-bold text-xs text-wine dark:text-gold">HALM</div>
      </div>
      <p className="mt-4 text-sm font-medium text-ink-muted dark:text-night-muted tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
}
