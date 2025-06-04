import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";

// Action pour reset password sans être connecté
async function resetPasswordAction(formData: FormData) {
  "use server";
  
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const code = formData.get("code") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      `/reset-password?code=${code}`,
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error", 
      `/reset-password?code=${code}`,
      "Passwords do not match",
    );
  }

  const supabase = await createClient();
  
  // Échange le code pour une session temporaire
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
  
  if (sessionError) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Invalid or expired reset link. Please request a new one.",
    );
  }

  // Met à jour le mot de passe
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      `/reset-password?code=${code}`,
      "Failed to update password. Please try again.",
    );
  }

  // Déconnecte l'utilisateur après le reset
  await supabase.auth.signOut();

  // Redirige vers sign-in avec message de succès
  return encodedRedirect(
    "success", 
    "/sign-in", 
    "Password updated successfully. Please sign in with your new password."
  );
}

export default async function ResetPassword(props: {
  searchParams: Promise<{ code?: string; error?: string; message?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { code, error, message } = searchParams;

  // Si pas de code, redirige vers forgot password
  if (!code) {
    redirect("/forgot-password");
  }

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Set new password</CardTitle>
              <CardDescription>
                Enter your new password to complete the reset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="grid gap-6">
                  <input type="hidden" name="code" value={code} />
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                      />
                    </div>
                    <SubmitButton 
                      formAction={resetPasswordAction}
                      pendingText="Updating password..."
                      className="w-full"
                    >
                      Update password
                    </SubmitButton>
                    {(error || message) && (
                      <FormMessage 
                        message={error ? { error } : { message: message! }} 
                      />
                    )}
                  </div>
                  <div className="text-center text-sm">
                    Remember your password?{" "}
                    <Link href="/sign-in" className="underline underline-offset-4">
                      Sign in
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          <div className="text-balance text-center text-xs text-muted-foreground">
            Your password will be updated and you'll need to sign in again.
          </div>
        </div>
      </div>
    </div>
  );
}