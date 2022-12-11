<script setup lang="ts">
import { WalletIcon } from "@heroicons/vue/24/outline";
import { useEth } from "supa-app/services/eth";
import Profile from "./modals/Profile.vue";
import Mint from "./modals/Mint.vue";
import { ref } from "vue";
import Spinner from "./shared/Spinner.vue";
import Chip from "supa-app/components/Chip.vue";

const { account, isConnecting, disconnect } = useEth();

const profileOpen = ref(false);
const mintOpen = ref(false);

function connect() {
  useEth().connect();
}
</script>

<template lang="pug">
header.flex.h-16.w-full.items-center.justify-between.border-b.border-slate-200.py-4.px-4(
  class="sm:px-8"
)
  .flex.max-w-max.items-center.gap-2(class="sm:gap-4")
    router-link(to="/")
      .hidden.gap-1.text-3xl.uppercase(class="sm:flex")
        span Supa
        span.font-medium Job
      .flex.gap-1.text-3xl.uppercase(class="sm:hidden")
        span S
        span.font-medium J
    button.rounded.px-3.py-1.uppercase.transition(
      v-if="account"
      class="hover:bg-slate-200 active:scale-95"
      @click="mintOpen = true"
    ) Mint
  .flex.items-center.gap-2(v-if="account")
    Chip.cursor-pointer.gap-1.rounded-xl.bg-white.px-4.py-1.transition(
      class="py-2.5 hover:bg-slate-200 active:scale-95"
      :account="account"
      pfp-class="h-6 w-6 rounded-full bg-slate-100"
      @click="profileOpen = true"
    )
  button.flex.items-center.justify-center.gap-1.rounded-lg.bg-gradient-to-r.from-purple-500.to-pink-500.px-5.text-center.text-white.transition-transform(
    class="py-2.5 hover:bg-gradient-to-l active:scale-95 disabled:bg-gradient-to-l disabled:opacity-50 disabled:active:scale-100"
    @click="connect"
    :disabled="isConnecting"
    v-else
  )
    WalletIcon.h-5.w-5(v-if="!isConnecting")
    Spinner.h-5.w-5.fill-purple-500(v-else)
    span Connect wallet

Teleport(to="body")
  Profile(
    v-if="account"
    :account="account"
    :open="profileOpen"
    @close="profileOpen = false"
    @disconnect="profileOpen = false; disconnect()"
  )
  Mint(
    v-if="account"
    :account="account"
    :open="mintOpen"
    @close="mintOpen = false"
  )
</template>
