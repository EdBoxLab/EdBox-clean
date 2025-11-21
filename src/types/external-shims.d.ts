/* Lightweight module shims to satisfy TypeScript for external packages
   that don't ship types in this workspace. These are minimal and only
   intended to unblock local type checking/build. */

declare module '@vitejs/plugin-react' {
  const plugin: any;
  export default plugin;
}

declare module '@vitejs/plugin-react-swc' {
  const plugin: any;
  export default plugin;
}

declare module '@google/genai' {
  export const GoogleGenAI: any;
  export const Type: any;
  export const Modality: any;
  export type GenerateContentResponse = any;
}

declare module '@google/generative-ai' {
  export const GoogleGenerativeAI: any;
  export const HarmCategory: any;
  export const HarmBlockThreshold: any;
}

declare module '@tabler/icons-react' {
  const icons: any;
  export default icons;
}

declare module '@octokit/rest' {
  const Octokit: any;
  export default Octokit;
}

declare module 'socket.io-client' {
  export const io: any;
  export type Socket = any;
}

/* Generic fallback for any other unknown modules to prevent build-breaking errors. */
declare module '*';