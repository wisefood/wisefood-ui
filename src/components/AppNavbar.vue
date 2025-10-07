<template>
  <v-app-bar :elevation="0" height="60" color="transparent" app>
    <template v-slot:prepend>
      <v-app-bar-nav-icon @click.stop="toggleDrawer" v-if="$vuetify.display.mdAndUp && loggedIn"></v-app-bar-nav-icon>
    </template>

    <v-tooltip
      location="bottom"
      :text="t('header.account')"
      v-if="$vuetify.display.mdAndUp && loggedIn"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          icon="mdi-account"
          variant="text"
          @click="navigateTo(`/user/${userId}/profile`)"
          v-bind="props"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip
      location="bottom"
      :text="t('header.notifications')"
      v-if="$vuetify.display.mdAndUp && loggedIn"
    >
      <template v-slot:activator="{ props }">
        <v-badge
          :content="unreadNotificationsCount"
          :model-value="unreadNotificationsCount > 0"
          :dot="false"
          offset-y="10"
          offset-x="10"
          color="error"
          @click="showNotifications"
          class="cursor-pointer"
        >
          <v-btn
            icon="mdi-bell"
            @click="showNotifications"
            variant="text"
            v-bind="props"
          ></v-btn>
        </v-badge>
      </template>
    </v-tooltip>

    <v-menu v-if="$vuetify.display.mdAndUp">
      <template v-slot:activator="{ props }">
        <v-tooltip location="top" :text="t('header.language')">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
              icon="mdi-translate"
              variant="text"
              v-bind="{ ...props, ...tooltipProps }"
            ></v-btn>
          </template>
        </v-tooltip>
      </template>
      <v-list min-width="200">
        <v-list-item
          prepend-icon="fi fi-gr"
          :title="t('languages.greek')"
          @click="changeLanguage('el')"
        ></v-list-item>
        <v-list-item
          prepend-icon="fi fi-gb"
          :title="t('languages.english')"
          @click="changeLanguage('en')"
        ></v-list-item>
      </v-list>
    </v-menu>

    <v-tooltip
      location="bottom"
      :text="t('header.logout')"
      v-if="$vuetify.display.mdAndUp && loggedIn"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          icon="mdi-logout"
          variant="text"
          @click="navigateTo(`/logout`)"
          v-bind="props"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-menu v-if="$vuetify.display.smAndDown">
      <template v-slot:activator="{ props }">
        <v-tooltip location="top" :text="t('header.moreOptions')">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
              icon="mdi-dots-vertical"
              variant="text"
              v-bind="{ ...props, ...tooltipProps }"
            ></v-btn>
          </template>
        </v-tooltip>
      </template>
      <v-list min-width="200">
        <v-list-item
          v-if="loggedIn"
          prepend-icon="mdi-account"
          @click="navigateTo(`/user/${userId}/profile`)"
          :title="t('header.account')"
        ></v-list-item>
        <v-list-item
          v-if="loggedIn"
          prepend-icon="mdi-bell"
          :title="t('header.notifications')"
          @click="showNotifications"
        >
          <template #append>
            <v-badge
              :content="unreadNotificationsCount"
              :model-value="unreadNotificationsCount > 0"
              :dot="false"
              color="error"
              inline
            >
              <span></span>
            </v-badge>
          </template>
        </v-list-item>
        <v-list-item prepend-icon="mdi-translate">
          <v-menu>
            <template v-slot:activator="{ props }">
              <span v-bind="props" class="cursor-pointer">
                {{ t("header.language") }}
              </span>
            </template>
            <v-list min-width="200">
              <v-list-item
                prepend-icon="fi fi-gr"
                :title="t('languages.greek')"
                @click="changeLanguage('el')"
              ></v-list-item>
              <v-list-item
                prepend-icon="fi fi-gb"
                :title="t('languages.english')"
                @click="changeLanguage('en')"
              ></v-list-item>
            </v-list>
          </v-menu>
        </v-list-item>
        <v-list-item
          v-if="!loggedIn"
          prepend-icon="mdi-login"
          :title="t('header.login')"
          @click="navigateTo(`/login`)"
        ></v-list-item>
        <v-list-item
          v-if="loggedIn"
          prepend-icon="mdi-logout"
          :title="t('header.logout')"
          @click="navigateTo(`/logout`)"
        ></v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" width="400"  temporary v-if="loggedIn">
    <v-list density="compact" nav :selected="[]"  v-if="$vuetify.display.mdAndUp && loggedIn">
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        @click="navigateTo('/')"
        :title="t('navigation.home')"
        value="home"
      ></v-list-item>
      <v-list-item
        v-if="loggedIn && !isSystemAdmin"
        prepend-icon="mdi-note"
        @click="navigateTo('/my-applications')"
        :title="t('header.myApplications')"
        value="my-applications"
      ></v-list-item>
      <v-list-item
        v-if="loggedIn && isSystemAdmin"
        prepend-icon="mdi-note"
        @click="navigateTo('/applications')"
        :title="t('header.applications')"
        value="my-applications"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useGlobalRouter } from "@/composables/useGlobalRouter";
import { useOffCanvas } from "@/composables/useOffCanvas";
import NotificationWrapper from "@/components/off-canvas/NotificationWrapper.vue";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationService } from "@/services/notification.service";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";

const { t, locale, changeLanguage, initializeLocale } = useI18nWithStorage();
const { getUnreadCount } = useNotificationService();
const { open } = useOffCanvas();
const loggedIn = ref(useAuthStore().isAuthenticated);
const userRoles = ref(useAuthStore().user?.roles);
const isSystemAdmin = ref(userRoles?.value?.includes("SYSTEM_ADMIN"));
const userId = ref(useAuthStore().user?.id);
const unreadNotificationsCount = ref(0);

const { navigateTo, goBack } = useGlobalRouter();
const drawer = ref(null);

const toggleDrawer = () => {
  drawer.value = !drawer.value;
};

const notificationTitle = computed(() => t("header.notifications"));

const showNotifications = () => {
  open("notificationsPanel", {
    title: notificationTitle.value,
    component: NotificationWrapper,
    location: "right",
    width: 400,
  });
};

onMounted(() => {
  initializeLocale();
  if (loggedIn.value) {
    getUnreadCount().then((data) => {
      unreadNotificationsCount.value = data;
    });
  }
});
</script>
