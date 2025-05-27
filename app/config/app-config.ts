// Application configuration

// API endpoints
export const API_ENDPOINTS = {
  DOCUMENTS: {
    BASE: "/api/documents",
    UPLOAD: "/api/documents/upload",
    GET: "/api/documents/:id",
    DELETE: "/api/documents/:id",
  },
  CHAT: {
    SEND_MESSAGE: "/api/chat/message",
    GET_CONVERSATIONS: "/api/chat/conversations",
    GET_MESSAGES: "/api/chat/messages/:conversationId",
  },
  WAITLIST: {
    JOIN: "/api/waitlist",
  },
};

// File upload constraints
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_FILE_TYPES: ["application/pdf"],
  MAX_FILES: 1,
};

// UI configuration
export const UI_CONFIG = {
  TOAST_DURATION: 5000, // 5 seconds
  CHAT_MAX_LENGTH: 4000, // Maximum characters in chat input
  ANIMATION_DURATION: 200, // ms
};

// Feature flags
export const FEATURES = {
  ENABLE_DOCUMENT_SHARING: false,
  ENABLE_DOCUMENT_PREVIEW: false,
  ENABLE_EXPORT_CHAT: false,
};

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  const env = (typeof window !== 'undefined' ? 'production' : process.env.NODE_ENV) || "development";
  
  const configs = {
    development: {
      API_BASE_URL: "",
      DEBUG: true,
    },
    production: {
      API_BASE_URL: "",
      DEBUG: false,
    },
    test: {
      API_BASE_URL: "",
      DEBUG: true,
    },
  };
  
  return configs[env as keyof typeof configs] || configs.development;
};

export const ENV_CONFIG = getEnvironmentConfig();
