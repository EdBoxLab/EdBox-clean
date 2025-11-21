declare module 'vite' {
  export function defineConfig<T = any>(config: T): T;
  export function loadEnv(mode: string, envDir?: string, prefix?: string): Record<string, string>;
  export type UserConfig = any;
  export const define: any;
  const plugin: any;
  export default plugin;
}

declare module 'vite/config' {
  export { defineConfig, loadEnv } from 'vite';
}
