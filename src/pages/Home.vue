<script setup lang="ts">
import { onMounted, ref, type ShallowRef } from "vue";
import * as api from "@/services/api";
import { Job } from "@/models/Job";
import { Account } from "supa-app/models/Account";
import JobVue from "@/components/Job.vue";
import JobModal from "@/components/modals/Job.vue";

const jobs: ShallowRef<Job[]> = ref([]);
const jobModal: ShallowRef<Job | null> = ref(null);

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

<template lang="pug">
.flex.w-full.justify-center.p-4(class="sm:p-8")
  .flex.w-full.max-w-2xl.flex-col.gap-4
    router-link.contents(
      v-for="job in jobs"
      :to="'/job/' + job.cid.toString()"
    )
      JobVue.rounded-xl.border.border-white.bg-white.p-3.shadow(
        class="hover:border-slate-300"
        :job="job"
        :show-content="false"
      )
</template>
