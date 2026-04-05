export default function DashboardOverviewPlaceholder() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <h1 className="text-3xl font-serif text-white">Brand Overview</h1>
      <p className="text-[var(--text-secondary)]">Your metrics and automation status will appear here.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Posts Published</h3>
          <p className="text-4xl font-serif text-white">12</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Leads Discovered</h3>
          <p className="text-4xl font-serif text-white">148</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Emails Sent</h3>
          <p className="text-4xl font-serif text-white">32</p>
        </div>
      </div>
    </div>
  );
}
