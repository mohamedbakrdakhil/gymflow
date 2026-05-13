/**
 * Configuration Multer pour les uploads de fichiers (avatars, logos, photos membres)
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function storageFor(subdir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), env.UPLOAD.DIR, subdir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      cb(null, name);
    },
  });
}

const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Format image non supporté'));
};

const maxSize = env.UPLOAD.MAX_FILE_SIZE_MB * 1024 * 1024;

const uploadAvatar = multer({
  storage: storageFor('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
});

const uploadLogo = multer({
  storage: storageFor('logos'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
});

const uploadMemberPhoto = multer({
  storage: storageFor('members'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
});

module.exports = { uploadAvatar, uploadLogo, uploadMemberPhoto };
