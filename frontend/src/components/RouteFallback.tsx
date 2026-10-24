/** Shown while a lazy route chunk loads. Deliberately quiet. */
export default function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--deep)]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent, var(--cyan), var(--violet))",
            maskImage: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)",
            WebkitMaskImage:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)",
          }}
        />
        <span className="mono-micro text-[var(--faint)]">Loading</span>
      </div>
    </div>
  );
}
