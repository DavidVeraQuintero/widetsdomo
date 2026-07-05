import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { addImage, removeImage, getImages } from './db.js';
import { broadcast } from './broadcast.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.post('/images', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const filename = req.file.filename;
  await addImage(id, filename);
  const payload = { type: 'IMAGE_ADDED', id, filename, ts: Date.now() };
  broadcast(payload, null);
  res.json({ id, filename });
});

router.delete('/images/:id', async (req, res) => {
  const { id } = req.params;
  const images = await getImages();
  const img = images.find(i => i.id === id);
  if (img) {
    const filePath = path.join(UPLOADS_DIR, img.filename);
    fs.unlink(filePath, () => {});
    await removeImage(id);
    broadcast({ type: 'IMAGE_REMOVED', id, ts: Date.now() }, null);
  }
  res.json({ ok: true });
});

export default router;
