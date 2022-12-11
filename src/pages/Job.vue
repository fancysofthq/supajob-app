<script setup lang="ts">
import JobVue from "@/components/Job.vue";
import { onMounted, ref, type ShallowRef } from "vue";
import * as api from "@/services/api";
import { Job } from "@/models/Job";
import { Account } from "supa-app/models/Account";

const props = defineProps<{ dto: Awaited<ReturnType<typeof api.getJob>> }>();
const model: ShallowRef<Job | null> = ref(null);

onMounted(async () => {
  if (props.dto) {
    model.value = Job.getOrCreate(
      props.dto.cid,
      Account.getOrCreateFromAddress(props.dto.author, true),
      props.dto.block,
      true
    );
  }
});
</script>

<template lang="pug">
.flex.w-full.justify-center.p-4(class="sm:p-8")
  .flex.w-full.max-w-2xl.flex-col.items-center.justify-center.gap-2
    JobVue.rounded-xl.bg-white.p-3.shadow(
      v-if="model"
      :job="model"
      :show-content="true"
    )
    template(v-else)
      div Job not found
</template>
