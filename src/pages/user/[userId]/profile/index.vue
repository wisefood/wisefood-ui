<template>
  <v-container max-width="1200" class="pa-4">
    <v-card class="mx-auto pa-4" flat>
      <div class="d-flex justify-space-between">
        <v-card-title class="text-h5">
          <v-icon>mdi-account</v-icon>
          {{ userProfile?.firstName }} {{ userProfile?.lastName }}
        </v-card-title>

        <v-menu v-if="authStore.user?.id === userId">
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
              @click="showEditInfoPage"
              link
              prepend-icon="mdi-file-edit"
              :title="t('profile.editInfo')"
            ></v-list-item>
            <v-list-item
              @click="showEditProfilePage"
              link
              prepend-icon="mdi-file-edit"
              :title="t('profile.editFoodProfile')"
            ></v-list-item>
          </v-list>
        </v-menu>
      </div>
      <v-card-subtitle class="text-subtitle-1 mb-2">
        <v-icon>mdi-email</v-icon>
        {{ userProfile?.email }}
      </v-card-subtitle>
      <v-card-subtitle class="mb-2">
        <div class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="role in validRoles"
            :key="role"
            variant="tonal"
            :color="getRoleColor(role)"
          >
            {{ formatRole(role) }}
          </v-chip>
        </div>
      </v-card-subtitle>
    </v-card>

    <v-divider class="my-4"></v-divider>

    <v-card>
      <v-tabs v-model="tab" bg-color="surface" color="primary" show-arrows>
        <v-tab value="one" class="text-none" prepend-icon="mdi-food-apple">
          {{ t("profile.foodPreferences") }}
        </v-tab>
        <v-tab value="two" class="text-none" prepend-icon="mdi-chef-hat">
          {{ t("profile.cookingProfile") }}
        </v-tab>
        <v-tab
          value="three"
          class="text-none"
          prepend-icon="mdi-emoticon-tongue"
        >
          {{ t("profile.flavorProfile") }}
        </v-tab>
        <v-tab value="four" class="text-none" prepend-icon="mdi-star-settings">
          {{ t("profile.advancedOptions") }}
        </v-tab>
      </v-tabs>

      <v-card-text>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="one">
            <FoodPreferences
              v-if="userProfile?.foodProfile?.foodPreferences"
              :foodPreferences="userProfile.foodProfile.foodPreferences"
            />
            <NoDataMessage v-else />
          </v-tabs-window-item>

          <v-tabs-window-item value="two">
            <CookingProfile
              v-if="userProfile?.foodProfile?.cookingProfile"
              :cookingProfile="userProfile.foodProfile.cookingProfile"
            />
            <NoDataMessage v-else />
          </v-tabs-window-item>

          <v-tabs-window-item value="three">
            <FlavorProfile
              v-if="userProfile?.foodProfile?.flavorProfile"
              :flavorProfile="userProfile.foodProfile.flavorProfile"
            />
            <NoDataMessage v-else />
          </v-tabs-window-item>

          <v-tabs-window-item value="four">
            <AdvancedFeatures
              v-if="userProfile?.foodProfile?.advancedOptions"
              :advancedFeatures="userProfile.foodProfile.advancedOptions"
            />
            <NoDataMessage v-else />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useRoute } from "vue-router";
import { onMounted, ref, computed } from "vue";
import { useGlobalRouter } from "@/composables/useGlobalRouter";
import { useNotifications } from "@/composables/useNotifications";
import { useOffCanvas } from "@/composables/useOffCanvas";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import UserProfileEdit from "@/components/off-canvas/FoodProfileEdit.vue";
import { type UserDTO } from "@/types/user.types";
import { useUserManagementService } from "@/services/user-managment.service";
import { foodProfile } from "@/assets/food-profile.data";
import NoDataMessage from "@/components/NoDataMessage.vue";
import FoodPreferences from "@/components/user-profile/FoodPreferences.vue";
import CookingProfile from "@/components/user-profile/CookingProfile.vue";
import AdvancedFeatures from "@/components/user-profile/AdvancedOptions.vue";
import { TastePalette } from "@/types/food-profile.enums";
import UserProfileInfoEdit from "@/components/user-profile/UserProfileInfoEdit.vue";

const { getUserProfile } = useUserManagementService();
const { t } = useI18nWithStorage();
const { open, close } = useOffCanvas();
const { error } = useNotifications();
const { navigateTo } = useGlobalRouter();
const authStore = useAuthStore();
const route = useRoute();
const userProfile = ref<UserDTO | null>(null);

// Predefined roles for validation
const keycloakRoles = ["DIETITIAN", "NUTRITIONIST", "USER", "SYSTEM_ADMIN"];

// Filter user roles to only show ones that exist in KEYCLOAK_ROLES
const validRoles = computed(() => {
  const userRoles = authStore.user?.roles || [];
  return userRoles.filter((role: string) => keycloakRoles.includes(role));
});

// Format role names for display
const formatRole = (role: string) => {
  // Use translation keys for role names
  const roleTranslations: Record<string, string> = {
    DIETITIAN: t("roles.dietitian"),
    NUTRITIONIST: t("roles.nutritionist"),
    USER: t("roles.user"),
    SYSTEM_ADMIN: t("roles.systemAdmin"),
  };

  return roleTranslations[role] || role.replace(/_/g, " ");
};

// Assign colors based on role type
const getRoleColor = (role: string) => {
  const roleColors: Record<string, string> = {
    DIETITIAN: "green",
    NUTRITIONIST: "blue",
    USER: "primary",
    SYSTEM_ADMIN: "red",
  };

  return roleColors[role] || "grey";
};

onMounted(async () => {
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    error(t("auth.authenticationError"), {
      text: t("auth.authenticationErrorMessage"),
    });
    navigateTo("/");
    return;
  }
  userProfile.value = await getUserProfile();
});

const userId = (route.params as { userId: string }).userId;

const showEditInfoPage = () => {
  open("editInfoPanel", {
    title: t("profile.editInfo"),
    component: UserProfileInfoEdit,
    location: "right",
    width: 800,
  });
};

const showEditProfilePage = () => {
  open("editProfilePanel", {
    title: t("profile.editFoodProfile"),
    component: UserProfileEdit,
    componentProps: { userProfile, userId, options: foodProfile },
    location: "right",
    width: 1000,
  });
};
</script>

<script lang="ts">
export default {
  data() {
    return {
      tab: null,
    };
  },
};
</script>
