import { authClient } from "@/lib/auth-client";
import { Navigate, Outlet } from "react-router-dom";

export function AuthLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    // Return empty div — in desktop mode the Nexu splash loader already
    // covers the webview, so no need for a separate spinner.
    return <div className="min-h-screen" />;
  }

  if (!session?.user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
