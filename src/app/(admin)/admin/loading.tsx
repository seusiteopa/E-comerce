export default function AdminLoading() {
  return (
    <div className="px-5 py-8 sm:px-8" aria-busy="true" aria-live="polite">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-line" />
      <div className="mt-6 flex flex-col gap-3">
        <div className="h-16 animate-pulse rounded-xl bg-line/70" />
        <div className="h-16 animate-pulse rounded-xl bg-line/70" />
        <div className="h-16 animate-pulse rounded-xl bg-line/70" />
      </div>
      <p className="mt-6 text-sm text-ink-soft">Carregando...</p>
    </div>
  );
}
