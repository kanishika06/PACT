import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Keeps a render crash from white-screening the whole demo. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[var(--deep)] px-6 text-center">
        <div
          className="h-12 w-12 rounded-full opacity-60"
          style={{ background: "var(--grad)", filter: "blur(3px)" }}
        />
        <h1 className="font-display text-3xl font-light text-[var(--text)]">
          Something broke on this screen.
        </h1>
        <p className="mono-micro max-w-md text-[var(--muted)]">{this.state.error.message}</p>
        <button
          onClick={() => {
            this.setState({ error: null });
            window.location.href = "/dashboard";
          }}
          className="notched-sm px-6 py-3 text-[#06121a]"
          style={{ background: "var(--grad)" }}
        >
          <span className="mono-micro font-medium">Back to dashboard</span>
        </button>
      </div>
    );
  }
}
