/// <reference types="vite/client" />

import type { D2ptApi } from "./shared/types";

declare global {
  interface Window {
    d2pt: D2ptApi;
  }
}
