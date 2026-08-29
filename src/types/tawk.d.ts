export {};

declare global {
  interface Window {
    Tawk_API?: {
      visitor?: { name?: string; email?: string };
      onLoad?: () => void;
      onChatMaximized?: () => void;
      setAttributes?: (
        attributes: { name?: string; email?: string },
        callback?: (error: Error | null) => void
      ) => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      maximize?: () => void;
      minimize?: () => void;
      toggle?: () => void;
      isChatMaximized?: () => boolean;
      addEvent?: (eventName: string, metadata?: Record<string, string>) => void;
    };
    Tawk_LoadStart?: Date;
  }
}
