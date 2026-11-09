import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.memoryStorage();

// Allowed file types for documents: PDF, DOCX, PNG, JPG only
const DOCUMENT_ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'];
const DOCUMENT_ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isExtAllowed = DOCUMENT_ALLOWED_EXTENSIONS.includes(ext);
  const isMimeAllowed = DOCUMENT_ALLOWED_MIMETYPES.includes(file.mimetype);

  if (isExtAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    const error: any = new Error(
      `Only PDF, DOCX, PNG, and JPG files are allowed`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

// Allowed file types for avatars: PNG, JPG, JPEG, WEBP
const AVATAR_ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const AVATAR_ALLOWED_MIMETYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const avatarFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isExtAllowed = AVATAR_ALLOWED_EXTENSIONS.includes(ext);
  const isMimeAllowed = AVATAR_ALLOWED_MIMETYPES.includes(file.mimetype);

  if (isExtAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    const error: any = new Error(
      `Invalid avatar image type. Only PNG, JPG, JPEG, and WEBP images are allowed.`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
  },
  fileFilter: documentFileFilter,
});

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: avatarFileFilter,
});

