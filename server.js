const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { google } = require('googleapis');
const multer = require('multer');
const upload = multer({ dest: os.tmpdir() });

// Inisialisasi Google Drive API via Service Account Key (gdrive-key.json)
let driveClient = null;
try {
    const keyPath = path.join(__dirname, 'gdrive-key.json');
    if (fs.existsSync(keyPath)) {
        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        driveClient = google.drive({ version: 'v3', auth });
        console.log('✅ Google Drive API initialized with Service Account!');
    }
} catch (e) {
    console.error('⚠️ Google Drive API Auth Error:', e.message);
}

const app = express();
const PORT = 3000;

const LOCAL_DIRS = [
    'D:\\HP',
    'D:\\Keluarga Besar Cirea', 
    'D:\\Wisuda Teh Vivi', 
    'D:\\Jogja Adat'
];
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ekstensi file yang didukung
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.heic', '.heif'];
const VIDEO_EXTS = ['.mp4', '.webm', '.ogg', '.mov', '.mkv', '.avi'];
const DOC_EXTS = ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.csv'];

// Pastikan folder lokal ada
LOCAL_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) {
        try { fs.mkdirSync(dir, { recursive: true }); } catch(e) {}
    }
});

// Serve file statis aplikasi
app.use(express.static(__dirname));

// Serve file media lokal via legacy /photos path
app.use('/photos', express.static(LOCAL_DIRS[0]));

// Endpoint streaming file media lokal dengan HTTP Cache
app.get('/media-file', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('File tidak ditemukan');
    }

    try {
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const ext = filePath.toLowerCase();
            const ct = ext.endsWith('.mov') || ext.endsWith('.mp4') ? 'video/mp4' : 'video/webm';
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': ct,
                'Cache-Control': 'public, max-age=86400',
            });
            file.pipe(res);
        } else {
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.sendFile(path.resolve(filePath));
        }
    } catch (e) {
        res.sendFile(path.resolve(filePath));
    }
});

// ⚡ Thumbnail endpoint — resize gambar ke 400px lebar, cache ke disk
// Format: /thumbnail?path=D:\FOTO\...&w=400
const sharp = require('sharp');
const THUMB_CACHE_DIR = path.join(os.tmpdir(), 'omnigallery-thumbs-v2');
if (!fs.existsSync(THUMB_CACHE_DIR)) fs.mkdirSync(THUMB_CACHE_DIR, { recursive: true });

app.get('/thumbnail', async (req, res) => {
    const filePath = req.query.path;
    const width = parseInt(req.query.w || '400', 10);

    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('File tidak ditemukan');
    }

    const hash = require('crypto').createHash('md5').update(filePath + width).digest('hex');
    const cachePath = path.join(THUMB_CACHE_DIR, `${hash}.webp`);

    // Cache hit → langsung kirim (sangat cepat!)
    if (fs.existsSync(cachePath)) {
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 hari
        return fs.createReadStream(cachePath).pipe(res);
    }

    try {
        const ext = filePath.toLowerCase();
        const isImage = ['.jpg','.jpeg','.png','.gif','.webp','.bmp','.heic','.heif'].some(e => ext.endsWith(e));

        if (isImage) {
            // Auto-rotate sesuai orientasi EXIF kamera + Resize & konversi ke WebP
            await sharp(filePath)
                .rotate()
                .resize(width, null, { withoutEnlargement: true })
                .webp({ quality: 75 })
                .toFile(cachePath);

            res.setHeader('Content-Type', 'image/webp');
            res.setHeader('Cache-Control', 'public, max-age=604800');
            fs.createReadStream(cachePath).pipe(res);
        } else {
            // Bukan gambar (video), kembalikan langsung
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.sendFile(path.resolve(filePath));
        }
    } catch (err) {
        console.error('[Thumbnail Error]', err.message);
        // Fallback: kirim file asli
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.sendFile(path.resolve(filePath));
    }
});

// ⚡ Video thumbnail — ambil frame pertama via FFmpeg, cache ke disk
app.get('/video-thumb', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).send('Not found');

    const hash = require('crypto').createHash('md5').update(filePath).digest('hex');
    const cachePath = path.join(THUMB_CACHE_DIR, `vid_${hash}.jpg`);

    if (fs.existsSync(cachePath)) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=604800');
        return fs.createReadStream(cachePath).pipe(res);
    }

    const ff = spawn(FFMPEG_CMD, [
        '-ss', '0.5',
        '-i', filePath,
        '-vframes', '1',
        '-vf', 'scale=400:-1',
        '-f', 'image2',
        '-vcodec', 'mjpeg',
        'pipe:1'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    const chunks = [];
    ff.stdout.on('data', c => chunks.push(c));
    ff.on('close', (code) => {
        if (code === 0 && chunks.length > 0) {
            const buf = Buffer.concat(chunks);
            fs.writeFileSync(cachePath, buf);
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=604800');
            res.end(buf);
        } else {
            res.status(500).send('Thumbnail failed');
        }
    });
    ff.on('error', () => res.status(500).send('FFmpeg error'));
});


// Endpoint Proxy Gambar & Media Google Drive (Bypass Referrer & Cross-Origin Restriction)
app.get('/gdrive-media', (req, res) => {
    const fileId = req.query.id;
    if (!fileId) return res.status(400).send('Missing file ID');

    const primaryUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    https.get(primaryUrl, (remoteRes) => {
        if (remoteRes.statusCode === 200) {
            res.setHeader('Content-Type', remoteRes.headers['content-type'] || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            remoteRes.pipe(res);
        } else {
            const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            https.get(fallbackUrl, (altRes) => {
                res.setHeader('Content-Type', altRes.headers['content-type'] || 'image/jpeg');
                altRes.pipe(res);
            }).on('error', () => res.status(404).send('Gambar tidak ditemukan'));
        }
    }).on('error', () => res.status(500).send('Gagal mengunduh media'));
});

// Endpoint Proxy Video Google Drive (Bypass Referrer & Cross-Origin Restriction with Range Support)
app.get('/gdrive-video', (req, res) => {
    const fileId = req.query.id;
    if (!fileId) return res.status(400).send('Missing file ID');

    const primaryUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    
    // Teruskan header Range dari browser client ke Google
    const headers = {};
    if (req.headers.range) {
        headers['Range'] = req.headers.range;
    }

    https.get(primaryUrl, { headers }, (remoteRes) => {
        // Cek jika Google mengembalikan 200 OK atau 206 Partial Content
        if (remoteRes.statusCode === 200 || remoteRes.statusCode === 206) {
            // Copy semua header penting dari Google ke response kita
            const proxyHeaders = { ...remoteRes.headers };
            // Paksa tipe konten ke video agar browser tahu ini bisa diputar
            proxyHeaders['content-type'] = proxyHeaders['content-type'] || 'video/mp4';
            
            res.writeHead(remoteRes.statusCode, proxyHeaders);
            remoteRes.pipe(res);
        } else {
            // Jika lh3 gagal, coba uc?export=download tanpa range (fallback lambat)
            const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            https.get(fallbackUrl, { headers }, (altRes) => {
                const altHeaders = { ...altRes.headers };
                altHeaders['content-type'] = altHeaders['content-type'] || 'video/mp4';
                res.writeHead(altRes.statusCode, altHeaders);
                altRes.pipe(res);
            }).on('error', () => res.status(404).send('Video tidak ditemukan'));
        }
    }).on('error', () => res.status(500).send('Gagal memuat video'));
});

// Real-time Video Transcoding dengan DISK CACHE (MOV/HEVC → H.264 MP4)
const { spawn } = require('child_process');
const crypto = require('crypto');

// Cache folder — simpan hasil transcode agar next open langsung putar
const CACHE_DIR = path.join(os.tmpdir(), 'omnigallery-cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// Cari FFmpeg
const FFMPEG_CMD = [
    'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0-full_build\\bin\\ffmpeg.exe',
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'ffmpeg'
].find(p => { try { return fs.existsSync(p) || p === 'ffmpeg'; } catch(e) { return false; } }) || 'ffmpeg';

// Track ongoing transcoding jobs (avoid duplicate jobs for same file)
const transcodingJobs = {};

function getCachePath(filePath) {
    const hash = crypto.createHash('md5').update(filePath).digest('hex');
    return path.join(CACHE_DIR, `${hash}.mp4`);
}

function streamFileWithRange(filePath, req, res) {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Content-Length': chunkSize,
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
        res.writeHead(200, { 'Content-Length': fileSize });
        fs.createReadStream(filePath).pipe(res);
    }
}

app.get('/transcode-video', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('File tidak ditemukan');
    }

    const cachePath = getCachePath(filePath);

    // ✅ Cache HIT — langsung stream dari file cache (instant playback!)
    if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 10000) {
        console.log('[Cache HIT] Streaming from cache:', cachePath);
        return streamFileWithRange(cachePath, req, res);
    }

    // ✅ Sudah ada job yang sedang transcoding — tunggu selesai lalu stream
    if (transcodingJobs[filePath]) {
        console.log('[Cache PENDING] Waiting for ongoing transcoding...');
        transcodingJobs[filePath].once('done', () => {
            if (fs.existsSync(cachePath)) streamFileWithRange(cachePath, req, res);
            else res.status(500).send('Transcoding gagal');
        });
        return;
    }

    // ✅ Cache MISS — transcode sekarang, simpan ke cache DAN stream ke browser
    console.log('[Cache MISS] Transcoding:', filePath);
    const { EventEmitter } = require('events');
    const emitter = new EventEmitter();
    transcodingJobs[filePath] = emitter;

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    const cacheWriteStream = fs.createWriteStream(cachePath);

    const ffmpeg = spawn(FFMPEG_CMD, [
        '-i', filePath,
        '-c:v', 'libx264',
        '-preset', 'ultrafast', // Kembali ke super cepat
        '-crf', '23',           // Kualitas standar yang optimal
        '-c:a', 'aac',
        '-b:a', '128k',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        '-f', 'mp4',
        'pipe:1'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    // Stream ke browser DAN simpan ke cache secara bersamaan
    ffmpeg.stdout.on('data', (chunk) => {
        res.write(chunk);
        cacheWriteStream.write(chunk);
    });

    ffmpeg.stderr.on('data', (d) => {
        const line = d.toString().trim();
        if (line.includes('frame=') || line.includes('Error') || line.includes('error')) {
            console.log('[FFmpeg]', line);
        }
    });

    ffmpeg.on('close', (code) => {
        cacheWriteStream.end();
        delete transcodingJobs[filePath];
        if (code === 0) {
            console.log('[Cache SAVED]', cachePath);
            emitter.emit('done');
        } else {
            // Hapus cache file yang mungkin corrupt
            try { fs.unlinkSync(cachePath); } catch(e) {}
            emitter.emit('done');
        }
        res.end();
    });

    ffmpeg.on('error', (err) => {
        console.error('[FFmpeg Error]', err.message);
        cacheWriteStream.end();
        try { fs.unlinkSync(cachePath); } catch(e) {}
        delete transcodingJobs[filePath];
        if (!res.headersSent) res.status(500).json({ error: 'FFmpeg error: ' + err.message });
        else res.end();
    });

    req.on('close', () => {
        // Client disconnect: biarkan FFmpeg lanjut agar cache tersimpan
        // tapi jangan pipe lagi ke response yang sudah closed
        ffmpeg.stdout.unpipe(res);
    });
});

// Pre-warm cache endpoint: panggil saat hover kartu video
app.get('/prewarm-video', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) return res.json({ status: 'skip' });

    const cachePath = getCachePath(filePath);
    if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 10000) {
        return res.json({ status: 'cached' });
    }
    if (transcodingJobs[filePath]) {
        return res.json({ status: 'transcoding' });
    }

    // Mulai transcoding di background (tidak pipe ke response)
    console.log('[Pre-warm] Starting background transcoding:', path.basename(filePath));
    const { EventEmitter } = require('events');
    const emitter = new EventEmitter();
    transcodingJobs[filePath] = emitter;
    const cacheWrite = fs.createWriteStream(cachePath);

    const ff = spawn(FFMPEG_CMD, [
        '-i', filePath, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-movflags', 'frag_keyframe+empty_moov+faststart', '-f', 'mp4', 'pipe:1'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    ff.stdout.pipe(cacheWrite);
    ff.on('close', (code) => {
        cacheWrite.end();
        delete transcodingJobs[filePath];
        emitter.emit('done');
        if (code !== 0) { try { fs.unlinkSync(cachePath); } catch(e) {} }
        else console.log('[Pre-warm Done]', path.basename(filePath));
    });
    ff.on('error', (err) => {
        cacheWrite.end();
        delete transcodingJobs[filePath];
        try { fs.unlinkSync(cachePath); } catch(e) {}
    });

    res.json({ status: 'started' });
});


app.get('/transcode-video', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('File tidak ditemukan');
    }

    // FFmpeg: gunakan path absolut karena winget PATH butuh shell restart
    const ffmpegCmd = [
        'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0-full_build\\bin\\ffmpeg.exe',
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
        'ffmpeg'
    ].find(p => {
        try { return require('fs').existsSync(p) || p === 'ffmpeg'; } catch(e) { return false; }
    }) || 'ffmpeg';

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const ffmpeg = spawn(ffmpegCmd, [
        '-i', filePath,           // Input file (MOV/HEVC)
        '-c:v', 'libx264',        // Encode video ke H.264
        '-preset', 'ultrafast',   // Kecepatan encode tercepat
        '-crf', '23',             // Kualitas (0=terbaik, 51=terburuk, 23=seimbang)
        '-c:a', 'aac',            // Audio ke AAC
        '-b:a', '128k',           // Bitrate audio
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Fix dimensi ganjil
        '-movflags', 'frag_keyframe+empty_moov+faststart', // Streaming MP4
        '-f', 'mp4',              // Output format MP4
        'pipe:1'                  // Output ke pipe (stream ke browser)
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    ffmpeg.stdout.pipe(res);

    ffmpeg.stderr.on('data', (data) => {
        console.log('[FFmpeg]', data.toString().trim());
    });

    ffmpeg.on('close', (code) => {
        if (code !== 0 && !res.headersSent) {
            res.status(500).send('Transcoding gagal');
        }
    });

    ffmpeg.on('error', (err) => {
        console.error('[FFmpeg Error]', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'FFmpeg tidak ditemukan. Install FFmpeg terlebih dahulu.' });
        }
    });

    // Jika client disconnect, matikan FFmpeg
    req.on('close', () => {
        ffmpeg.kill('SIGKILL');
    });
});

// System Persistence Accounts Data (Biar Akun yang Ditambah Nggak Hilang Waktu Restart)
function loadAccounts() {
    const defaultAccounts = [
        {
            id: 'acc-local',
            name: 'Local Storage (D:\\FOTO & D:\\HP)',
            email: 'local@laptop.storage',
            type: 'local',
            path: LOCAL_DIRS.join(', '),
            usedBytes: 0,
            totalBytes: 250 * 1024 * 1024 * 1024,
            status: 'active',
            color: 'from-blue-600 to-indigo-600'
        }
    ];

    try {
        if (fs.existsSync(ACCOUNTS_FILE)) {
            const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Gagal membaca accounts.json:", e.message);
    }
    return defaultAccounts;
}

function saveAccounts() {
    try {
        fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
    } catch (e) {
        console.error("Gagal menyimpan accounts.json:", e.message);
    }
}

let accounts = loadAccounts();

// Caching Mechanism
let cachedMediaList = null;
let cachedStats = null;
let lastScanTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache TTL

// Coba muat cache dari disk agar loading pertama kali cepat
try {
    const cachePath = path.join(__dirname, 'cache_data.json');
    if (fs.existsSync(cachePath)) {
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        if (cacheData && cacheData.mediaList) {
            cachedMediaList = cacheData.mediaList;
            cachedStats = cacheData.stats;
            lastScanTime = cacheData.lastScanTime || Date.now();
            console.log("✅ Cache berhasil dimuat dari disk! Loading akan sangat cepat.");
        }
    }
} catch(e) {}

async function getAllFilesRecursively(dirPath, maxDepth = 6, currentDepth = 0) {
    if (currentDepth > maxDepth) return [];
    let results = [];
    try {
        const list = await fs.promises.readdir(dirPath).catch(() => null);
        if (!list) return [];
        
        const CHUNK_SIZE = 100; // Baca paralel 100 file sekaligus agar cepat
        for (let i = 0; i < list.length; i += CHUNK_SIZE) {
            const chunk = list.slice(i, i + CHUNK_SIZE);
            const promises = chunk.map(async (file) => {
                const filePath = path.join(dirPath, file);
                try {
                    const stat = await fs.promises.stat(filePath).catch(() => null);
                    if (stat && stat.isDirectory()) {
                        if (!file.startsWith('.')) {
                            return await getAllFilesRecursively(filePath, maxDepth, currentDepth + 1);
                        }
                    } else if (stat && stat.isFile()) {
                        return [{ filePath, stat }];
                    }
                } catch (e) {}
                return [];
            });
            const chunkResults = await Promise.all(promises);
            for (const res of chunkResults) {
                if (res && res.length > 0) results = results.concat(res);
            }
        }
    } catch (e) {}
    return results;
}

// Fetch file otomatis dari Folder Google Drive publik (Termasuk Subfolder)
function fetchGDriveFolderFiles(folderId, accountName = 'Google Drive', depth = 0, currentSubfolder = 'Utama') {
    return new Promise((resolve) => {
        if (!folderId || depth > 3) return resolve([]);
        const url = `https://drive.google.com/drive/folders/${folderId}`;
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                const files = [];
                const subfolders = [];
                const seenIds = new Set();
                const pattern = /data-id="([a-zA-Z0-9_-]{25,45})".*?aria-label="([^"]+)"/gs;
                let match;
                while ((match = pattern.exec(data)) !== null) {
                    const fid = match[1];
                    const rawLabel = match[2];
                    if (seenIds.has(fid) || rawLabel === 'Dibagikan' || rawLabel === 'Shared') continue;
                    seenIds.add(fid);

                    const isFolder = rawLabel.toLowerCase().includes('folder');
                    const title = rawLabel.replace(/\s+(Image|Video|Document|PDF|Folder|Shared|Dibagikan).*$/i, '').trim();
                    const ext = path.extname(title).toLowerCase();

                    if (isFolder) {
                        subfolders.push({ fid, title });
                    } else {
                        let type = 'other';
                        if (IMAGE_EXTS.includes(ext) || rawLabel.toLowerCase().includes('image')) type = 'image';
                        else if (VIDEO_EXTS.includes(ext) || rawLabel.toLowerCase().includes('video')) type = 'video';
                        else if (DOC_EXTS.includes(ext) || rawLabel.toLowerCase().includes('document') || rawLabel.toLowerCase().includes('pdf')) type = 'document';

                        if (type !== 'other' || ext !== '') {
                            files.push({
                                id: fid,
                                title: title || fid,
                                type: type === 'other' ? 'image' : type,
                                ext: ext || (type === 'video' ? '.mp4' : '.jpg'),
                                size: 3.5 * 1024 * 1024,
                                sizeFormatted: 'Google Drive',
                                modified: new Date(),
                                source: 'gdrive',
                                url: `/gdrive-media?id=${fid}`,
                                downloadUrl: `https://drive.google.com/uc?export=download&id=${fid}`,
                                viewUrl: `https://drive.google.com/file/d/${fid}/view`,
                                accountId: folderId,
                                accountName: accountName,
                                subfolder: currentSubfolder
                            });
                        }
                    }
                }

                // Subfolders recursive fetch
                for (const sf of subfolders) {
                    try {
                        const subFiles = await fetchGDriveFolderFiles(sf.fid, accountName, depth + 1, sf.title);
                        files.push(...subFiles);
                    } catch (e) {}
                }

                resolve(files);
            });
        }).on('error', () => resolve([]));
    });
}

async function refreshCache() {
    const mediaList = [];
    let localUsed = 0;
    let imageCount = 0;
    let videoCount = 0;
    let docCount = 0;

    // 1. Pemindaian Folder Lokal (termasuk yang ditambahkan user)
    const localAccounts = accounts.filter(acc => acc.type === 'local' && acc.path);
    const allLocalDirs = [...new Set([...LOCAL_DIRS, ...localAccounts.map(a => a.path)])];

    for (const dir of allLocalDirs) {
        const rootDirName = path.basename(dir);
        // Cek jika akun spesifik ada untuk direktori ini
        const userAcc = localAccounts.find(a => a.path === dir);
        const accountLabel = userAcc ? userAcc.name : dir;

        const files = await getAllFilesRecursively(dir);
        files.forEach(({ filePath, stat }) => {
            localUsed += stat.size;
            const file = path.basename(filePath);
            const ext = path.extname(file).toLowerCase();
            let type = 'other';
            if (IMAGE_EXTS.includes(ext)) { type = 'image'; imageCount++; }
            else if (VIDEO_EXTS.includes(ext)) { type = 'video'; videoCount++; }
            else if (DOC_EXTS.includes(ext)) { type = 'document'; docCount++; }

            if (type !== 'other') {
                const relPath = path.relative(dir, filePath);
                const pathParts = relPath.split(path.sep);
                const subfolder = pathParts.length > 1 ? pathParts[0] : 'Utama';

                mediaList.push({
                    id: filePath,
                    title: file,
                    type: type,
                    ext: ext,
                    size: stat.size,
                    sizeFormatted: formatBytes(stat.size),
                    modified: stat.mtime || new Date(),
                    source: 'local',
                    url: `/media-file?path=${encodeURIComponent(filePath)}`,
                    accountId: userAcc ? userAcc.id : `acc-local-${rootDirName.toLowerCase().replace(/\s+/g, '')}`,
                    accountName: accountLabel,
                    subfolder: subfolder
                });
            }
        });
    }

    // 2. Pemindaian Otomatis Folder Google Drive Terhubung (Parallel)
    const sameNameGroups = {};
    accounts.forEach(acc => {
        if (!sameNameGroups[acc.name]) sameNameGroups[acc.name] = [];
        sameNameGroups[acc.name].push(acc);
    });

    const driveAccounts = accounts.filter(acc => acc.type === 'gdrive' && acc.folderId);
    const allDriveResults = [];
    const CONCURRENCY_LIMIT = 5; // Scan 5 akun sekaligus agar tidak diblokir Google

    for (let i = 0; i < driveAccounts.length; i += CONCURRENCY_LIMIT) {
        const batch = driveAccounts.slice(i, i + CONCURRENCY_LIMIT);
        const batchPromises = batch.map(async (acc) => {
            try {
                const group = sameNameGroups[acc.name] || [];
                const subfolderPrefix = group.length > 1 ? `Folder ${group.indexOf(acc) + 1}` : '';

                const driveFiles = await fetchGDriveFolderFiles(acc.folderId, acc.name);
                const processedFiles = [];
                
                driveFiles.forEach(df => {
                    if (subfolderPrefix) {
                        df.subfolder = df.subfolder && df.subfolder !== 'Utama' 
                            ? `${subfolderPrefix} (${df.subfolder})` 
                            : subfolderPrefix;
                    }
                    processedFiles.push(df);
                });
                return processedFiles;
            } catch (e) {
                console.error("Error fetching GDrive folder:", acc.name, e);
                return [];
            }
        });

        const batchResults = await Promise.all(batchPromises);
        allDriveResults.push(...batchResults);
    }
    
    allDriveResults.forEach(driveFiles => {
        driveFiles.forEach(df => {
            if (df.type === 'image') imageCount++;
            else if (df.type === 'video') videoCount++;
            else if (df.type === 'document') docCount++;
            mediaList.push(df);
        });
    });

    cachedMediaList = mediaList;
    accounts[0].usedBytes = localUsed;
    cachedStats = { localUsed, imageCount, videoCount, docCount };
    lastScanTime = Date.now();
    
    // Simpan ke disk agar restart server berikutnya sangat cepat
    try {
        const cachePath = path.join(__dirname, 'cache_data.json');
        fs.writeFileSync(cachePath, JSON.stringify({
            mediaList: cachedMediaList,
            stats: cachedStats,
            lastScanTime: lastScanTime
        }));
    } catch(e) {}

    return { mediaList: cachedMediaList, stats: cachedStats };
}

let isRefreshingCache = null;

async function getOrUpdateCache(force = false) {
    const now = Date.now();
    
    // Jika tidak force dan cache masih valid, kembalikan
    if (!force && cachedMediaList && (now - lastScanTime < CACHE_TTL_MS)) {
        return { mediaList: cachedMediaList, stats: cachedStats };
    }
    
    // Jika ada cache tetapi kadaluarsa, jalankan refresh di background tapi langsung kembalikan cache basi agar frontend tidak loading lama
    if (cachedMediaList && (!force || force)) { 
        if (!isRefreshingCache) {
            isRefreshingCache = refreshCache().finally(() => {
                isRefreshingCache = null;
            });
        }
        return { mediaList: cachedMediaList, stats: cachedStats }; // Langsung kembalikan
    }

    // Jika sama sekali tidak ada cache, terpaksa harus menunggu refresh
    if (!isRefreshingCache) {
        isRefreshingCache = refreshCache().finally(() => {
            isRefreshingCache = null;
        });
    }

    return await isRefreshingCache;
}

// Helper: Format bytes ke format human-readable
function formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// API: Daftar Akun Storage Terhubung
app.get('/api/accounts', async (req, res) => {
    await getOrUpdateCache();
    
    // Pastikan semua LOCAL_DIRS otomatis muncul di UI
    const responseAccounts = [...accounts];
    LOCAL_DIRS.forEach((dir, index) => {
        if (!responseAccounts.some(acc => acc.name === dir)) {
            responseAccounts.unshift({
                id: `acc-local-auto-${index}`,
                name: dir,
                email: 'local@laptop.storage',
                type: 'local',
                path: dir,
                usedBytes: 0,
                totalBytes: 0,
                status: 'active',
                color: 'from-blue-600 to-indigo-600'
            });
        }
    });

    // Hitung ukuran asli dari file-file yang ada
    responseAccounts.forEach(acc => {
        const accFiles = cachedMediaList.filter(m => m.accountName === acc.name);
        const actualUsed = accFiles.reduce((sum, f) => sum + (f.size || 0), 0);
        
        acc.usedBytes = actualUsed;
        
        // Set totalBytes sama dengan ukuran aslinya untuk semua tipe akun (local maupun gdrive)
        // agar persentase selalu menunjukkan kapasitas asli dari folder tersebut.
        acc.totalBytes = actualUsed;
    });
    
    res.json(responseAccounts);
});

// API: Edit Link / Folder ID Akun
app.put('/api/accounts/:id/link', async (req, res) => {
    const { id } = req.params;
    const { folderId } = req.body;
    const cleanFolderId = extractFolderId(folderId);
    
    let updated = false;
    accounts = accounts.map(acc => {
        if (acc.id === id) {
            updated = true;
            return { ...acc, folderId: cleanFolderId };
        }
        return acc;
    });

    if (updated) {
        saveAccounts();
        res.json({ message: 'Link/Folder ID berhasil diperbarui' });
        getOrUpdateCache(true).catch(e => console.error("Cache refresh error:", e));
    } else {
        res.status(404).json({ error: 'Akun tidak ditemukan' });
    }
});

function extractFolderId(input) {
    if (!input) return '';
    const match = input.match(/folders\/([a-zA-Z0-9_-]+)/) || input.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : input.trim();
}

// API: Tambah Akun Google Drive Baru
app.post('/api/accounts', async (req, res) => {
    const { name, email, folderId, type, path: localPath } = req.body;
    
    if (type === 'local') {
        if (!name || !localPath) {
            return res.status(400).json({ error: 'Nama Akun dan Path Folder Lokal wajib diisi' });
        }
        
        // Pastikan folder ada
        if (!fs.existsSync(localPath)) {
            try { 
                fs.mkdirSync(localPath, { recursive: true }); 
            } catch(e) {
                return res.status(500).json({ error: 'Gagal mengakses atau membuat folder lokal tersebut. Pastikan Path valid.' });
            }
        }
        
        const newAcc = {
            id: 'acc-local-' + Date.now(),
            name,
            email: email || 'local@laptop.storage',
            type: 'local',
            path: localPath,
            usedBytes: 0,
            totalBytes: 500 * 1024 * 1024 * 1024, // 500GB dummy
            status: 'active',
            color: 'from-amber-500 to-orange-600'
        };
        accounts.push(newAcc);
        saveAccounts();
        res.json({ message: 'Akun Local Disk berhasil ditambahkan', account: newAcc });
        getOrUpdateCache(true).catch(e => console.error("Cache refresh error:", e));
        return;
    }

    // Default ke gdrive
    if (!name || !folderId) {
        return res.status(400).json({ error: 'Nama Akun dan Folder ID wajib diisi' });
    }
    const cleanFolderId = extractFolderId(folderId);
    const newAcc = {
        id: 'acc-gdrive-' + Date.now(),
        name,
        email: email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        type: 'gdrive',
        folderId: cleanFolderId,
        usedBytes: 1.2 * 1024 * 1024 * 1024,
        totalBytes: 15 * 1024 * 1024 * 1024,
        status: 'active',
        color: 'from-cyan-500 to-blue-600'
    };
    accounts.push(newAcc);
    saveAccounts();

    // Berikan respons instan ke UI
    res.json({ message: 'Akun Google Drive berhasil ditambahkan', account: newAcc });
    
    // Trigger cache refresh di background tanpa memblokir response
    getOrUpdateCache(true).catch(e => console.error("Cache refresh error:", e));
});

// API: Hapus Akun Storage
app.delete('/api/accounts/:id', async (req, res) => {
    const { id } = req.params;
    accounts = accounts.filter(acc => acc.id !== id);
    saveAccounts();
    
    // Berikan respons instan ke UI
    res.json({ message: 'Akun berhasil dihapus' });
    
    // Trigger cache refresh di background tanpa memblokir response
    getOrUpdateCache(true).catch(e => console.error("Cache refresh error:", e));
});

// API: Hapus Media (Lokal: Hapus file fisik + cache, GDrive: Hapus dari daftar tampilan)
app.delete('/api/media', async (req, res) => {
    const { id, source } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ID media tidak boleh kosong' });

    try {
        if (source === 'local') {
            if (fs.existsSync(id)) {
                fs.unlinkSync(id);
                console.log('[Delete Local File]', id);
            }
            // Hapus cache thumbnail & video
            const thumbPath = path.join(CACHE_DIR, `${crypto.createHash('md5').update(id).digest('hex')}.webp`);
            const vthumbPath = path.join(CACHE_DIR, `${crypto.createHash('md5').update(id).digest('hex')}_vthumb.jpg`);
            const mp4Path = getCachePath(id);
            try { if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath); } catch(e){}
            try { if (fs.existsSync(vthumbPath)) fs.unlinkSync(vthumbPath); } catch(e){}
            try { if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path); } catch(e){}
        }

        if (source === 'gdrive') {
            if (driveClient) {
                let deletedSuccess = false;
                try {
                    // Opsi 1: Coba pindahkan ke Trash
                    await driveClient.files.update({
                        fileId: id,
                        supportsAllDrives: true,
                        supportsTeamDrives: true,
                        requestBody: { trashed: true }
                    });
                    console.log('[Delete GDrive File] Moved to Trash:', id);
                    deletedSuccess = true;
                } catch (gErr) {
                    console.warn('[Delete GDrive update failed, trying files.delete...]', gErr.message);
                    try {
                        // Opsi 2: Coba delete langsung
                        await driveClient.files.delete({
                            fileId: id,
                            supportsAllDrives: true,
                            supportsTeamDrives: true
                        });
                        console.log('[Delete GDrive File] Permanently deleted via Service Account:', id);
                        deletedSuccess = true;
                    } catch (dErr) {
                        console.warn('[Delete GDrive delete failed, trying removeParents...]', dErr.message);
                        try {
                            // Opsi 3 (Akun Google Pribadi): Keluarkan file dari folder (Remove from Folder)
                            const meta = await driveClient.files.get({
                                fileId: id,
                                fields: 'parents',
                                supportsAllDrives: true
                            });
                            const parentIds = (meta.data.parents || []).join(',');
                            if (parentIds) {
                                await driveClient.files.update({
                                    fileId: id,
                                    removeParents: parentIds,
                                    supportsAllDrives: true,
                                    supportsTeamDrives: true
                                });
                                console.log('[Delete GDrive File] Removed from folder parents:', parentIds);
                                deletedSuccess = true;
                            } else {
                                throw dErr;
                            }
                        } catch (rErr) {
                            console.error('[Delete GDrive API Error]', rErr.message);
                            return res.status(403).json({ 
                                error: 'Gagal menghapus dari Google Drive (' + rErr.message + '). Pastikan folder Drive Anda sudah di-SHARE ke email: omnigallery-bot@ivory-channel-504903-p1.iam.gserviceaccount.com sebagai EDITOR!' 
                            });
                        }
                    }
                }
            } else {
                console.warn('[Delete GDrive] driveClient tidak aktif.');
            }
        }

        // Hapus dari cachedMediaList
        if (cachedMediaList) {
            cachedMediaList = cachedMediaList.filter(m => m.id !== id);
        }

        res.json({ message: 'Media berhasil dihapus', id });
    } catch (e) {
        console.error('[Delete Error]', e);
        res.status(500).json({ error: 'Gagal menghapus media: ' + e.message });
    }
});

// API: Upload Media (Google Drive & Local Storage)
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
    const files = req.files || [];
    const { destinationType, targetId } = req.body || {};

    if (files.length === 0) {
        return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
    }
    if (!destinationType || !targetId) {
        return res.status(400).json({ error: 'Tujuan penyimpanan (destinationType / targetId) harus diisi' });
    }

    const uploadedResults = [];
    const errors = [];

    try {
        if (destinationType === 'gdrive') {
            if (!driveClient) {
                return res.status(400).json({ error: 'Koneksi Google Drive API (Service Account) belum aktif' });
            }

            const cleanFolderId = targetId.split(',')[0].trim();

            for (const file of files) {
                try {
                    const fileMetadata = {
                        name: file.originalname,
                        parents: [cleanFolderId]
                    };
                    const media = {
                        mimeType: file.mimetype,
                        body: fs.createReadStream(file.path)
                    };

                    const response = await driveClient.files.create({
                        requestBody: fileMetadata,
                        media: media,
                        fields: 'id, name, webViewLink, webContentLink',
                        supportsAllDrives: true
                    });

                    console.log('[Upload GDrive Success]', response.data.name, response.data.id);
                    uploadedResults.push({ id: response.data.id, name: response.data.name, source: 'gdrive' });
                } catch (gErr) {
                    console.error('[Upload GDrive Error]', gErr.message);
                    errors.push(`${file.originalname}: ${gErr.message}`);
                } finally {
                    try { fs.unlinkSync(file.path); } catch (e) {}
                }
            }
        } else if (destinationType === 'local') {
            let destFolder = targetId;
            if (!fs.existsSync(destFolder)) {
                const matchDir = LOCAL_DIRS.find(d => d.toLowerCase().includes(targetId.toLowerCase()) || path.basename(d).toLowerCase() === targetId.toLowerCase());
                if (matchDir) destFolder = matchDir;
            }

            if (!fs.existsSync(destFolder)) {
                try { fs.mkdirSync(destFolder, { recursive: true }); } catch (e) {}
            }

            for (const file of files) {
                try {
                    const destPath = path.join(destFolder, file.originalname);
                    fs.copyFileSync(file.path, destPath);
                    console.log('[Upload Local Success]', destPath);
                    uploadedResults.push({ id: destPath, name: file.originalname, source: 'local' });
                } catch (lErr) {
                    console.error('[Upload Local Error]', lErr.message);
                    errors.push(`${file.originalname}: ${lErr.message}`);
                } finally {
                    try { fs.unlinkSync(file.path); } catch (e) {}
                }
            }
        }

        // Trigger cache refresh
        await getOrUpdateCache(true);

        res.json({
            message: `Berhasil mengunggah ${uploadedResults.length} file`,
            uploadedResults,
            errors
        });
    } catch (e) {
        console.error('[Upload Endpoint Error]', e);
        res.status(500).json({ error: 'Gagal memproses unggahan: ' + e.message });
    }
});

// API: Ganti Nama Folder / Subfolder (Google Drive & Local Storage)
app.put('/api/rename-folder', async (req, res) => {
    const { folderType, folderIdOrPath, oldName, newName, accountName } = req.body || {};

    if (!newName || !newName.trim()) {
        return res.status(400).json({ error: 'Nama folder baru tidak boleh kosong' });
    }

    const cleanNewName = newName.trim();

    try {
        if (folderType === 'gdrive') {
            if (!driveClient) {
                return res.status(400).json({ error: 'Koneksi Google Drive API belum aktif' });
            }

            let targetFolderId = folderIdOrPath;
            if (!targetFolderId) {
                const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${oldName.replace(/'/g, "\\'")}' and trashed = false`;
                const searchRes = await driveClient.files.list({
                    q: q,
                    fields: 'files(id, name)',
                    supportsAllDrives: true,
                    includeItemsFromAllDrives: true
                });
                if (searchRes.data.files && searchRes.data.files.length > 0) {
                    targetFolderId = searchRes.data.files[0].id;
                }
            }

            if (!targetFolderId) {
                return res.status(404).json({ error: `Folder Google Drive "${oldName}" tidak ditemukan` });
            }

            // Update nama folder di Google Drive!
            await driveClient.files.update({
                fileId: targetFolderId,
                requestBody: { name: cleanNewName },
                supportsAllDrives: true
            });

            console.log(`[Rename GDrive Folder Success] "${oldName}" -> "${cleanNewName}" (${targetFolderId})`);
        } else if (folderType === 'local') {
            let oldFolderPath = folderIdOrPath || oldName;
            if (!fs.existsSync(oldFolderPath)) {
                for (const baseDir of LOCAL_DIRS) {
                    const candidate = path.join(baseDir, oldName);
                    if (fs.existsSync(candidate)) {
                        oldFolderPath = candidate;
                        break;
                    }
                }
            }

            if (!fs.existsSync(oldFolderPath)) {
                return res.status(404).json({ error: `Folder lokal "${oldName}" tidak ditemukan di disk` });
            }

            const parentDir = path.dirname(oldFolderPath);
            const newFolderPath = path.join(parentDir, cleanNewName);

            fs.renameSync(oldFolderPath, newFolderPath);
            console.log(`[Rename Local Folder Success] "${oldFolderPath}" -> "${newFolderPath}"`);
        }

        // Update accounts.json jika ini adalah nama penyimpanan akun
        if (fs.existsSync(ACCOUNTS_FILE)) {
            try {
                let accountsData = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
                let updated = false;
                accountsData = accountsData.map(acc => {
                    if (acc.name === oldName || acc.id === folderIdOrPath || (acc.folderId && acc.folderId.includes(folderIdOrPath))) {
                        acc.name = cleanNewName;
                        if (acc.type === 'local' && acc.path) {
                            const parentDir = path.dirname(acc.path);
                            acc.path = path.join(parentDir, cleanNewName);
                        }
                        updated = true;
                    }
                    return acc;
                });
                if (updated) {
                    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accountsData, null, 2));
                    console.log('[Accounts JSON Updated]', cleanNewName);
                }
            } catch (accErr) {
                console.error('[Error Updating Accounts JSON]', accErr);
            }
        }

        // Refresh cache galeri
        await getOrUpdateCache(true);

        res.json({
            message: `Nama folder berhasil diubah menjadi "${cleanNewName}"`,
            oldName,
            newName: cleanNewName
        });
    } catch (e) {
        console.error('[Rename Folder Error]', e);
        res.status(500).json({ error: 'Gagal mengubah nama folder: ' + e.message });
    }
});

// API: Mengambil daftar media
app.get('/api/photos', async (req, res) => {
    const { mediaList } = await getOrUpdateCache();
    res.json(mediaList);
});

// API: Statistics Ringkasan Storage Gateway
app.get('/api/stats', async (req, res) => {
    const { stats } = await getOrUpdateCache();

    const totalCapacity = accounts.reduce((acc, a) => acc + a.totalBytes, 0);
    const totalUsed = accounts.reduce((acc, a) => acc + a.usedBytes, 0);

    res.json({
        totalCapacity,
        totalCapacityFormatted: formatBytes(totalCapacity),
        totalUsed,
        totalUsedFormatted: formatBytes(totalUsed),
        freeSpace: totalCapacity - totalUsed,
        freeSpaceFormatted: formatBytes(totalCapacity - totalUsed),
        activeAccounts: accounts.length,
        totalImages: stats ? stats.imageCount : 0,
        totalVideos: stats ? stats.videoCount : 0,
        totalDocs: stats ? stats.docCount : 0
    });
});

// API: Supabase Environment Configuration
app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL || 'https://emizyqcqjuzabgsk.supabase.co',
        supabaseKey: process.env.SUPABASE_ANON_KEY || 'sb_publishable_WxTXhArfmb-DxvqXNg_4OQ_6YR-QGNI'
    });
});

// Mencari Local IP
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Catch-all route untuk SPA (Single Page Application) & Vercel Routing
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Warm up cache on server start
getOrUpdateCache(true);

// Jalankan server jika lokal
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        const ip = getLocalIp();
        console.log('\n=======================================================');
        console.log(`🚀 OMNIGALLERY DASHBOARD BERJALAN!`);
        console.log(`💻 Buka di Laptop: http://localhost:${PORT}`);
        console.log(`📱 Buka di HP    : http://${ip}:${PORT}`);
        console.log('=======================================================\n');
    });
}

module.exports = app;
