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
  appUrl: 'http://localhost:3000',

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
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJxbFVVZy1MVHB0TmtBNXRZRURkdkltWFdaX1ZfTHFzc1hhTVBEcnB2NjYwIn0.eyJleHAiOjE3NzIyNTIxNjcsImlhdCI6MTc3MjIyMzM2NywiYXV0aF90aW1lIjoxNzcyMjIzMzY3LCJqdGkiOiIxMjhiNTVkMi1kMjNjLTRkNzMtODE0ZC0wN2U4NjRlYWMxYWIiLCJpc3MiOiJodHRwczovL3NjYWRhLXJvY2t5OjgwODIvYXV0aC9yZWFsbXMvbWFzdGVyIiwiYXVkIjpbIm1hc3Rlci1yZWFsbSIsImFjY291bnQiXSwic3ViIjoiN2M5M2ViNDItZmJjYi00NzM0LWFmYmItMGZjOTNmNzZhNWFjIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidWkiLCJzaWQiOiI4ZGRlMDllMC1kZjQyLTRlYmYtYmZkNy03ZDE4NzE1YTMzNDYiLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZS1yZWFsbSIsImRlZmF1bHQtcm9sZXMtbWFzdGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJhZG1pbiIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsibWFzdGVyLXJlYWxtIjp7InJvbGVzIjpbInZpZXctcmVhbG0iLCJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsIm1hbmFnZS1pZGVudGl0eS1wcm92aWRlcnMiLCJpbXBlcnNvbmF0aW9uIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJyb290In0.K-6YPmmJrllqTmTwLEcxiDJBzkEa_1HISdLCf-VKHWzTOejmmjRBHC_FIaLTtP18NisszID0N4isBWnkSgda3_cIrcBaijr2lXyDJX33BFehFMtfor56rexgaWqzwnLZAcycStzSt5kHVXPAVKnkoJev7okIaAnhpOfVPRwMO84M1S45tWYnYcjtu6XWVefxktMTfqELrGrKNwbdc1I2Ypr2QM7ujAWccY1LvClBdM5af_by5shpOfjnVYDfesRu4zq_8Vr-Il4zw5KXJBr35OD7O91IXNKfcc2-X2EPa93Xq1vIp2NpWNqn6oCQ6K60fP5fagoOYx9X718Unb53BA',

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
