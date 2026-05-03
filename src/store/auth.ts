import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabase";
import { api } from "@/shared/api/client";
import type { ProfileDTO } from "@/types/api";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: ProfileDTO | null;
  isLoading: boolean;
  ready: boolean;
  error: string | null;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  ready: false,
  error: null,

  signIn: async (email, password, captchaToken) => {
    set({ error: null });
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (authError) throw new Error(authError.message);

    // Verify sudo role
    const profile = await api.get<ProfileDTO>("/api/account/profile");
    if (profile.role !== "sudo") {
      await supabase.auth.signOut();
      throw new Error("Acceso denegado. Se requiere rol de superadministrador.");
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },

  initialize: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const profile = await api.get<ProfileDTO>("/api/account/profile");
          if (profile.role === "sudo") {
            set({ user: session.user, session, profile, isLoading: false, ready: true, error: null });
          } else {
            await supabase.auth.signOut();
            set({ user: null, session: null, profile: null, isLoading: false, ready: true });
          }
        } catch {
          set({ user: null, session: null, profile: null, isLoading: false, ready: true });
        }
      } else {
        set({ user: null, session: null, profile: null, isLoading: false, ready: true });
      }
    });
    return () => subscription.unsubscribe();
  },
}));
