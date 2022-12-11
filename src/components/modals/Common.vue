<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";

const { open, panelClass = "" } = defineProps<{
  open: boolean;
  panelClass?: string;
}>();

const emit = defineEmits(["close"]);
</script>

<template lang="pug">
TransitionRoot(:show="open" as="template")
  Dialog.relative.z-50(:open="open" @close="emit('close')")
    TransitionChild(
      as="template"
      enter="duration-300 ease-out"
      enter-from="opacity-0 backdrop-blur-none"
      enter-to="opacity-100"
      leave="duration-200 ease-in"
      leave-from="opacity-100"
      leave-to="opacity-0 backdrop-blur-none"
    )
      //- The backdrop
      .fixed.inset-0.flex.items-center.justify-center.p-4.backdrop-blur-sm.transition(
        class="bg-black/40"
      )

    //- Full-screen scrollable content
    .fixed.inset-0.overflow-y-auto
      //- Container to center the panel
      .flex.min-h-full.items-center.justify-center.p-4
        TransitionChild(
          as="template"
          enter="ease-in-out duration-300 transform"
          enter-from="translate-y-full opacity-0"
          enter-to="translate-y-0 opacity-100"
          leave="ease-in-out duration-300 transform"
          leave-from="translate-y-0 opacity-100"
          leave-to="translate-y-full opacity-0"
        )
          DialogPanel.flex.flex-col.gap-2.rounded-lg.bg-white.p-4.shadow-lg.transition(
            :class="panelClass"
          )
            DialogTitle.flex.justify-between
              slot(name="title")

            DialogDescription
              slot(name="description")
</template>
