/**
 * Minimal hand-written schema for the Supabase tables this site touches.
 *
 * The @nuxtjs/supabase module is configured with `types: false` (no generated
 * types), so without this the client resolves table rows to `never` and every
 * `.insert()` fails to typecheck.
 *
 * Mirrors supabase/migrations/001_waitlist_signups.sql — keep the two in sync.
 * To regenerate from the live database instead:
 *   pnpm dlx supabase gen types typescript --project-id <ref> > app/types/database.ts
 */
export interface Database {
  public: {
    Tables: {
      waitlist_signups: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
