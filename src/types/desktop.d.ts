export {};
declare global {
  interface Window {
    desktop?: {
      database: {
        call: (operation: string, data: unknown) => Promise<unknown>;
        backup: () => Promise<{ canceled: boolean; filePath?: string }>;
        restore: (confirmed: boolean) => Promise<{ canceled: boolean }>;
        openDataFolder: () => Promise<string>;
      };
      license: {
        status: () => Promise<{
          status: "active" | "unactivated" | "expired" | "invalid";
          license?: {
            licenseId: string;
            type: string;
            expiresAt: string | null;
          };
        }>;
        activate: (serialKey: string) => Promise<{
          status: "active";
          license: {
            licenseId: string;
            type: string;
            expiresAt: string | null;
          };
        }>;
      };
    };
  }
}
