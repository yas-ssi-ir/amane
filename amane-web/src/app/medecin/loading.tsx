export default function MedecinLoading() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-4xl">
      <div className="mb-6 space-y-2">
        <div className="h-3 w-24 rounded-full bg-white/[0.05] animate-pulse" />
        <div className="h-8 w-48 rounded-xl bg-white/[0.05] animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
