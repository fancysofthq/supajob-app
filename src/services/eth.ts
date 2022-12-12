import { useEth } from "@fancysofthq/supa-app/services/eth";
import { ref, ShallowRef, markRaw, Ref } from "vue";
import type { JobBoard } from "../../build/contracts/types/JobBoard";
import { JobBoardFactory } from "../../build/contracts/types/JobBoardFactory";
const { onConnect } = useEth();

export const jobBoardContract: Ref<JobBoard | undefined> = ref();

onConnect(async (provider, account) => {
  jobBoardContract.value = JobBoardFactory.connect(
    import.meta.env.VITE_JOB_BOARD_ADDRESS,
    provider.getSigner()
  );
});
