<script setup lang="ts">
import Markdown from "vue3-markdown-it";
import Placeholder from "supa-app/components/Placeholder.vue";
import Chip from "supa-app/components/Chip.vue";
import { Job } from "@/models/Job";
import { BanknotesIcon, MapPinIcon } from "@heroicons/vue/24/outline";

const { job } = defineProps<{ job: Job; showContent: boolean }>();
</script>

<template lang="pug">
.grid.grid-cols-4.gap-3
  template(v-if="job.imageUrl")
    img.bg-checkerboard.aspect-square.w-full.rounded.bg-fixed.object-cover(
      :src="job.imageUrl.toString()"
    )
  Placeholder.aspect-square.w-full.rounded(v-else)

  .col-span-3.flex.flex-col.gap-1
    span.text-lg.font-semibold.leading-none(v-if="job.metadata.value?.name") {{ job.metadata.value.name }}
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
      Chip.cursor-pointer.gap-1.font-medium(
        class="hover:underline"
        :account="job.author"
        v-if="job.author"
        pfp-class="h-6 w-6 rounded-full bg-slate-100"
      )

  Markdown.prose.col-span-4.leading-tight(
    v-if="showContent && job.metadata.value?.properties.content"
    :source="job.metadata.value.properties.content"
  )
  .col-span-4(v-else-if="showContent")
    Placeholder.h-5.w-full.rounded
    .relative.flex.flex-col
</template>
