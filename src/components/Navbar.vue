<template>
<header class="navbar navbar-expand-md d-none d-lg-flex d-print-none">
  <div class="container-xl">
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu" aria-controls="navbar-menu" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
    </button>
    <div class="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
         <router-link to="/dashboard" class="p-0">
          <img src="/images/logo.png" alt="WiseFood" width="135px">
        </router-link>
    </div>
    <div class="vr mt-1 mx-2" style="height: 40px;"></div>
    <div class="collapse navbar-collapse" id="navbar-menu">
      <ul class="navbar-nav">
        <li :class="['nav-item', { active: $route.path === '/dashboard' }]">
          <router-link to="/dashboard" class="nav-link" aria-current="page">
            <span class="nav-link-icon d-md-none d-lg-inline-block a">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1">
                <path d="M5 12l-2 0l9 -9l9 9l-2 0"></path>
                <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"></path>
                <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"></path></svg></span>
            <span class="nav-link-title"> Home </span>
          </router-link>
        </li>
        <li :class="['nav-item', { active: $route.path === '/food-scholar' }]">
          <router-link to="/food-scholar" class="nav-link" aria-current="page">
            <span class="nav-link-icon d-md-none d-lg-inline-block a">
              <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-message-2-search"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 9h8" /><path d="M8 13h5" /><path d="M12 21l-.5 -.5l-2.5 -2.5h-3a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v4.5" /><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M20.2 20.2l1.8 1.8" /></svg>
             </span>
            <span class="nav-link-title"> Food Scholar </span>
          </router-link>
        </li>
        <li :class="['nav-item', { active: $route.path === '/recipe-wrangler' }]">
          <router-link to="/recipe-wrangler" class="nav-link" aria-current="page">
            <span class="nav-link-icon d-md-none d-lg-inline-block a">
              <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-ladle"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 14v1a6 6 0 1 0 12 0v-9a3 3 0 0 1 6 0" /><path d="M9 16c-.663 0 -1.3 -.036 -1.896 -.102l-.5 -.064c-2.123 -.308 -3.604 -1.013 -3.604 -1.834c0 -.82 1.482 -1.526 3.603 -1.834l.5 -.064a17.27 17.27 0 0 1 1.897 -.102c.663 0 1.3 .036 1.896 .102l.5 .064c2.123 .308 3.604 1.013 3.604 1.834c0 .82 -1.482 1.526 -3.603 1.834l-.5 .064a17.27 17.27 0 0 1 -1.897 .102z" /></svg>             </span>
            <span class="nav-link-title"> Recipe Wrangler </span>
          </router-link>
        </li>
        <li :class="['nav-item', { active: $route.path === '/food-chat' }]">
          <router-link to="/food-chat" class="nav-link" aria-current="page">
            <span class="nav-link-icon d-md-none d-lg-inline-block a">
              <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-bubble-text"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 10h10" /><path d="M9 14h5" /><path d="M12.4 3a5.34 5.34 0 0 1 4.906 3.239a5.333 5.333 0 0 1 -1.195 10.6a4.26 4.26 0 0 1 -5.28 1.863l-3.831 2.298v-3.134a2.668 2.668 0 0 1 -1.795 -3.773a4.8 4.8 0 0 1 2.908 -8.933a5.33 5.33 0 0 1 4.287 -2.16" /></svg> </span>
            <span class="nav-link-title"> Food Chat </span>
          </router-link>
        </li>
      </ul>
    </div>
    <div class="navbar-nav flex-row ms-auto order-md-last">
      <div class="d-none d-md-flex">
        <div class="nav-item dropdown d-none d-md-flex me-3">
          <a href="#" class="nav-link px-0" data-bs-toggle="dropdown" tabindex="-1" aria-label="Show notifications">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>
            <span class="badge bg-red"></span>
          </a>
          <div class="dropdown-menu dropdown-menu-arrow dropdown-menu-end dropdown-menu-card">
            <div class="card">
            <div class="card-header">
              <h3 class="card-title">Last updates</h3>
            </div>
            <div class="list-group list-group-flush list-group-hoverable">
              <div class="list-group-item">
              <div class="row align-items-center">
                <div class="col-auto"><span class="status-dot status-dot-animated bg-red d-block"></span></div>
                <div class="col text-truncate">
                <a href="#" class="text-body d-block">Example 1</a>
                <div class="d-block text-secondary text-truncate mt-n1">
                  Change deprecated html tags to text decoration classes (#29604)
                </div>
                </div>
                <div class="col-auto">
                <a href="#" class="list-group-item-actions">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon text-muted" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>
                </a>
                </div>
              </div>
              </div>
              <div class="list-group-item">
              <div class="row align-items-center">
                <div class="col-auto"><span class="status-dot d-block"></span></div>
                <div class="col text-truncate">
                <a href="#" class="text-body d-block">Example 2</a>
                <div class="d-block text-secondary text-truncate mt-n1">
                  justify-content:between ⇒ justify-content:space-between (#29734)
                </div>
                </div>
                <div class="col-auto">
                <a href="#" class="list-group-item-actions show">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon text-yellow" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>
                </a>
                </div>
              </div>
              </div>
              <div class="list-group-item">
              <div class="row align-items-center">
                <div class="col-auto"><span class="status-dot d-block"></span></div>
                <div class="col text-truncate">
                <a href="#" class="text-body d-block">Example 3</a>
                <div class="d-block text-secondary text-truncate mt-n1">
                  Update change-version.js (#29736)
                </div>
                </div>
                <div class="col-auto">
                <a href="#" class="list-group-item-actions">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon text-muted" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>
                </a>
                </div>
              </div>
              </div>
              <div class="list-group-item">
              <div class="row align-items-center">
                <div class="col-auto"><span class="status-dot status-dot-animated bg-green d-block"></span></div>
                <div class="col text-truncate">
                <a href="#" class="text-body d-block">Example 4</a>
                <div class="d-block text-secondary text-truncate mt-n1">
                  Regenerate package-lock.json (#29730)
                </div>
                </div>
                <div class="col-auto">
                <a href="#" class="list-group-item-actions">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon text-muted" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>
                </a>
                </div>
              </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
      <div class="nav-item dropdown">
        <a href="#" class="nav-link d-flex lh-1 text-reset p-0" data-bs-toggle="dropdown" aria-label="Open user menu">
        <span class="avatar avatar-sm bg-blue-lt text-uppercase">
          {{fullname.split(' ').map((name: string) => name[0]).join('')}}
        </span>
        <div class="d-none d-xl-block ps-2">
          <div>{{ fullname }}</div>
          <div class="mt-1 small text-secondary">{{ computedRoles }}</div>
        </div>
        </a>
        <div class="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
        <a href="/my/settings" class="dropdown-item">Settings</a>
        <router-link :to="{ name: 'logout' }" class="dropdown-item">Logout</router-link>
        </div>
      </div>
    </div>
  </div>
</header>
</template>

<script setup>
// Define props with defaults
const props = defineProps({
  fullname: {
    type: String,
    default: "Guest User",
  },
  roles: {
    type: Array,
    default: () => [],
  },
});

const computedRoles = computed(() =>
  props.roles
    .filter(role => !["offline_access", "uma_authorization", "create-realm", "default-roles-master"].includes(role))
    .map(role => role.charAt(0).toUpperCase() + role.slice(1))
    .join(', ')
);
</script>
