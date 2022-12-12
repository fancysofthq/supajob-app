<script setup lang="ts">
import { onMounted, ref, type ShallowRef } from "vue";
import * as api from "@/services/api";
import { Job } from "@/models/Job";
import { Account } from "@fancysofthq/supa-app/models/Account";
import JobVue, { Kind as JobVueKind } from "@/components/Job.vue";
import Spinner from "@/components/shared/Spinner.vue";
import nProgress from "nprogress";
import { sleep } from "@fancysofthq/supa-app/utils/aux";

const jobs: ShallowRef<Job[]> = ref([]);
const fetchInProgress = ref(true);

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

  fetchInProgress.value = false;
  nProgress.done();
});
</script>

<template lang="pug">
.flex.w-full.max-w-2xl.flex-col.gap-3
  .prose.flex.flex-col.rounded-xl.bg-gradient-to-br.from-emerald-500.to-amber-300.bg-fixed.p-4.text-white
    h2 Welcome to SupaJob! 🎉
    p You may browse for NFT jobs, or mint your own. A soulbound job NFT may be later transfered to your profile as a <em>kudo</em>.
    p.text-sm
      | The site is still in β, so please report any bugs or suggestions to&nbsp;
      a.font-medium(href="https://twitter.com/vladfaust" class="hover:underline") @vladfaust
      | &nbsp;on Twitter.
    p.text-sm
      | ⚠️ Web3.Storage, the IPFS pinning provider, is currently&nbsp;
      a.underline(href="https://status.web3.storage/incidents/759t97vdwg4x") experiencing outages in services
      | ; content may be unavailable for a while.

  template(v-if="fetchInProgress")
    Spinner.h-6.w-6.fill-white.text-slate-300
  template(v-else)
    router-link(:to="'/job/' + job.cid.toString()" v-for="job in jobs")
      JobVue.cursor-pointer.rounded-xl.border.border-white.bg-white.p-3.shadow-lg.transition(
        :job="job"
        :kind="JobVueKind.Card"
        class="hover:border-slate-200 active:scale-95 active:shadow-none"
      )
</template>
