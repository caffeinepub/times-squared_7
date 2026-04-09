import { loadConfig } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";

/**
 * Upload a File to blob storage and return its direct URL as a blobId string.
 * The blobId string can be passed directly to backend methods that accept
 * heroImageBlobId, logoBlobId, bannerBlobId, or avatarBlobId.
 */
export async function uploadFileToBlobStorage(file: File): Promise<string> {
  const config = await loadConfig();
  const agent = HttpAgent.createSync({ host: config.backend_host });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {});
  }
  const storageClient = new StorageClient(
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { hash } = await storageClient.putFile(bytes);
  return await storageClient.getDirectURL(hash);
}

/**
 * React hook that wraps uploadFileToBlobStorage with loading state.
 */
export function useUploadFile() {
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      return await uploadFileToBlobStorage(file);
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, isUploading };
}
