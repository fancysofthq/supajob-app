<script setup lang="ts">
import type { Account } from "supa-app/models/Account";
import PFP from "supa-app/components/PFP.vue";
import {
  ArrowRightOnRectangleIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/vue/24/outline";
import { useClipboard } from "@vueuse/core";
import { notNull } from "supa-app/utils/aux";
import CommonVue from "./Common.vue";

const { copy, copied } = useClipboard();

defineProps<{ open: boolean; account: Account }>();
const emit = defineEmits(["close", "disconnect"]);
</script>

<template lang="pug">
CommonVue(:open="open" @close="emit('close')")
  template(#title)
    span.text-lg.font-bold Account
    button(@click="emit('close')")
      XMarkIcon.h-6.w-6

  template(#description)
    .flex.flex-col.gap-2.rounded-xl.bg-gradient-to-r.from-purple-500.to-pink-500.p-4
      .flex.items-center.justify-between
        .flex.items-center.gap-1
          .flex.gap-1.rounded-lg.p-2(class="bg-black/10")
            PFP.h-6.w-6.rounded.bg-white(:account="account")
            span.text-white {{ account.ensName.value || account.address.value?.display() }}
          button.rounded-lg.p-2.transition(
            class="hover:bg-black/20 active:scale-95"
            @click="copy(notNull(account.address.value).toString())"
          )
            DocumentDuplicateIcon.h-6.w-6.text-white(v-if="!copied")
            ClipboardDocumentCheckIcon.h-6.w-6.text-white(v-else)

        button.rounded-lg.p-2.transition(
          @click="emit('disconnect')"
          class="hover:bg-black/20 active:scale-95"
        )
          ArrowRightOnRectangleIcon.h-6.w-6.text-white
</template>
