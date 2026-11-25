import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

export const UPLOADS_BUCKET = "uploads";

export function getStorageClient() {
  return new Files({
    adapter: neon({ bucket: UPLOADS_BUCKET }),
  });
}

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_ENDPOINT_URL_S3
  );
}
