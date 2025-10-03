/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_REDIRECT_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_ADMIN_ID?: string
  readonly VITE_ADMIN_PASSWORD?: string
  readonly VITE_ADMIN_ID_2?: string
  readonly VITE_ADMIN_PASSWORD_2?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
