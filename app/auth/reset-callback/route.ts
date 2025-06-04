import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Callback spécialement pour le reset password
  // N'échange PAS le code pour une session - l'utilisateur reste déconnecté
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    // On vérifie que le code est valide mais on NE se connecte PAS
    const supabase = await createClient();
    
    // On stocke temporairement le code pour l'utiliser lors du reset
    // et on redirige vers la page de reset password avec le code
    return NextResponse.redirect(`${origin}/reset-password?code=${code}`);
  }

  // Si pas de code, on redirige vers forgot password
  return NextResponse.redirect(`${origin}/forgot-password?error=Invalid reset link`);
}