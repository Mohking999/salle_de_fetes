export {};
declare global {
  interface Window {
    desktop?: { database: {
      call: (operation: string, data: unknown) => Promise<unknown>;
      backup: () => Promise<{ canceled: boolean; filePath?: string }>;
      restore: (confirmed: boolean) => Promise<{ canceled: boolean }>;
      openDataFolder: () => Promise<string>;
    } };
  }
}
