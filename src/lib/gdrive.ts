// src/lib/gdrive.ts
// Google Drive integration helper for Project J

export interface GoogleDriveFolder {
  name: string;
  id: string;
  children?: string[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  parentFolderId: string;
  webViewLink: string;
  previewUrl: string;
  content?: string; // For mock files
  createdAt: string;
}

const MOCK_FOLDERS: Record<string, string> = {
  'Project-J': 'folder-root',
  'Artworks': 'folder-artworks',
  'Comics': 'folder-comics',
  'Characters': 'folder-characters',
  'Stories': 'folder-stories',
  'Worldbuilding': 'folder-worldbuilding',
  'Strategy-Lab': 'folder-strategy',
  'Mystery-Lab': 'folder-mystery',
  'SciFi-Lab': 'folder-scifi',
  'Timeline': 'folder-timeline',
  'Private': 'folder-private',
  'Public': 'folder-public',
  'Blog': 'folder-blog',
};

class GoogleDriveService {
  constructor() {
    this.cleanupLocalStorage();
  }

  private cleanupLocalStorage() {
    if (!this.isBrowser()) return;
    try {
      const key = 'project_j_gdrive_files';
      const stored = localStorage.getItem(key);
      if (stored) {
        const files = JSON.parse(stored);
        let changed = false;
        const cleaned = files.map((f: any) => {
          if (f.content) {
            delete f.content;
            changed = true;
          }
          return f;
        });
        if (changed) {
          localStorage.setItem(key, JSON.stringify(cleaned));
          console.log('Cleaned up large base64 image data from project_j_gdrive_files in localStorage.');
        }
      }
    } catch (e) {
      console.warn('Failed to clean up localStorage gdrive files:', e);
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Check if real Google Drive environment is configured
  private isConfigured(): boolean {
    return !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
    );
  }

  // Initialize Folder Structure
  public async initFolderStructure(): Promise<void> {
    if (this.isConfigured()) {
      // Real API initialization would run server-side
      console.log('Connecting to Google Drive and ensuring directory structure...');
    } else {
      console.log('Google Drive API credentials not configured. Running in Mock Mode.');
      if (this.isBrowser()) {
        localStorage.setItem('project_j_gdrive_folders', JSON.stringify(MOCK_FOLDERS));
      }
    }
  }

  // Upload artwork/documents
  public async uploadFile(
    file: { name: string; type: string; contentBase64?: string },
    folderName: keyof typeof MOCK_FOLDERS | string
  ): Promise<{ drive_file_id: string; drive_preview_url: string; drive_web_link: string }> {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file, folderName }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Sync local file list if stored in localStorage for general query consistency
      if (this.isBrowser()) {
        const fileId = data.drive_file_id;
        const parentFolderId = MOCK_FOLDERS[folderName] || 'folder-private';
        const newFile: GoogleDriveFile = {
          id: fileId,
          name: file.name,
          mimeType: file.type,
          parentFolderId,
          webViewLink: data.drive_web_link,
          previewUrl: data.drive_preview_url,
          createdAt: new Date().toISOString(),
        };

        const stored = localStorage.getItem('project_j_gdrive_files');
        const files: GoogleDriveFile[] = stored ? JSON.parse(stored) : [];
        
        // Prevent duplicate
        if (!files.some(f => f.id === fileId)) {
          files.push(newFile);
          localStorage.setItem('project_j_gdrive_files', JSON.stringify(files));
        }
      }

      return {
        drive_file_id: data.drive_file_id,
        drive_preview_url: data.drive_preview_url,
        drive_web_link: data.drive_web_link,
      };

    } catch (e) {
      console.warn('Failed to upload via API route, falling back to mock upload:', e);
      
      // Fallback Mock File Upload
      const fileId = 'drive-mock-' + Math.random().toString(36).substr(2, 9);
      const parentFolderId = MOCK_FOLDERS[folderName] || 'folder-private';
      
      // Generate a nice visual representation based on file type if no base64 is provided
      let previewUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop'; // Default abstract background
      
      if (file.type.startsWith('image/')) {
        // Use custom imagery if provided, or nice default creative image
        previewUrl = file.contentBase64 || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop';
      } else if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
        previewUrl = 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop'; // Pen/Paper doc feel
      }

      const newFile: GoogleDriveFile = {
        id: fileId,
        name: file.name,
        mimeType: file.type,
        parentFolderId,
        webViewLink: `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`,
        previewUrl,
        createdAt: new Date().toISOString(),
      };

      if (this.isBrowser()) {
        const stored = localStorage.getItem('project_j_gdrive_files');
        const files: GoogleDriveFile[] = stored ? JSON.parse(stored) : [];
        files.push(newFile);
        localStorage.setItem('project_j_gdrive_files', JSON.stringify(files));
      }

      return {
        drive_file_id: fileId,
        drive_preview_url: previewUrl,
        drive_web_link: newFile.webViewLink,
      };
    }
  }

  // Get files in folder
  public async getFilesInFolder(folderName: string): Promise<GoogleDriveFile[]> {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem('project_j_gdrive_files');
    const files: GoogleDriveFile[] = stored ? JSON.parse(stored) : [];
    const parentFolderId = MOCK_FOLDERS[folderName];
    return files.filter(f => f.parentFolderId === parentFolderId);
  }
}

export const gdrive = new GoogleDriveService();
