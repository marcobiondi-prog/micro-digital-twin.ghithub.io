/// <reference types="vite/client" />

// Browser-visible build variables. Read them with dot access (import.meta.env.NAME):
// Vite then inlines only that value instead of the whole env object.
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_BROWSER_KEY?: string;
}
