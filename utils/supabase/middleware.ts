import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const user = await supabase.auth.getUser();

    // dashboard routes - require authentication
    if (request.nextUrl.pathname.startsWith("/dashboard") && user.error) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // ONBOARDING OBLIGATOIRE : Vérifier si l'utilisateur a complété l'onboarding
    if (!user.error && user.data.user) {
      const userId = user.data.user.id;
      
      // Récupérer le profil utilisateur pour vérifier l'onboarding
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_onboarding_completed, full_name, company_name')
          .eq('user_id', userId)
          .single();

        // Si l'utilisateur tente d'accéder au dashboard sans avoir complété l'onboarding
        if (request.nextUrl.pathname.startsWith("/dashboard")) {
          if (profileError || !userProfile || !userProfile.is_onboarding_completed) {
            // Rediriger vers le dashboard avec un flag pour forcer l'onboarding
            console.log('Onboarding required for user:', userId);
            // Le dashboard détectera automatiquement et affichera la modal d'onboarding
            // Pas de redirection pour éviter les boucles, mais le flag sera géré côté client
          }
        }
        
        // Permettre l'accès aux pages auth même si onboarding pas complété
        if (request.nextUrl.pathname.startsWith("/sign-") || 
            request.nextUrl.pathname.startsWith("/forgot-password") ||
            request.nextUrl.pathname.startsWith("/reset-password")) {
          // Accès autorisé aux pages d'authentification
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // En cas d'erreur, laisser passer (fallback gracieux)
      }
    }

    if (request.nextUrl.pathname === "/" && !user.error) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
