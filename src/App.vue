<script setup lang="ts">
import HeaderVue from "./components/Header.vue";
import { useEth } from "supa-app/services/eth";
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

  useRouter().afterEach(() => {
    nProgress.done();
  });
});

onConnect(() => {
  console.log("connected");
});
</script>

<template lang="pug">
HeaderVue
RouterView(:key="route.path")
.hidden.animate-pulse.bg-slate-300
</template>
