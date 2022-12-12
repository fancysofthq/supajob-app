<script setup lang="ts">
import { Job } from "@/models/Job";
import {
  ArrowRightOnRectangleIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/vue/24/outline";
import { useClipboard } from "@vueuse/core";
import { Account } from "supa-app/models/Account";
import { notNull } from "supa-app/utils/aux";
import { computed, onMounted, ref, type ShallowRef } from "vue";
import * as api from "@/services/api";
import JobVue, { Kind as JobVueKind } from "@/components/Job.vue";
import PFP from "supa-app/components/PFP.vue";
import { useEth } from "supa-app/services/eth";

const { account: connectedAccount } = useEth();
const { copy, copied } = useClipboard();

const props = defineProps<{ profileAccount: Account; displayTitle: boolean }>();
const emit = defineEmits(["disconnect", "exit"]);

const jobs: ShallowRef<Job[]> = ref([]);

const isSelf = computed(() =>
  connectedAccount.value?.address.value?.equals(
    props.profileAccount.address.value
  )
);

onMounted(async () => {
  const address = await props.profileAccount.resolveAddress();

  jobs.value = (await api.getJobsFrom(address)).map((job) =>
    Job.getOrCreate(job.cid, props.profileAccount, job.block, true)
  );
});
</script>

<template lang="pug">
.flex.w-full.max-w-2xl.flex-col.gap-2
  .flex.items-baseline.gap-1(v-if="displayTitle")
    h2.ml-4.text-lg.font-semibold Account
    router-link.hidden.text-sm.text-slate-400(
      :to="'/' + profileAccount.ensNameOrAddress()"
      class="hover:text-inherit hover:underline sm:block"
    ) {{ profileAccount.ensNameOrAddress() }}
    router-link.text-sm.text-slate-400(
      :to="'/' + profileAccount.ensNameOrAddress()"
      class="hover:text-inherit hover:underline sm:hidden"
    ) {{ profileAccount.ensNameOrAddress(true) }}

  .flex.flex-col.gap-2.rounded-xl.bg-gradient-to-r.from-purple-500.to-pink-500.p-4
    .flex.items-center.justify-between
      .flex.items-center.gap-1
        router-link.contents(
          :to="'/' + profileAccount.ensNameOrAddress()"
          @click="emit('exit')"
        )
          PFP.mr-1.h-12.w-12.rounded-full.bg-white.shadow.transition(
            :account="profileAccount"
            class="active:scale-95 active:shadow-none"
          )
          .select-none.rounded-lg.p-2.px-3.text-white.transition(
            class="bg-black/10 hover:bg-black/20 hover:underline active:scale-95"
          ) {{ profileAccount.address.value?.display() }}
        button.rounded-lg.p-2.transition(
          class="hover:bg-black/20 active:scale-95"
          @click="copy(notNull(profileAccount.address.value).toString())"
        )
          DocumentDuplicateIcon.h-6.w-6.text-white(v-if="!copied")
          ClipboardDocumentCheckIcon.h-6.w-6.text-white(v-else)
        .flex.items-center.gap-2.text-sm(v-if="profileAccount.ensName.value")
          span.text-white aka
          router-link.rounded-full.bg-gradient-to-r.from-red-500.to-orange-500.p-1.px-3.text-white.shadow.transition(
            :to="'/' + profileAccount.ensName.value"
            class="active:scale-95 active:shadow-none"
          ) {{ profileAccount.ensName.value }}

      button.rounded-lg.p-2.transition(
        v-if="isSelf"
        @click="emit('disconnect')"
        class="hover:bg-black/20 active:scale-95"
      )
        ArrowRightOnRectangleIcon.h-6.w-6.text-white

  template(v-if="jobs.length")
    h2.ml-3.font-semibold Jobs minted
    .flex.flex-col.gap-2
      JobVue.cursor-pointer.rounded-lg.border.border-white.bg-white.p-3.shadow.transition(
        v-for="job of jobs"
        class="hover:border-slate-200 active:scale-95 active:shadow-none"
        :job="job"
        :kind="JobVueKind.Card"
        @visit="emit('exit')"
        @click.exact="() => { emit('exit'); $router.push('/job/' + job.cid.toString()); }"
      )
  p.ml-4(v-else) {{  isSelf ? "You haven't minted any jobs yet." : "This account hasn't minted any jobs yet."  }}
</template>
