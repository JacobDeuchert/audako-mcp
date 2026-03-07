/**
 * Test Client Configuration
 *
 * Edit this file to configure your test session.
 * All fields are optional - the app will use sensible defaults.
 */

export const config = {
  /**
   * The copilot/app URL to connect to
   * Example: 'http://localhost:3000' or 'https://copilot.example.com'
   */
  appUrl: 'http://localhost:3001',

  /**
   * SCADA URL for session bootstrap
   * Example: 'https://scada.example.com'
   */
  scadaUrl: 'https://scada-rocky:8082',

  /**
   * Access token for authentication
   * This will be used in the Authorization header as 'Bearer <token>'
   */
  accessToken:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJxbFVVZy1MVHB0TmtBNXRZRURkdkltWFdaX1ZfTHFzc1hhTVBEcnB2NjYwIn0.eyJleHAiOjE3NzI0MDE0OTUsImlhdCI6MTc3MjM3MjY5NSwiYXV0aF90aW1lIjoxNzcyMzcyNjk1LCJqdGkiOiIzYjk0ODBhNS03NTFjLTQwOTEtODJlZS1jYzE4N2FjMTg3NDgiLCJpc3MiOiJodHRwczovL3NjYWRhLXJvY2t5OjgwODIvYXV0aC9yZWFsbXMvbWFzdGVyIiwiYXVkIjpbIm1hc3Rlci1yZWFsbSIsImFjY291bnQiXSwic3ViIjoiN2M5M2ViNDItZmJjYi00NzM0LWFmYmItMGZjOTNmNzZhNWFjIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidWkiLCJzaWQiOiJlNzFmNTc5Yy03YTFkLTRhZmUtYjZjMi01ZDllOTcwZjJjMGYiLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZS1yZWFsbSIsImRlZmF1bHQtcm9sZXMtbWFzdGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJhZG1pbiIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsibWFzdGVyLXJlYWxtIjp7InJvbGVzIjpbInZpZXctcmVhbG0iLCJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsIm1hbmFnZS1pZGVudGl0eS1wcm92aWRlcnMiLCJpbXBlcnNvbmF0aW9uIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJyb290In0.TbN-BBnkGtKOLrRJsAkPOhGzzfBwZYAInNh_UCsz7_8r0zPq91WHw7g2-xplaxZtmPuDK3GlYuk4459k31UmsUSG0TNjH1jYt5hGRgJCcv6fcRoF4GtF_mHt8H_HBMO-cAZXxXQBW0UaD_qRddS5nV3WULzikrE8G_e4FbC7aGCkn5A2s13_lrUT6xBzhFKjN8oW10ZCr1mMgOOMdZefChXL-4maoQ7EA4Rot671b7P6Vl7EAUgEMWwadgmzp-XxUe6QgsJxCV9FgqKFLQ05oTUaWZuVwumgQwJbbFjRL5GmtB9ssBK_J-_98HN6kzwB3DYpKtVqWHo5Omp3WAAFEw',

  /**
   * Session context info
   * These values help the AI understand the current context
   */
  sessionInfo: {
    tenantId: '69812a3e528b0200012457ff',
    groupId: '69812a3e528b0200012457f8',
    entityType: null,
    app: 'configuration', // 'designer', 'monitoring', 'analytics', etc.
  },

  /**
   * Chat widget settings
   */
  chat: {
    title: 'Test Assistant',
    initialMessage: 'Hello! How can I help you today?',
    placeholder: 'Type your message...',
    showThinking: true,
  },

  /**
   * UI theme settings
   */
  theme: {
    primary: '#0057B8',
    secondary: '#146C5B',
    darkMode: false,
  },
};
