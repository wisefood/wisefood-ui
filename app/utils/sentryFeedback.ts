const sentryFeedbackThemeLight = {
  foreground: '#2b0a11',
  background: '#ffffff',
  accentForeground: '#ffffff',
  accentBackground: '#d53355',
  successColor: '#859122',
  errorColor: '#d53355',
  border: '1px solid rgba(213, 51, 85, 0.18)',
  boxShadow: '0 24px 64px rgba(43, 10, 17, 0.18)',
  outline: '2px solid rgba(213, 51, 85, 0.42)',
  interactiveFilter: 'brightness(96%)'
}

const sentryFeedbackThemeDark = {
  foreground: '#f9fafb',
  background: '#170720',
  accentForeground: '#ffffff',
  accentBackground: '#dd5c77',
  successColor: '#cad380',
  errorColor: '#ff8aa0',
  border: '1px solid rgba(221, 92, 119, 0.3)',
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.46)',
  outline: '2px solid rgba(221, 92, 119, 0.5)',
  interactiveFilter: 'brightness(112%)'
}

export const sentryFeedbackOptions = {
  autoInject: false,
  colorScheme: 'system' as const,
  showBranding: false,
  formTitle: 'Report a Bug',
  submitButtonLabel: 'Send Report',
  cancelButtonLabel: 'Cancel',
  // People who hit an error rarely know what it was, and asking how to
  // reproduce it left them with nothing to write. The error itself, the page
  // and the failed request are attached to the report; we only need their side.
  messageLabel: 'What were you doing?',
  messagePlaceholder: 'For example: I opened FoodChat and asked for a plan for my family. One line is enough; the technical details are attached.',
  successMessageText: 'Thanks, your report was sent.',
  themeLight: sentryFeedbackThemeLight,
  themeDark: sentryFeedbackThemeDark
}
