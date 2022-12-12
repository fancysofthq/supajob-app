<script lang="ts">
export enum Kind {
  Card,
  Full,
}
</script>

<script setup lang="ts">
import Markdown from "vue3-markdown-it";
import Placeholder from "supa-app/components/Placeholder.vue";
import Chip from "supa-app/components/Chip.vue";
import { Job } from "@/models/Job";
import { BanknotesIcon, MapPinIcon } from "@heroicons/vue/24/outline";

const { job, kind } = defineProps<{
  job: Job;
  kind: Kind;
}>();

const emit = defineEmits(["visit"]);
</script>

<template lang="pug">
.grid.gap-3(
  :class="{ 'grid-cols-7': kind === Kind.Card, 'grid-cols-5': kind === Kind.Full }"
)
  router-link.contents(
    :to="job.cid ? '/job/' + job.cid.toString() : ''"
    @click.exact="emit('visit')"
  )
    template(v-if="job.imageUrl")
      img.bg-checkerboard.aspect-square.w-full.rounded.bg-fixed.object-cover(
        class="hover:opacity-80"
        :src="job.imageUrl.toString()"
      )
    Placeholder.aspect-square.w-full.rounded(v-else)

  .col-span-4.flex.flex-col.gap-1(
    :class="{ 'col-span-6': kind === Kind.Card }"
  )
    router-link.contents(
      :to="job.cid ? '/job/' + job.cid.toString() : ''"
      @click.exact="emit('visit')"
    )
      span.w-max.text-lg.font-semibold.leading-none(
        v-if="job.metadata.value?.name"
        class="hover:underline"
      ) {{ job.metadata.value.name }}
      Placeholder.h-5.w-full.rounded(v-else)

    .mt-1.flex.flex-wrap.gap-1(
      v-if="job.metadata.value?.properties.tags.length"
    )
      span.rounded-full.border.border-black.px-2.text-xs.font-medium(
        v-for="tag in job.metadata.value.properties.tags"
      ) \#{{ tag }}

    span.text-sm.text-slate-600(v-if="job.metadata.value?.description") {{ job.metadata.value.description }}
    .my-1.flex.flex-col.gap-1(v-else)
      Placeholder.h-3.w-full.rounded
      Placeholder.h-3.w-full.rounded

    .flex.flex-col.items-start.gap-x-1.text-sm.leading-none(class="sm:flex-row")
      .flex.items-center.gap-1
        BanknotesIcon.h-6.w-6
        span.font-medium(v-if="job.metadata.value?.properties.payment") {{ job.metadata.value?.properties.payment }}
        Placeholder.h-3.w-20.rounded(v-else)
      .flex.items-center.gap-1
        MapPinIcon.h-6.w-6
        span.font-medium(v-if="job.metadata.value?.properties.location") {{ job.metadata.value?.properties.location }}
        Placeholder.h-3.w-20.rounded(v-else)
      router-link(
        :to="'/' + job.author.ensNameOrAddress()"
        custom
        v-slot="{ href, navigate }"
      )
        a.contents(
          :href="href"
          @click.stop="() => { navigate(); emit('visit'); }"
        )
          Chip.cursor-pointer.gap-1.font-medium(
            class="hover:underline"
            :account="job.author"
            v-if="job.author"
            pfp-class="h-6 w-6 rounded-full bg-slate-100"
          )

  .col-span-5.rounded-lg.border.p-3(v-if="kind === Kind.Full")
    Markdown.prose.leading-tight(
      v-if="job.metadata.value?.properties.content"
      :source="job.metadata.value.properties.content"
      :linkify="true"
    )
    Placeholder.h-5.w-full.rounded(v-else)
</template>

<style lang="scss">
.prose {
  @apply flex flex-col gap-1 leading-tight;

  h1 {
    @apply text-2xl font-bold;
  }

  h2 {
    @apply text-xl font-bold;
  }

  h3 {
    @apply text-lg font-bold;
  }

  h4 {
    @apply text-base font-bold;
  }

  h5 {
    @apply text-sm font-bold;
  }

  h6 {
    @apply text-xs font-bold;
  }

  blockquote {
    @apply my-1 border-l-4 border-slate-300 pl-2;
  }

  a {
    @apply inline-block;
  }

  pre {
    @apply my-1 overflow-x-auto rounded bg-slate-100 p-2;
  }

  code {
    @apply inline-block rounded bg-slate-100 px-1;
  }

  ul {
    @apply my-1 ml-4 list-disc;
  }
}
</style>
