import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getAdminSessionFromCookies } from "@/utils/auth";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "menu-items");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-original-name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `menu-item-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Disable Next.js body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

interface MulterRequest extends NextApiRequest {
  file?: Express.Multer.File;
}

export default async function handler(req: MulterRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin authentication
    const cookies = req.headers.cookie || "";
    const adminSession = getAdminSessionFromCookies(cookies);
    
    if (!adminSession) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Handle file upload
    await new Promise<void>((resolve, reject) => {
      upload.single('image')(req as any, res as any, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the file URL
    const imageUrl = `/uploads/menu-items/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });

  } catch (error) {
    console.error('Image upload error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('File too large')) {
        return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
      }
      if (error.message.includes('Only JPEG')) {
        return res.status(400).json({ error: 'Invalid file type. Only JPEG, JPG, PNG, and WebP images are allowed.' });
      }
    }
    
    res.status(500).json({ error: 'Failed to upload image' });
  }
} 