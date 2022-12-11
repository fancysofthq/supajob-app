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
import { Job } from "@/models/Job";
import JobVue from "@/components/Job.vue";
import { displayCid } from "supa-app/services/ipfs";

const { copy, copied } = useClipboard();

defineProps<{ open: boolean; job: Job }>();
const emit = defineEmits(["close"]);
</script>

<template lang="pug">
CommonVue(:open="open" @close="emit('close')" panel-class="w-full max-w-2xl")
  template(#title)
    span.flex.items-baseline.gap-1
      span.text-lg.font-bold Job
      router-link.text-slate-400(
        :to="/job/ + job.cid.toString()"
        class="hover:text-slate-600 hover:underline"
        tabindex="-1"
      ) {{ displayCid(job.cid) }}
    button(@click="emit('close')")
      XMarkIcon.h-6.w-6

  template(#description)
    JobVue.rounded-xl.border.p-3(:job="job" :show-content="true")
</template>
