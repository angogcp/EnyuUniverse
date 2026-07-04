// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Lazily import googleapis on demand to keep startup fast
let google: any = null;
try {
  google = require('googleapis').google;
} catch (e) {
  console.warn('googleapis is not available yet.');
}

async function findOrCreateFolder(drive: any, name: string, parentId?: string): Promise<string> {
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${name}' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const list = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (list.data.files && list.data.files.length > 0) {
    return list.data.files[0].id;
  }

  const fileMetadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : undefined,
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return folder.data.id;
}
const FOLDER_PATH_MAP: Record<string, string[]> = {
  'Artworks': ['1-创作馆', '手绘图纸'],
  'Comics': ['1-创作馆', '连载漫画'],
  'Comics-Lab': ['1-创作馆', '连载漫画'],
  'Stories': ['1-创作馆', '小说故事'],
  'Worldbuilding': ['2-实验室设定', '世界观设定'],
  'Strategy-Lab': ['2-实验室设定', '战略实验室'],
  'Mystery-Lab': ['2-实验室设定', '推理工坊'],
  'SciFi-Lab': ['2-实验室设定', '科幻实验室'],
};

async function resolvePath(drive: any, pathParts: string[], rootId?: string): Promise<string> {
  let currentParentId = rootId;
  for (const part of pathParts) {
    currentParentId = await findOrCreateFolder(drive, part, currentParentId);
  }
  return currentParentId || 'root';
}

export async function POST(request: Request) {
  try {
    const { file, folderName } = await request.json();

    if (!file || !file.name) {
      return NextResponse.json({ error: 'Missing file details' }, { status: 400 });
    }

    const { name, type, contentBase64 } = file;
    const sanitizedFolderName = (folderName || 'General').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const sanitizedFileName = name.replace(/[^a-zA-Z0-9_\.\-]/g, '_');

    // 1. Decode content base64 or text
    let fileBuffer: Buffer;
    if (contentBase64 && contentBase64.includes(';base64,')) {
      const base64Data = contentBase64.split(';base64,').pop() || '';
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else if (contentBase64) {
      fileBuffer = Buffer.from(contentBase64, 'utf8');
    } else {
      if (type && type.startsWith('image/')) {
        const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        fileBuffer = Buffer.from(transparentPngBase64, 'base64');
      } else {
        fileBuffer = Buffer.from('', 'utf8');
      }
    }

    // 2. Detect Google Drive Credentials
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

    // OAuth2 credentials
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    const useOAuth2 = google && clientId && clientSecret && refreshToken;
    const useServiceAccount = google && serviceAccountEmail && privateKey;
    const useGDrive = useOAuth2 || useServiceAccount;

    if (useGDrive) {
      console.log(`Uploading ${sanitizedFileName} to Google Drive under ${sanitizedFolderName}...`);
      
      let auth;
      if (useOAuth2) {
        auth = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3000/api/auth/callback');
        auth.setCredentials({ refresh_token: refreshToken });
      } else {
        const formattedPrivateKey = privateKey!.replace(/\\n/g, '\n');
        auth = new google.auth.JWT(
          serviceAccountEmail,
          null,
          formattedPrivateKey,
          ['https://www.googleapis.com/auth/drive']
        );
      }

      const drive = google.drive({ version: 'v3', auth });

      // Resolve subfolder ID
      let subfolderId = parentFolderId || undefined;
      if (folderName === 'Blog') {
        subfolderId = '1WYBpYRPthK6IZ-oFQCebVi7sP-6Z0wOG';
      } else {
        const pathParts = FOLDER_PATH_MAP[folderName] || [sanitizedFolderName || 'General'];
        subfolderId = await resolvePath(drive, pathParts, parentFolderId || undefined);
      }

      // Convert buffer to stream
      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null);

      const fileMetadata = {
        name: sanitizedFileName,
        parents: subfolderId ? [subfolderId] : undefined,
      };

      const media = {
        mimeType: type || 'application/octet-stream',
        body: bufferStream,
      };

      const uploadedFile = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      const driveFileId = uploadedFile.data.id;
      const driveWebLink = uploadedFile.data.webViewLink;

      // Make the file publicly viewable so preview thumbnails render correctly
      try {
        await drive.permissions.create({
          fileId: driveFileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (permissionError) {
        console.warn('Failed to set public view permission on Drive file:', permissionError);
      }

      // Generate a highly reliable 1000px width thumbnail URL
      const drivePreviewUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`;

      return NextResponse.json({
        drive_file_id: driveFileId,
        drive_preview_url: drivePreviewUrl,
        drive_web_link: driveWebLink,
        isMock: false
      });
    } else {
      // 3. Fallback: Save file locally under public/uploads/<folderName>/<fileName>
      console.log(`Google Drive credentials not configured. Saving ${sanitizedFileName} locally...`);

      const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolderName);
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }

      const filePath = path.join(publicUploadsDir, sanitizedFileName);
      fs.writeFileSync(filePath, fileBuffer);

      const relativeUrl = `/uploads/${sanitizedFolderName}/${sanitizedFileName}`;
      const mockFileId = `local-file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      return NextResponse.json({
        drive_file_id: mockFileId,
        drive_preview_url: relativeUrl,
        drive_web_link: relativeUrl,
        isMock: true
      });
    }

  } catch (error: any) {
    console.error('File upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload file: ' + error.message },
      { status: 500 }
    );
  }
}
