<script setup lang="ts">
import { onMounted, ref, type ShallowRef } from "vue";
import * as api from "@/services/api";
import { Job } from "@/models/Job";
import { Account } from "supa-app/models/Account";
import JobVue, { Kind as JobVueKind } from "@/components/Job.vue";

const jobs: ShallowRef<Job[]> = ref([]);

onMounted(async () => {
  jobs.value.push(
    ...(await api.getJobs()).map((job) =>
      Job.getOrCreate(
        job.cid,
        Account.getOrCreateFromAddress(job.author, true),
        job.block,
        true
      )
    )
  );
});
</script>

<!-- TODO: Full router-link -->
<template lang="pug">
.flex.w-full.max-w-2xl.flex-col.gap-3.pt-8
  JobVue.cursor-pointer.rounded-xl.border.border-white.bg-white.p-3.shadow-lg.transition(
    v-for="job in jobs"
    :job="job"
    :kind="JobVueKind.Card"
    @click.exact="() => $router.push('/job/' + job.cid.toString())"
    class="hover:border-slate-200 active:scale-95 active:shadow-none"
  )
</template>
