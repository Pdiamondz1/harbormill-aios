// Placeholder Supabase types.
//
// Regenerate against YOUR project once migrations are applied:
//   supabase gen types typescript --project-id <ref> > src/integrations/supabase/types.ts
//
// Until then the client is loosely typed (see client.ts) so call sites compile.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
