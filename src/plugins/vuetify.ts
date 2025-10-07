/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";
import { VFileUpload } from "vuetify/labs/VFileUpload";

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    VFileUpload,
  },
  theme: {
    defaultTheme: "wiseFoodTheme",
    themes: {
      wiseFoodTheme: {
        dark: false,
        colors: {
          primary: "#7B1FA2", // Deep Purple
          secondary: "#E91E63", // Pink
          accent: "#BA68C8", // Light Purple
          error: "#F06292", // Pink-toned Red
          info: "#AB47BC", // Medium Purple
          success: "#66BB6A", // Green (slightly adjusted)
          warning: "#FFB74D", // Orange (warmer tone)
          background: "#f2f0eb", // Light Beige (kept as requested)
          surface: "#f5f5f5", // Lighter gray (lighter than background)
          onPrimary: "#FFFFFF", // White text on primary
          onSecondary: "#FFFFFF", // White text on secondary
          onAccent: "#FFFFFF", // White text on accent
          onError: "#FFFFFF", // White text on error
          onInfo: "#FFFFFF", // White text on info
          onSuccess: "#FFFFFF", // White text on success
          onWarning: "#000000", // Black text on warning
          onBackground: "#000000", // Black text on background
          onSurface: "#000000", // Black text on surface
        },
      },
    },
  },
});
