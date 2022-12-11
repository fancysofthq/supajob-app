declare module "vue3-markdown-it";
declare module "async-iterable-to-readable-stream" {
  export default function asyncIterableToReadableStream<T>(
    iterable: AsyncIterable<T>
  ): ReadableStream<T>;
}
