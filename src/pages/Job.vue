<script setup lang="ts">
import JobVue, { Kind as JobVueKind } from "@/components/Job.vue";
import { onMounted, ref, type ShallowRef } from "vue";
import * as api from "@/services/api";
import { Job } from "@/models/Job";
import { Account } from "supa-app/models/Account";
import { CID } from "multiformats/cid";
import nProgress from "nprogress";
import {
  FaceFrownIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
} from "@heroicons/vue/24/outline";
import Spinner from "@/components/shared/Spinner.vue";
import { displayCid } from "supa-app/services/ipfs";
import { useClipboard } from "@vueuse/core";
const { copy, copied } = useClipboard();

const { cid } = defineProps<{ cid: CID }>();

const fetchInProgress = ref(true);
const model: ShallowRef<Job | null> = ref(null);
const alsoJobs: ShallowRef<Job[]> = ref([]);

onMounted(async () => {
  const dto = await api.getJob(cid);
  nProgress.done();

  if (dto) {
    model.value = Job.getOrCreate(
      dto.cid,
      Account.getOrCreateFromAddress(dto.author, true),
      dto.block,
      true
    );

    fetchInProgress.value = false;

    const address = await model.value.author.resolveAddress();

    alsoJobs.value = (await api.getJobsFrom(address))
      .map((j) => Job.getOrCreate(j.cid, model.value!.author, j.block, true))
      .filter((j) => !j.cid.equals(model.value!.cid));
  } else {
    fetchInProgress.value = false;
  }
});
</script>

<template lang="pug">
.flex.w-full.max-w-2xl.flex-col.gap-2
  .flex.items-baseline.gap-1
    h2.ml-4.text-lg.font-semibold Job
    router-link.hidden.text-sm.text-slate-400(
      :to="'/job/' + cid.toString()"
      class="hover:text-inherit hover:underline sm:block"
    ) {{ cid }}
    router-link.text-sm.text-slate-400(
      :to="'/job/' + cid.toString()"
      class="hover:text-inherit hover:underline sm:hidden"
    ) {{ displayCid(cid) }}

  template(v-if="fetchInProgress")
    Spinner.h-6.w-6.fill-white.text-slate-300
  .flex.flex-col.gap-2(v-else)
    JobVue.rounded-xl.bg-white.p-4.shadow(
      v-if="model"
      :job="model"
      :kind="JobVueKind.Full"
    )
    template(v-else)
      .flex.gap-1
        span Not found
        FaceFrownIcon.h-6.w-6

    template(v-if="alsoJobs.length")
      h2.ml-4.font-semibold Also see
      .flex.flex-col.gap-3
        JobVue.cursor-pointer.rounded-xl.border.border-white.bg-white.p-4.shadow-lg.transition(
          v-for="job in alsoJobs"
          :job="job"
          :kind="JobVueKind.Card"
          @click.exact="() => $router.push('/job/' + job.cid.toString())"
          class="hover:border-slate-200 active:scale-95 active:shadow-none"
        )
</template>
