import {
  Blockifiable,
  Blockstore,
} from "@fancysofthq/supa-app/services/Web3Storage";
import { CID } from "multiformats/cid";
import { Block } from "multiformats/block";
import { toIpfsUri, gatewayize } from "@fancysofthq/supa-app/services/ipfs";
import { markRaw, ref, ShallowRef } from "vue";
import { Account } from "@fancysofthq/supa-app/models/Account";
import * as UnixFS from "@ipld/unixfs";

export type Metadata = {
  name: string;
  description: string;
  image: URL | File | string;
  properties: {
    tags: string[];
    content: string;
    payment: string;
    location: string;
  };
};

async function read<T>(readable: ReadableStream<T>): Promise<T[]> {
  const chunks: T[] = [];
  const reader = readable.getReader();
  let { done, value } = await reader.read();

  while (!done) {
    chunks.push(value!);
    ({ done, value } = await reader.read());
  }

  return chunks;
}

export class Job implements Blockifiable {
  static memo = new Map<string, Job>();

  static getOrCreate(
    cid: CID,
    author: Account,
    block: number,
    resolve: boolean = false
  ): Job {
    if (!this.memo.has(cid.toString())) {
      const job = markRaw(new Job(cid, author, block, ref()));
      if (resolve) job.resolveMetadata();
      this.memo.set(cid.toString(), job);
    }

    return this.memo.get(cid.toString())!;
  }

  constructor(
    public readonly cid: CID,
    public readonly author: Account,
    public readonly block: number,
    public readonly metadata: ShallowRef<Metadata | undefined>
  ) {}

  async resolveMetadata(): Promise<void> {
    const metadataUrl = gatewayize(
      toIpfsUri(this.cid) + "metadata.json",
      "w3s.link"
    );
    this.metadata.value = await (await fetch(metadataUrl)).json();
  }

  get imageUrl(): URL | undefined {
    if (!this.metadata.value?.image) return undefined;

    if (this.metadata.value.image instanceof URL)
      return gatewayize(this.metadata.value.image, "w3s.link");

    if (this.metadata.value.image instanceof File)
      return new URL(URL.createObjectURL(this.metadata.value.image));

    return gatewayize(new URL(this.metadata.value.image), "w3s.link");
  }

  async blockify(): Promise<{
    json: Metadata;
    blockstore: Blockstore;
  }> {
    if (!this.metadata.value) throw new Error("Expected metadata to be set");

    if (!(this.metadata.value.image instanceof File))
      throw new Error("Expected image to be a File");

    const { readable, writable } = new TransformStream();
    const writer = UnixFS.createWriter({ writable });
    const rawBlocks = read<{ cid: CID; bytes: Uint8Array }>(readable);

    const imgFile = UnixFS.createFileWriter(writer);
    imgFile.write(
      new Uint8Array(await this.metadata.value.image.arrayBuffer())
    );
    const imgFileLink = await imgFile.close();

    const dir = UnixFS.createDirectoryWriter(writer);
    dir.set(this.metadata.value.image.name, imgFileLink);
    const dirLink = await dir.close();

    await writer.close();

    const blocks = (await rawBlocks).map(
      (block) => new Block({ cid: block.cid, bytes: block.bytes, value: null })
    );

    const json: Metadata = JSON.parse(JSON.stringify(this.metadata.value));
    json.image = toIpfsUri(dirLink.cid as CID) + this.metadata.value.image.name;

    return {
      json,
      blockstore: new Blockstore(dirLink.cid as CID, blocks),
    };
  }
}
