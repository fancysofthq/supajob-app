/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ADDRESS: string;
  readonly VITE_PERSONA_ADDRESS: string;
  readonly VITE_JOB_BOARD_ADDRESS: string;
  readonly VITE_API_URL: string;

  /** JSON-serialized {@link AddEthereumChainParameter}. */
  readonly VITE_CHAIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
