<template>
  <body>
  <div class="page">
    <Sidebar 
      :fullname="fullname"
      :roles="roles"
    />
    <div class="page-wrapper">
      <div class="layout-fluid">
        <Navbar 
          :fullname="fullname" 
          :roles="roles"
        />
      </div>
      <div class="page-header d-print-none">
        <div class="container-xl">
          <div class="row g-2 align-items-center">
            <div class="col-lg">
              <div class="page-pretitle">
                OVERVIEW
              </div>
              <h3 class="page-title">
                <ol class="breadcrumb breadcrumb-arrows">
                  <li class="breadcrumb-item">
                    <p class="text-secondary">
                       My Daily Outline
                    </p>
                  </li>
                </ol>
              </h3>
            </div>
          </div>
        </div>
      </div>
      <div class="page-body">
        <div class="container-xl">
          <router-view />
        </div>
      </div>
      <AppFooter />
    </div>
  </div>
  </body>
</template>

<script lang="ts" setup>
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

const fullname = authStore.user?.given_name + ' ' + authStore.user?.family_name || 'Guest User';
const roles = authStore.user?.roles || [];

</script>