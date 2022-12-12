<script setup lang="ts">
import CommonVue from "../Common.vue";

defineProps<{ open: boolean }>();
const emit = defineEmits(["cancel", "confirm"]);
</script>

<template lang="pug">
CommonVue(:open="open" @close="emit('cancel')")
  template(#title)
    span.ml-3.text-lg.font-bold Confirm

  template(#description)
    .flex.flex-col.gap-2
      p.text-sm.text-gray-500
        | Are you sure you want to cancel minting?
      .flex.justify-end
        button.rounded-md.bg-gray-200.px-4.py-2(
          @click="emit('cancel')"
          class="hover:bg-gray-300"
        )
          | Cancel
        button.rounded-md.bg-green-200.px-4.py-2(
          @click="emit('confirm')"
          class="hover:bg-green-300"
        )
          | Confirm
</template>
