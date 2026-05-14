export default function AdminLoading() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl">
      <div className="mb-8 space-y-2">
        <div className="h-3 w-24 rounded-full bg-white/[0.05] animate-pulse" />
        <div className="h-8 w-56 rounded-xl bg-white/[0.05] animate-pulse" />
        <div className="h-4 w-80 rounded-lg bg-white/[0.05] animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
