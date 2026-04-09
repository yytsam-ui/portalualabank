export function ApiFormError({ error }: { error?: string | null }) {
  if (!error) return null;

  return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>;
}
