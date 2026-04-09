export function SectionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">{children}</div>;
}
