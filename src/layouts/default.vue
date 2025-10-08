<template>
  <body>
  <div class="page">
    
    <div class="layout-fluid">
      <Navbar 
        :fullname="fullname" 
        :roles="roles"
      />
    </div>
    <transition name="slide" appear>
      <Sidebar 
        :fullname="fullname"
        :roles="roles"
      />
    </transition>
    <div class="page-wrapper">
       
      <div class="page-header d-print-none">
        <div class="container-xl">
          <div class="row g-2 align-items-center">
            <div class="col-lg">
              <div class="page-pretitle">
                
              </div>
              <h3 class="page-title">
                <ol class="breadcrumb breadcrumb-arrows">
                  <li class="breadcrumb-item">
                    <p class="text-secondary">
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
      <transition name="fade" appear>
        <AppFooter />
      </transition>
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

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 1.0s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Slide transition for Sidebar */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.8s ease, opacity 0.8s ease;
}

/* Starting and ending states for enter/leave */
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>