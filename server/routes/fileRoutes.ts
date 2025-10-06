import type { Express } from "express";
import multer from "multer";
import { fileStorageService } from "../services/fileStorageService";
import { isAuthenticated, requireRole } from "../middleware/auth";
import { apiRateLimit } from "../middleware/security";
import { storage } from "../storage";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Basic file type validation - more specific validation in service
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
      "audio/webm",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

export function registerFileRoutes(app: Express) {
  // Upload profile photo
  app.post(
    "/api/files/upload/profile-photo",
    apiRateLimit,
    isAuthenticated,
    upload.single("photo"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file provided" });
        }

        const userId = req.user!.id;

        const fileUpload = await fileStorageService.uploadProfilePhoto(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          userId,
        );

        // Update user profile with new photo URL
        const user = await storage.getUser(userId);
        if (user) {
          await storage.upsertUser({
            ...user,
            profileImageUrl: `/api/files/${fileUpload.id}`,
          });
        }

        res.json({
          message: "Profile photo uploaded successfully",
          file: {
            id: fileUpload.id,
            url: `/api/files/${fileUpload.id}`,
            originalName: fileUpload.originalName,
            size: fileUpload.size,
          },
        });
      } catch (error) {
        console.error("Error uploading profile photo:", error);
        res.status(500).json({
          message:
            error instanceof Error
              ? error.message
              : "Failed to upload profile photo",
        });
      }
    },
  );

  // Upload document
  app.post(
    "/api/files/upload/document",
    apiRateLimit,
    isAuthenticated,
    upload.single("document"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file provided" });
        }

        const userId = req.user!.id;

        const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

        const fileUpload = await fileStorageService.uploadDocument(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          userId,
          metadata,
        );

        res.json({
          message: "Document uploaded successfully",
          file: {
            id: fileUpload.id,
            url: `/api/files/${fileUpload.id}`,
            originalName: fileUpload.originalName,
            size: fileUpload.size,
            metadata: fileUpload.metadata,
          },
        });
      } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({
          message:
            error instanceof Error
              ? error.message
              : "Failed to upload document",
        });
      }
    },
  );

  // Upload multiple attachments
  app.post(
    "/api/files/upload/attachments",
    apiRateLimit,
    isAuthenticated,
    upload.array("attachments", 5),
    async (req: any, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: "No files provided" });
        }

        const userId = req.user!.id;

        const uploadPromises = req.files.map(async (file: any) => {
          return fileStorageService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            {
              category: "attachment",
              userId,
              maxSize: 20 * 1024 * 1024, // 20MB
            },
          );
        });

        const uploads = await Promise.all(uploadPromises);

        res.json({
          message: `${uploads.length} files uploaded successfully`,
          files: uploads.map((upload) => ({
            id: upload.id,
            url: `/api/files/${upload.id}`,
            originalName: upload.originalName,
            size: upload.size,
          })),
        });
      } catch (error) {
        console.error("Error uploading attachments:", error);
        res.status(500).json({
          message:
            error instanceof Error
              ? error.message
              : "Failed to upload attachments",
        });
      }
    },
  );

  // Get file by ID
  app.get("/api/files/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;

      const fileData = await fileStorageService.getFile(fileId);
      if (!fileData) {
        return res.status(404).json({ message: "File not found" });
      }

      res.set({
        "Content-Type": fileData.fileInfo.mimeType,
        "Content-Length": fileData.fileInfo.size.toString(),
        "Content-Disposition": `inline; filename="${fileData.fileInfo.originalName}"`,
      });

      res.send(fileData.buffer);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Delete file
  app.delete(
    "/api/files/:fileId",
    apiRateLimit,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { fileId } = req.params;

        // In a real implementation, check if user owns the file or has permission
        await fileStorageService.deleteFile(fileId);

        res.json({ message: "File deleted successfully" });
      } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ message: "Failed to delete file" });
      }
    },
  );

  // Get storage statistics (admin only)
  app.get(
    "/api/files/admin/stats",
    apiRateLimit,
    isAuthenticated,
    requireRole(["administrator"]),
    async (req: any, res) => {
      try {
        const stats = await fileStorageService.getStorageStats();
        res.json(stats);
      } catch (error) {
        console.error("Error getting storage stats:", error);
        res.status(500).json({ message: "Failed to get storage statistics" });
      }
    },
  );

  // Cleanup old files (admin only)
  app.post(
    "/api/files/admin/cleanup",
    apiRateLimit,
    isAuthenticated,
    requireRole(["administrator"]),
    async (req: any, res) => {
      try {
        const { olderThanDays } = req.body;
        const deletedCount = await fileStorageService.cleanupOldFiles(
          olderThanDays || 30,
        );

        res.json({
          message: `Cleanup completed. ${deletedCount} files deleted.`,
          deletedCount,
        });
      } catch (error) {
        console.error("Error during cleanup:", error);
        res.status(500).json({ message: "Failed to cleanup files" });
      }
    },
  );
}
