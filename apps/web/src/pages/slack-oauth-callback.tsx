import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export function SlackOAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");
  const teamName = searchParams.get("teamName");
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success(`Slack workspace "${teamName}" connected!`);

      const timer = setTimeout(() => {
        if (returnTo === "/onboarding") {
          navigate("/onboarding?slackConnected=true", { replace: true });
        } else {
          navigate("/workspace/channels", { replace: true });
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, teamName, queryClient, navigate, returnTo]);

  if (success) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <CardTitle className="mt-4">Slack Connected</CardTitle>
            <CardDescription>
              Workspace &ldquo;{teamName}&rdquo; has been successfully connected
              to your bot.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Redirecting to channels...
            </p>
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle className="mt-4">Connection Failed</CardTitle>
          <CardDescription>
            {error ?? "An unknown error occurred while connecting Slack."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            type="button"
            onClick={() => navigate("/workspace/channels", { replace: true })}
          >
            Back to Channels
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
