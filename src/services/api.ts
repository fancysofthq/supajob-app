import { CID } from "multiformats/cid";
import * as Web3Auth from "@fancysofthq/supa-app/services/Web3Auth";
import { useEth } from "@fancysofthq/supa-app/services/eth";
import { CarReader, CarWriter } from "@ipld/car";
import { iteratorToBuffer } from "@fancysofthq/supa-app/utils/iterable";
import { Address } from "@fancysofthq/supabase";
import { Job } from "@fancysofthq/supajob-api/server";

export async function storeCar(file: CarReader): Promise<CID> {
  const { provider, account } = useEth();

  const token = await Web3Auth.ensureAuth(
    provider.value!,
    `authjwt.${account.value!.address.value!.toString()}`,
    {
      expiresIn: "7d",
      statement: "Please sign this message to authenticate with the API server",
      domain: import.meta.env.DEV
        ? undefined
        : new URL(import.meta.env.VITE_API_URL).hostname,
    },
    async (signature) => {
      const response = await fetch(
        new URL(import.meta.env.VITE_API_URL) + "v1/auth",
        {
          method: "POST",
          headers: {
            Authorization: `Web3-Token ${signature}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to authenticate");
      } else {
        return response.text();
      }
    }
  );

  const { writer: carWriter, out } = CarWriter.create(await file.getRoots());
  const buffer = iteratorToBuffer(out);

  for await (const block of file.blocks()) {
    await carWriter.put(block);
  }

  await carWriter.close();

  const request = new Request(
    new URL(import.meta.env.VITE_API_URL) + "v1/storeCar",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.ipld.car",
      },
      body: await buffer,
    }
  );

  const response = await fetch(request);

  if (!response.ok) {
    throw new Error("Failed to store CAR");
  }

  return CID.parse(await response.text());
}

export async function getJobs(): Promise<Job[]> {
  const response = await fetch(
    new URL(import.meta.env.VITE_API_URL) + "v1/jobs"
  );

  if (!response.ok) {
    throw new Error("Failed to get jobs");
  }

  return (await response.json()).map((dto: any) => Job.fromJSON(dto));
}

export async function getJob(cid: CID): Promise<Job | undefined> {
  const response = await fetch(
    new URL(import.meta.env.VITE_API_URL) + `v1/jobs/${cid}`
  );

  if (!response.ok) {
    return undefined;
  }

  return Job.fromJSON(await response.json());
}

export async function getJobsFrom(address: Address): Promise<Job[]> {
  const response = await fetch(
    new URL(import.meta.env.VITE_API_URL) + `v1/jobs?from=${address}`
  );

  if (!response.ok) {
    throw new Error("Failed to get jobs");
  }

  return (await response.json()).map((dto: any) => Job.fromJSON(dto));
}
