import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

// 100MB in bytes
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed file extensions (case insensitive)
const ALLOWED_EXTENSIONS = new Set(['.wav', '.flac', '.aac', '.m4a', '.mp3']);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ARTIST') {
      return NextResponse.json({ error: 'Only artists can upload tracks' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file extension
    const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}` },
        { status: 400 }
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 });
    }

    // Create a unique filename with prefix and metadata
    const timestamp = Date.now();
    const artistId = session.user.id;
    const sanitizedFilename = file.name
      .slice(0, file.name.lastIndexOf('.'))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const blobPath = `audio/${artistId}/${timestamp}-${sanitizedFilename}${fileExtension}`;

    // Create a ReadableStream from the file
    const stream = file.stream();
    const reader = stream.getReader();
    let uploadedBytes = 0;
    const totalBytes = file.size;

    // Create a new ReadableStream to track progress
    const progressStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            uploadedBytes += value.length;
            const progress = Math.round((uploadedBytes / totalBytes) * 100);
            // Send progress updates to the client
            controller.enqueue(value);
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    const blob = await put(blobPath, progressStream, {
      access: 'public',
      token,
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}