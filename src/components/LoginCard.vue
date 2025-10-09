<template>
  <div class="container container-tight py-6 mt-6">
    <div class="text-center mb-4 mt-6">
      <router-link :to="{ name: 'dashboard' }" class="navbar-brand navbar-brand-autodark">
        <div class="d-flex align-items-center justify-content-center">
          <img src="/images/logo.png" width="200" alt="WISEFOOD" class="me-3" />
        </div>
      </router-link>
    </div>

    <div class="card card-md">
      <div class="card-body">
        <h2 class="h2 text-center mb-4">{{ $t('header.loginPrompt') }}</h2>

        <button
          type="button"
          class="btn btn-primary w-100 mb-4"
          @click="handleLogin"
        >
          {{ $t('header.login') }}
        </button>

        <div class="text-center text-purple">
          <a class="cursor-pointer">{{ $t('header.guestLogin') }}</a>
        </div>
      </div>
    </div>

    <div class="text-center text-secondary mt-3">
      {{ $t('header.noAccount') }}
      <a class="text-blue cursor-pointer" @click="handleRegister">
        Register
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import KeycloakAuthService from "@/services/keycloak";

const authStore = useAuthStore();

const handleLogin = () => {
  authStore.login();
};

const handleRegister = () => {
  // This will redirect to Keycloak registration page with proper PKCE
  KeycloakAuthService.register();
};
</script>
