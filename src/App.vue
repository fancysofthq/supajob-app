<script setup lang="ts">
import HeaderVue from "./components/Header.vue";
import { useEth } from "@fancysofthq/supa-app/services/eth";
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import nProgress from "nprogress";

const { init, onConnect } = useEth();
const route = useRoute();

nProgress.configure({ showSpinner: false });

onMounted(() => {
  init(JSON.parse(import.meta.env.VITE_CHAIN), "generic", true);

  useRouter().beforeEach(() => {
    nProgress.start();
  });

  useRouter().afterEach((to) => {
    if (!to.meta.doNotTerminateNProgress) {
      nProgress.done();
    }
  });
});

onConnect(() => {
  console.log("connected");
});
</script>

<template lang="pug">
HeaderVue
.flex.w-full.justify-center.p-4(class="sm:p-8")
  RouterView(v-slot="{ Component }")
    Transition(name="fade" mode="out-in")
      Component(:is="Component" :key="route.path")
.hidden.animate-pulse.bg-slate-300
</template>

<style lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
