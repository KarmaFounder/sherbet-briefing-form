declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONDAY_API_KEY?: string;
    }
  }
  const process: {
    env: {
      MONDAY_API_KEY?: string;
    };
  };
}

export {};
