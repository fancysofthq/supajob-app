<script setup lang="ts">
import type { Account } from "@fancysofthq/supa-app/models/Account";
import {
  XMarkIcon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/vue/24/outline";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/solid";
import { useObjectUrl } from "@vueuse/core";
import CommonVue from "./Common.vue";
import {
  computed,
  type ComputedRef,
  ref,
  type Ref,
  type ShallowRef,
} from "vue";
import TagInput from "@fancysofthq/supa-app/components/TagInput.vue";
import FilePicker from "@fancysofthq/supa-app/components/FilePicker.vue";
import { jobsContract } from "@/services/eth";
import { Job, type Metadata } from "@/models/Job";
import JobVue, { Kind as JobVueKind } from "@/components/Job.vue";
import { packIpnft } from "@fancysofthq/supa-app/services/Web3Storage";
import { useEth } from "@fancysofthq/supa-app/services/eth";
import { Address } from "@fancysofthq/supabase";
import { indexOfMulti } from "@fancysofthq/supa-app/utils/uint8";
import Spinner from "@/components/shared/Spinner.vue";
import * as api from "@/services/api";
import { CID } from "multiformats/cid";
import { IPFT } from "@nxsf/ipnft";

const props = defineProps<{ open: boolean; account: Account }>();
const emit = defineEmits(["close", "disconnect"]);

const previewImage: ShallowRef<File | undefined> = ref();
const previewImageUrl = useObjectUrl(previewImage);
const name: Ref<string> = ref("");
const description: Ref<string> = ref("");
const tags: ShallowRef<string[]> = ref([]);
const payment: Ref<string> = ref("");
const location: Ref<string> = ref("");
const content: Ref<string> = ref("");

const canMint: ComputedRef<boolean> = computed(
  () =>
    name.value.length > 0 &&
    description.value.length > 0 &&
    payment.value.length > 0 &&
    location.value.length > 0 &&
    content.value.length > 0 &&
    previewImage.value !== undefined
);

const hasContent: ComputedRef<boolean> = computed(
  () =>
    !!previewImage.value ||
    name.value.length > 0 ||
    description.value.length > 0 ||
    tags.value.length > 0 ||
    payment.value.length > 0 ||
    location.value.length > 0 ||
    content.value.length > 0
);

enum Status {
  InProgress,
  Error,
  Complete,
}

const mintingToken: Ref<Status | undefined> = ref();
const uploadingContent: Ref<Status | undefined> = ref();
const txConfirmation: Ref<Status | undefined> = ref();

const mintButtonPressed = ref(false);

const inProgress = computed(
  () =>
    mintingToken.value === Status.InProgress ||
    uploadingContent.value === Status.InProgress ||
    txConfirmation.value === Status.InProgress
);

const isComplete = computed(
  () =>
    mintingToken.value === Status.Complete &&
    uploadingContent.value === Status.Complete &&
    txConfirmation.value === Status.Complete
);

const mintError = ref<any>();

const jobMetadata: ComputedRef<Metadata> = computed(() => ({
  name: name.value,
  description: description.value,
  image: previewImage.value!,
  properties: {
    tags: tags.value,
    payment: payment.value,
    location: location.value,
    content: content.value,
  },
}));

const job: ComputedRef<Job> = computed(
  () => new Job(jobCid.value!, props.account, 0, jobMetadata)
);

const jobCid: Ref<CID | undefined> = ref();

async function mint() {
  if (!jobsContract.value) throw new Error("No contract");
  if (!canMint.value) throw new Error("Cannot mint");

  mintButtonPressed.value = true;
  mintError.value = undefined;
  mintingToken.value = Status.InProgress;
  uploadingContent.value = undefined;
  txConfirmation.value = undefined;

  const { provider } = useEth();

  const ipft = new IPFT(
    (await provider.value!.getNetwork()).chainId,
    Address.from(jobsContract.value!.address).toString(),
    props.account.address.value!.toString()
  );

  const blockstore = await packIpnft(job.value, ipft);
  const cid = blockstore.rootCid;
  jobCid.value = cid;
  console.debug("Root CID", cid.toString());

  const currentAuthorOf = Address.from(
    await jobsContract.value.contentAuthorOf(cid.multihash.digest)
  );

  if (currentAuthorOf.zero) {
    const tagOffset = indexOfMulti(blockstore.rootBlock.bytes, ipft.toBytes());
    let tx;

    try {
      tx = await jobsContract.value.mint(
        props.account.address.value!.toString(),
        cid.multihash.digest,
        props.account.address.value!.toString(),
        blockstore.rootBlock.bytes,
        cid.code,
        tagOffset,
        false
      );
    } catch (e: any) {
      console.error(e);
      mintingToken.value = Status.Error;
      mintError.value = new Error("Transaction failed");
      return;
    }

    console.debug("Minted", tx.hash);

    mintingToken.value = Status.Complete;
    uploadingContent.value = Status.InProgress;
    txConfirmation.value = Status.InProgress;

    await Promise.all([
      api
        .storeCar(blockstore.toCar())
        .then((res) => {
          uploadingContent.value = Status.Complete;

          if (!cid.equals(res)) {
            throw new Error("Root CID mismatch");
          }
        })
        .catch((e: any) => {
          console.debug("Upload failed", e);
          uploadingContent.value = Status.Error;
          mintError.value = new Error("Upload failed");
        }),

      tx
        .wait(1)
        .then(() => {
          txConfirmation.value = Status.Complete;
        })
        .catch((e: any) => {
          console.debug("Confirmation failed", e);
          txConfirmation.value = Status.Error;
          mintError.value = new Error("Confirmation failed");
        }),
    ]);
  } else {
    mintingToken.value = Status.Error;
    mintError.value = new Error("Already minted!");

    // TODO: Mint again
    // const tx = await jobBoardContract.value.mintAgain(
    //   props.account.address.value!.toString(),
    //   cid.multihash.digest,
    //   1,
    //   [],
    //   { value: mintPrice.value }
    // );
    // console.debug("Minted again", tx.hash);
    // minting.value = Status.Complete;
    // uploading.value = Status.Skipped;
    // txConfirmation.value = Status.InProgress;
    // await Promise.all([
    //   tx.wait().then(() => {
    //     txConfirmation.value = Status.Complete;
    //   }),
    // ]);
  }
}

async function cleanup(): Promise<boolean> {
  if (inProgress.value) return false;
  if (
    hasContent.value &&
    !isComplete.value &&
    !confirm("Discard unminted content?")
  ) {
    return false;
  }

  mintingToken.value = undefined;
  uploadingContent.value = undefined;
  txConfirmation.value = undefined;
  mintError.value = undefined;
  mintButtonPressed.value = false;

  name.value = "";
  description.value = "";
  tags.value = [];
  payment.value = "";
  location.value = "";
  content.value = "";
  previewImage.value = undefined;

  return true;
}

async function tryClose(): Promise<void | null> {
  (await cleanup()) ? emit("close") : null;
}
</script>

<template lang="pug">
CommonVue(:open="open" @close="tryClose" panel-class="w-full max-w-5xl")
  template(#title)
    span.text-lg.font-bold Mint a Job
    button.opacity-10.transition-opacity(@click="tryClose" class="hover:opacity-100")
      XMarkIcon.h-6.w-6

  template(#description)
    .grid.grid-cols-1.gap-y-3(class="sm:grid-cols-5 sm:gap-x-3")
      form.relative.col-span-2.flex.flex-col.divide-y.rounded-xl.border.bg-white(
        :class="{ 'opacity-50': mintButtonPressed }"
      )
        .absolute.z-20.-ml-1.-mt-1.flex.h-8.w-8.items-center.justify-center.rounded-full.border.bg-white.text-lg.font-bold 1

        FilePicker.bg-checkerboard.flex.h-48.items-center.justify-center.overflow-hidden.rounded-t-lg.border-none(
          accept="image/jpg,image/jpeg"
          v-model:image="previewImage"
          :file="previewImage"
          @update:file="previewImage = $event"
          :disabled="mintButtonPressed"
          :class="{ 'cursor-pointer': !mintButtonPressed }"
        )
          img.aspect-square.h-full.object-cover(
            v-if="previewImage"
            :src="previewImageUrl"
          )
          .flex.aspect-square.h-full.select-none.flex-col.items-center.justify-center.bg-white(
            v-else
          )
            PhotoIcon.h-6.w-6
            span.text-sm.font-medium Select image

        .p-2
          input.w-full.rounded.border-none.p-0(
            :disabled="mintButtonPressed"
            type="text"
            placeholder="Name*"
            v-model="name"
            class="hover:bg-slate-100 focus:bg-slate-100"
          )

        .p-2
          TagInput.tag-input.border-none(
            :disabled="mintButtonPressed"
            v-model="tags"
            placeholder="Tags"
            v-slot="{ tag, onClick }"
            input-class="p-0 w-full rounded border-none hover:bg-slate-100 focus:bg-slate-100"
          )
            .flex.cursor-pointer.items-center.rounded-full.border.px-2.py-1(
              @click="onClick"
            )
              span.text-xs.leading-none.text-slate-600 \#{{ tag }}
              XMarkIcon.h-4.w-4

        .p-2
          textarea.w-full.rounded.border-none.p-0.text-sm(
            :disabled="mintButtonPressed"
            class="hover:bg-slate-100 focus:bg-slate-100"
            placeholder="Short description*"
            v-model="description"
            rows="1"
          )

        .p-2
          input.w-full.rounded.border-none.p-0(
            :disabled="mintButtonPressed"
            type="text"
            placeholder="Payment*"
            v-model="payment"
            class="hover:bg-slate-100 focus:bg-slate-100"
          )

        .p-2
          input.w-full.shrink.rounded.border-none.p-0(
            :disabled="mintButtonPressed"
            type="text"
            placeholder="Location*"
            v-model="location"
            class="hover:bg-slate-100 focus:bg-slate-100"
          )

        .p-2
          textarea.w-full.rounded.border-none.p-0.text-sm(
            v-model="content"
            :disabled="mintButtonPressed"
            placeholder="Markdown description*"
            class="hover:bg-slate-100 focus:bg-slate-100"
          )

      .col-span-3.flex.flex-col.gap-3
        .relative.flex.flex-col
          .absolute.z-20.-ml-1.-mt-1.flex.h-8.w-8.items-center.justify-center.rounded-full.border.bg-white.text-lg.font-bold 2
          JobVue.rounded-xl.border.bg-white.p-3(
            :job="job"
            :kind="JobVueKind.Full"
          )

        .relative.flex.flex-col.gap-3.rounded-xl.border.bg-white
          .absolute.z-20.-ml-1.-mt-1.flex.h-8.w-8.items-center.justify-center.rounded-full.border.bg-white.text-lg.font-bold 3

          .flex.flex-col.gap-2.p-3
            button.flex.w-full.items-center.justify-center.gap-1.rounded-lg.bg-gradient-to-r.from-purple-500.to-pink-500.px-5.text-center.text-white.transition(
              :disabled="!canMint || mintButtonPressed || isComplete"
              class="py-2.5 hover:bg-gradient-to-l focus:outline-none focus:ring-2 focus:ring-purple-200 active:scale-95 disabled:bg-gradient-to-l disabled:focus:ring-0 disabled:active:scale-100"
              :class="{ 'opacity-50 cursor-not-allowed': !canMint, 'cursor-default': mintButtonPressed }"
              @click="mint"
            )
              span(v-if="!mintButtonPressed") Mint
              .flex.flex-col.items-start.p-1(
                v-else
                style="grid-template-columns: min-content auto"
              )
                .flex.h-7.items-center.gap-1
                  .flex.h-7.w-7.items-center.justify-center
                    CheckCircleIcon.h-7.w-7(
                      v-if="mintingToken === Status.Complete"
                    )
                    XCircleIcon.h-7.w-7(
                      v-else-if="mintingToken === Status.Error"
                    )
                    Spinner.h-5.w-5.fill-pink-500(
                      v-else-if="mintingToken === Status.InProgress"
                    )
                    Spinner.h-5.w-5(v-else)
                  span.font-medium
                    span Minting token
                    sup.ml-1 (eth)
                .flex.h-7.items-center.gap-1(
                  :class="{ 'opacity-50': !uploadingContent }"
                )
                  .flex.h-7.w-7.items-center.justify-center
                    CheckCircleIcon.h-7.w-7(
                      v-if="uploadingContent === Status.Complete"
                    )
                    XCircleIcon.h-7.w-7(
                      v-else-if="uploadingContent === Status.Error"
                    )
                    Spinner.h-5.w-5.fill-pink-500(
                      v-else-if="uploadingContent === Status.InProgress"
                    )
                    Spinner.h-5.w-5(v-else)
                  span.font-medium
                    span Uploading content
                    sup.ml-1 (web2)
                .flex.h-7.items-center.gap-1(
                  :class="{ 'opacity-50': !txConfirmation }"
                )
                  .flex.h-7.w-7.items-center.justify-center
                    CheckCircleIcon.h-7.w-7(
                      v-if="txConfirmation === Status.Complete"
                    )
                    XCircleIcon.h-7.w-7(
                      v-else-if="txConfirmation === Status.Error"
                    )
                    Spinner.h-5.w-5.fill-pink-500(
                      v-else-if="txConfirmation === Status.InProgress"
                    )
                    Spinner.h-5.w-5(v-else)
                  span.font-medium Waiting for tx confirmation
                .mt-2.w-full(v-if="isComplete")
                  .flex.w-full.justify-center.rounded-lg.border-2.border-white.p-1.text-sm.font-medium
                    router-link.flex.cursor-pointer.gap-1.transition-transform(
                      class="hover:underline active:scale-95"
                      :to="'/job/' + jobCid"
                      @click="tryClose"
                    )
                      span Visit job page
                      ArrowTopRightOnSquareIcon.h-5.w-5

            .flex.flex-col(v-if="mintError")
              .flex.w-full.items-center.justify-center.gap-1.rounded-lg.bg-red-500.p-2.text-sm
                XCircleIcon.inline-block.h-6.w-6.text-white
                span.text-white {{ mintError }}
                button.ml-1.rounded.bg-white.px-2.py-1.text-xs.text-red-800.shadow-sm.transition(
                  @click="mint"
                  class="active:scale-95 active:shadow-none"
                ) Try again
</template>

<style lang="scss">
.tag-input .tag {
  @apply rounded-full border;
}
</style>
