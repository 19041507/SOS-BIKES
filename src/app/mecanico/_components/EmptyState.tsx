type EmptyStateProps = {
  title: string;
  description: string;
  live?: boolean;
};

export function EmptyState({ title, description, live }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-10 text-center">
      {live && <span className="mb-3 size-4 rounded-full bg-ok shadow-[0_0_0_10px_rgba(23,128,69,0.15)]" />}
      <h2 className="font-display text-[22px] font-bold">{title}</h2>
      <p className="text-[15px] text-muted">{description}</p>
    </div>
  );
}
