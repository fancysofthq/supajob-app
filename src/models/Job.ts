import { Blockifiable } from "supa-app/services/Web3Storage";
import { CID } from "multiformats/cid";
import { encode as encodeBlock, Block } from "multiformats/block";
import * as raw from "multiformats/codecs/raw";
import { sha256 } from "multiformats/hashes/sha2";
import { toIpfsUri, gatewayize } from "supa-app/services/ipfs";
import * as dagCbor from "@ipld/dag-cbor";
import { markRaw, ref, ShallowRef } from "vue";
import { Account } from "supa-app/models/Account";

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
    block: Block<unknown, 113, 18, 1>;
  }> {
    if (!this.metadata.value) throw new Error("Expected metadata to be set");

    if (!(this.metadata.value.image instanceof File))
      throw new Error("Expected image to be a File");

    const imgBlock = await encodeBlock({
      value: new Uint8Array(await this.metadata.value.image.arrayBuffer()),
      codec: raw,
      hasher: sha256,
    });

    const rootByteView = await encodeBlock({
      value: { [this.metadata.value.image.name]: imgBlock.cid },
      codec: dagCbor,
      hasher: sha256,
    });

    const block = new Block({
      cid: rootByteView.cid,
      bytes: rootByteView.bytes,
      value: rootByteView.value,
    });

    const json: Metadata = JSON.parse(JSON.stringify(this.metadata.value));
    json.image =
      toIpfsUri(rootByteView.cid as CID) + this.metadata.value.image.name;

    return { json, block };
  }
}
