/**
 * Supabase-native OAuth wrapper.
 *
 * Provides a consistent interface for social sign-in using Supabase Auth.
 * Currently supports Google (and can be extended to Apple/Microsoft if those
 * providers are enabled in your Supabase project).
 *
 * Usage:
 *   import { lovable } from "@/integrations/lovable";
 *   await lovable.auth.signInWithOAuth("google", { redirect_uri: "..." });
 */
import { supabase } from "../supabase/client";

type Provider = "google" | "apple" | "microsoft";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: Provider, opts?: SignInOptions) => {
      const redirectTo = opts?.redirect_uri ?? `${window.location.origin}/auth`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo,
          queryParams: opts?.extraParams,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        return { error, redirected: false };
      }

      // Supabase handles the browser redirect internally when skipBrowserRedirect is false.
      // Return a compatible shape so callers don't need to change.
      return { error: null, redirected: !!data.url };
    },
  },
};
