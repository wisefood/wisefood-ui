<template>
    <div class="container container-tight">
      <div class="text-center mb-4">
            <router-link :to="{ name: 'dashboard' }" class="navbar-brand navbar-brand-autodark">
                <div class="d-flex align-items-center justify-content-center">
                    <img src="/images/logo.png" width="200" alt="WISEFOOD" class="me-3">
                </div>
            </router-link>
        </div>

      
      <form class="card card-md" method="POST" autocomplete="off">
        <div class="card-body">
          <h2 class="h2 text-center mb-4">{{$t('signup.header')}}</h2>
          <div class="mb-2">
            <label class="form-label">{{$t('signup.firstname')}}</label>
            <input type="text" class="form-control" placeholder="John Smith" name="name" id="name" required="">
          </div>
          <div class="mb-2">
            <label class="form-label">{{$t('signup.email')}}</label>
            <input type="email" class="form-control" placeholder="email@example.com" name="email" required="" autocomplete="off" id="email">
          </div>
          <div>
            <label class="form-label">{{$t('signup.password')}}</label>
            <div class="input-group input-group-flat">
              <input type="password" class="form-control" :placeholder="$t('signup.password') || 'Password'" required="" name="passwordIn" autocomplete="off" id="passwordIn">
            </div>
            <div class="text-secondary text-end justify-content-right mt-1">
              <a href="#" @click.prevent="Toggle1" class="link-secondary" title="Show password" data-bs-toggle="tooltip" tabindex="-1">
                {{$t('signup.showPassword')}}
              </a>
            </div>
          </div>
          <div class="mb-2">
            <label class="form-label">{{$t('signup.repeatPassword')}}</label>
            <div class="input-group input-group-flat">
              <input type="password" class="form-control" :placeholder="$t('signup.repeatPassword') || 'Repeat Password'" autocomplete="off" name="passwordRepeatIn" id="passwordRepeatIn" required="">
            </div>
            <div class="text-secondary text-end justify-content-right mt-1">
              <a href="#" @click.prevent="Toggle2" class="link-secondary" title="Show password" data-bs-toggle="tooltip" tabindex="-1">
                {{$t('signup.showPassword')}}
              </a>
            </div>
          </div>
          <div class="text-center text-grey mt-2">
            {{$t('signup.passwordPrompt')}}
          </div>
          <div class="text-center text-pink mt-3">
            Already have account? <router-link :to="{ name: 'login' }" class="text-blue">Sign in</router-link>
          </div>
        </div>
      </form>
      
    </div>
</template>


<script>

export default {
    methods: {
        Toggle1() {
            const passwordField = document.getElementById("passwordIn");
            if (passwordField.type === "password") {
                passwordField.type = "text";
            } else {
                passwordField.type = "password";
            }
        },
        Toggle2() {
            const passwordRepeatField = document.getElementById("passwordRepeatIn");
            if (passwordRepeatField.type === "password") {
                passwordRepeatField.type = "text";
            } else {
                passwordRepeatField.type = "password";
            }
        }
    }
};


</script>