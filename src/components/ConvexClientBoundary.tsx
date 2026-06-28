"use client";

import { Component, type ErrorInfo, type ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Card } from "@/components/Card";

function getConvexUrlError(convexUrl: string | undefined) {
  if (!convexUrl) {
    return "NEXT_PUBLIC_CONVEX_URL is not set. Add your Convex cloud URL in Vercel environment variables.";
  }

  try {
    const url = new URL(convexUrl);
    const isHttp = url.protocol === "https:" || url.protocol === "http:";
    const isLocalhost = url.hostname === "127.0.0.1" || url.hostname === "localhost";

    if (!isHttp) {
      return "NEXT_PUBLIC_CONVEX_URL must be a valid http(s) URL.";
    }

    if (process.env.NODE_ENV === "production" && isLocalhost) {
      return "NEXT_PUBLIC_CONVEX_URL points to localhost. Vercel needs your Convex cloud URL, not 127.0.0.1.";
    }

    return null;
  } catch {
    return "NEXT_PUBLIC_CONVEX_URL is not a valid URL.";
  }
}

function ConvexConfigError({ message }: { message: string }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">Convex is not configured</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
      <p className="mt-4 rounded-xl border border-card-border bg-background/60 p-3 font-mono text-xs text-muted">
        Expected: NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
      </p>
    </Card>
  );
}

class ConvexRuntimeErrorBoundary extends Component<
  { children: ReactNode },
  { errorMessage: string | null }
> {
  state = { errorMessage: null };

  static getDerivedStateFromError(error: unknown) {
    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : "The Convex client could not load this view.",
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("Convex runtime error", error, errorInfo);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <Card>
          <h2 className="text-xl font-semibold">This data view could not load</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {this.state.errorMessage}
          </p>
          <p className="mt-4 text-sm text-muted">
            Check that the Convex deployment is live and that Vercel has the
            correct `NEXT_PUBLIC_CONVEX_URL`.
          </p>
        </Card>
      );
    }

    return this.props.children;
  }
}

export function ConvexClientBoundary({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const urlError = getConvexUrlError(convexUrl);
  const convex = useMemo(
    () => (urlError || !convexUrl ? null : new ConvexReactClient(convexUrl)),
    [convexUrl, urlError],
  );

  if (urlError || !convex) {
    return <ConvexConfigError message={urlError ?? "Convex client unavailable."} />;
  }

  return (
    <ConvexProvider client={convex}>
      <ConvexRuntimeErrorBoundary>{children}</ConvexRuntimeErrorBoundary>
    </ConvexProvider>
  );
}
