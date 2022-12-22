import { useEth } from "@fancysofthq/supa-app/services/eth";
import { ref, Ref } from "vue";
import {
  IPNFT721Soulbound,
  IPNFT721Soulbound__factory,
} from "@fancysoft/contracts/typechain";
const { onConnect } = useEth();

export const jobsContract: Ref<IPNFT721Soulbound | undefined> = ref();

onConnect(async (provider, account) => {
  jobsContract.value = IPNFT721Soulbound__factory.connect(
    import.meta.env.VITE_JOBS_ADDRESS,
    provider.getSigner()
  );
});
