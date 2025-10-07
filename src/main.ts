/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from "@/plugins";

// Components
import App from "./App.vue";
import setupI18n from "./i18n";

// Composables
import { createApp } from "vue";

// Services
import KeycloakService from "@/services/keycloak";

// Styles
import "flag-icons/css/flag-icons.min.css";

import 'vuetify/styles'
import '@tabler/core/dist/css/tabler.min.css'
import "./styles/wisefood.css";

const app = createApp(App);

registerPlugins(app);
setupI18n(app);


const initializeApp = async () => {
  try {
    await KeycloakService.CallInit();  
    app.mount("#app");
  } catch (error) {
    app.mount("#app");
    console.error("Failed to initialize the application:", error);
  }
};

initializeApp();
