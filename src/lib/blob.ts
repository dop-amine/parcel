import { put } from '@vercel/blob';

export const uploadToBlob = async (filename: string, body: ReadableStream<Uint8Array> | null, contentType?: string) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }

  if (!body) {
    throw new Error('Request body is required');
  }

  return put(filename, body, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
    token,
  });
};