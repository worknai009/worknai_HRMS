// Backend/utils/fileSecurity.js
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

function ensureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (e) {
    // Only ignore "already exists"
    if (e && e.code !== 'EEXIST') throw e;
  }
}

/**
 * Resolve under uploads root + prevent traversal.
 * NOTE: This is purely path-based. Use safeRealpathUnderUploads() for downloads.
 */
function safeResolveUnderUploads(relativeUnderUploads) {
  if (!relativeUnderUploads || typeof relativeUnderUploads !== 'string') {
    throw new Error('Invalid path');
  }

  let rel = relativeUnderUploads.replace(/^uploads[\\/]/, '');
  rel = rel.replace(/^(\.\.[\\/])+/, '');
  rel = rel.replace(/^[/\\]+/, '');

  const full = path.resolve(UPLOADS_ROOT, rel);

  const rootWithSep = UPLOADS_ROOT.endsWith(path.sep) ? UPLOADS_ROOT : UPLOADS_ROOT + path.sep;
  const fullWithSep = full.endsWith(path.sep) ? full : full + path.sep;

  if (!fullWithSep.startsWith(rootWithSep)) {
    throw new Error('Path traversal blocked');
  }

  return full;
}

/**
 * Stronger: blocks symlink escapes (use for downloads/reads).
 * Requires file/target path to exist.
 */
async function safeRealpathUnderUploads(relativeUnderUploads) {
  const full = safeResolveUnderUploads(relativeUnderUploads);

  // realpath resolves symlinks
  const [realRoot, realFull] = await Promise.all([
    fsp.realpath(UPLOADS_ROOT),
    fsp.realpath(full)
  ]);

  const rootWithSep = realRoot.endsWith(path.sep) ? realRoot : realRoot + path.sep;
  const fullWithSep = realFull.endsWith(path.sep) ? realFull : realFull + path.sep;

  if (!fullWithSep.startsWith(rootWithSep)) {
    throw new Error('Symlink escape blocked');
  }

  return realFull;
}

async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);
  return await new Promise((resolve, reject) => {
    stream.on('data', (d) => hash.update(d));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function detectMagic(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);

    if (buf.slice(0, 5).toString('ascii') === '%PDF-') return 'pdf';

    const pk = buf.slice(0, 4).toString('binary');
    if (pk === 'PK\u0003\u0004' || pk === 'PK\u0005\u0006' || pk === 'PK\u0007\u0008') return 'zip';

    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';

    if (
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
      buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
    ) return 'png';

    if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') {
      return 'webp';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Safe random filename with allowlisted ext
 */
function safeFilename(originalname, allowedExt = null) {
  const ext = path.extname(String(originalname || '')).toLowerCase();
  if (Array.isArray(allowedExt) && allowedExt.length) {
    if (!allowedExt.includes(ext)) throw new Error('File type not allowed');
  }
  return `${crypto.randomUUID()}${ext}`;
}

async function safeUnlink(filePath) {
  try {
    await fsp.unlink(filePath);
  } catch {}
}

module.exports = {
  UPLOADS_ROOT,
  ensureDir,
  safeResolveUnderUploads,
  safeRealpathUnderUploads,
  sha256File,
  detectMagic,
  safeFilename,
  safeUnlink
};
