import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

export interface FileUpload {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
  uploadedAt: Date;
  category: 'profile_photo' | 'document' | 'attachment' | 'call_recording';
  metadata?: Record<string, any>;
}

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  category: FileUpload['category'];
  userId: string;
  metadata?: Record<string, any>;
}

export class FileStorageService {
  private static instance: FileStorageService;
  private uploadDir: string;
  private maxFileSize = 10 * 1024 * 1024; // 10MB default
  
  private constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirectories();
  }

  static getInstance(): FileStorageService {
    if (!FileStorageService.instance) {
      FileStorageService.instance = new FileStorageService();
    }
    return FileStorageService.instance;
  }

  private async ensureUploadDirectories(): Promise<void> {
    const directories = [
      this.uploadDir,
      path.join(this.uploadDir, 'profile_photos'),
      path.join(this.uploadDir, 'documents'),
      path.join(this.uploadDir, 'attachments'),
      path.join(this.uploadDir, 'call_recordings'),
    ];

    for (const dir of directories) {
      try {
        await stat(dir);
      } catch (error) {
        await mkdir(dir, { recursive: true });
      }
    }
  }

  private generateFileId(): string {
    return crypto.randomUUID();
  }

  private generateFileName(originalName: string, fileId: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    return `${fileId}_${timestamp}${ext}`;
  }

  private getFilePath(category: FileUpload['category'], fileName: string): string {
    return path.join(this.uploadDir, category === 'profile_photo' ? 'profile_photos' : `${category}s`, fileName);
  }

  private validateFile(buffer: Buffer, mimeType: string, options: FileUploadOptions): void {
    // Size validation
    const maxSize = options.maxSize || this.maxFileSize;
    if (buffer.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }

    // MIME type validation
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    // Category-specific validations
    switch (options.category) {
      case 'profile_photo':
        const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!imageTypes.includes(mimeType)) {
          throw new Error('Profile photos must be JPEG, PNG, WebP, or GIF format');
        }
        if (buffer.length > 5 * 1024 * 1024) { // 5MB for images
          throw new Error('Profile photos cannot exceed 5MB');
        }
        break;

      case 'document':
        const docTypes = ['application/pdf', 'text/plain', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!docTypes.includes(mimeType)) {
          throw new Error('Documents must be PDF, TXT, DOC, or DOCX format');
        }
        break;

      case 'call_recording':
        const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm'];
        if (!audioTypes.includes(mimeType)) {
          throw new Error('Call recordings must be in audio format (MP3, WAV, WebM)');
        }
        break;
    }
  }

  async uploadFile(
    buffer: Buffer, 
    originalName: string, 
    mimeType: string, 
    options: FileUploadOptions
  ): Promise<FileUpload> {
    // Validate file
    this.validateFile(buffer, mimeType, options);

    // Generate unique identifiers
    const fileId = this.generateFileId();
    const fileName = this.generateFileName(originalName, fileId);
    const filePath = this.getFilePath(options.category, fileName);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Create file record
    const fileUpload: FileUpload = {
      id: fileId,
      originalName,
      fileName,
      mimeType,
      size: buffer.length,
      path: filePath,
      uploadedBy: options.userId,
      uploadedAt: new Date(),
      category: options.category,
      metadata: options.metadata || {}
    };

    return fileUpload;
  }

  async getFile(fileId: string): Promise<{ buffer: Buffer; fileInfo: FileUpload } | null> {
    // In a real implementation, this would query the database for file info
    // For now, we'll return null as this would need database integration
    return null;
  }

  async deleteFile(fileId: string): Promise<void> {
    // In a real implementation, this would:
    // 1. Query database for file path
    // 2. Delete file from disk
    // 3. Remove database record
    
    // For now, we'll implement the file deletion logic
    try {
      // This would get the file path from database
      // await unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  async getFileUrl(fileId: string): Promise<string | null> {
    // Return a URL that can be used to access the file
    // This would typically be served through an Express route
    return `/api/files/${fileId}`;
  }

  // Utility methods for specific file types
  async uploadProfilePhoto(buffer: Buffer, originalName: string, mimeType: string, userId: string): Promise<FileUpload> {
    return this.uploadFile(buffer, originalName, mimeType, {
      category: 'profile_photo',
      userId,
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    });
  }

  async uploadDocument(buffer: Buffer, originalName: string, mimeType: string, userId: string, metadata?: Record<string, any>): Promise<FileUpload> {
    return this.uploadFile(buffer, originalName, mimeType, {
      category: 'document',
      userId,
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedMimeTypes: [
        'application/pdf', 
        'text/plain', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      metadata
    });
  }

  async uploadCallRecording(buffer: Buffer, originalName: string, mimeType: string, userId: string, callId: number): Promise<FileUpload> {
    return this.uploadFile(buffer, originalName, mimeType, {
      category: 'call_recording',
      userId,
      maxSize: 50 * 1024 * 1024, // 50MB for audio files
      allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm'],
      metadata: { callId }
    });
  }

  // Helper method to process base64 uploads (common in web apps)
  async uploadFromBase64(
    base64Data: string, 
    originalName: string, 
    mimeType: string, 
    options: FileUploadOptions
  ): Promise<FileUpload> {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');
    
    return this.uploadFile(buffer, originalName, mimeType, options);
  }

  // Method to get file statistics
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byCategory: Record<string, { count: number; size: number }>;
  }> {
    // This would query the database for file statistics
    // For now, return mock data structure
    return {
      totalFiles: 0,
      totalSize: 0,
      byCategory: {
        profile_photo: { count: 0, size: 0 },
        document: { count: 0, size: 0 },
        attachment: { count: 0, size: 0 },
        call_recording: { count: 0, size: 0 }
      }
    };
  }

  // Method to clean up old files
  async cleanupOldFiles(olderThanDays: number = 30): Promise<number> {
    // This would:
    // 1. Query database for files older than specified days
    // 2. Delete files from disk
    // 3. Remove database records
    // 4. Return count of deleted files
    
    return 0; // Placeholder
  }
}

export const fileStorageService = FileStorageService.getInstance();