const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const app = express();
const PORT = 3000;

// Folder lokal yang di-scan secara rekursif
const LOCAL_DIRS = ['D:\\FOTO', 'D:\\HP'];
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

app.use(express.json());

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

// Endpoint streaming file media lokal dari path mana pun secara aman (dengan HTTP Range streaming)
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
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': filePath.toLowerCase().endsWith('.mov') ? 'video/mp4' : (filePath.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'video/webm'),
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            res.sendFile(path.resolve(filePath));
        }
    } catch (e) {
        res.sendFile(path.resolve(filePath));
    }
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

// Real-time Video Transcoding (MOV/HEVC → H.264 MP4 untuk Chrome)
const { spawn } = require('child_process');

app.get('/transcode-video', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('File tidak ditemukan');
    }

    // Cari FFmpeg di PATH atau lokasi umum
    const ffmpegPaths = ['ffmpeg', 'C:\\ffmpeg\\bin\\ffmpeg.exe', 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'];
    const ffmpegCmd = ffmpegPaths[0]; // Pakai PATH dulu

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
        // Log progress transcoding (tidak di-send ke client)
        // console.log('[FFmpeg]', data.toString());
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

// Cache & High-Performance Scanner System
let cachedMediaList = null;
let cachedStats = null;
let lastScanTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache TTL

function getAllFilesRecursively(dirPath, maxDepth = 6, currentDepth = 0) {
    if (currentDepth > maxDepth) return [];
    let results = [];
    try {
        if (!fs.existsSync(dirPath)) return [];
        const list = fs.readdirSync(dirPath);
        list.forEach(file => {
            const filePath = path.join(dirPath, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat && stat.isDirectory()) {
                    if (!file.startsWith('.')) {
                        results = results.concat(getAllFilesRecursively(filePath, maxDepth, currentDepth + 1));
                    }
                } else if (stat && stat.isFile()) {
                    results.push({ filePath, stat });
                }
            } catch (e) {}
        });
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

    // 1. Pemindaian Folder Lokal
    LOCAL_DIRS.forEach(dir => {
        const rootDirName = path.basename(dir);
        const files = getAllFilesRecursively(dir);
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
                    accountId: 'acc-local',
                    accountName: accounts[0] ? accounts[0].name : 'Local Storage',
                    subfolder: subfolder
                });
            }
        });
    });

    // 2. Pemindaian Otomatis Folder Google Drive Terhubung (dengan Subfolder)
    const sameNameGroups = {};
    accounts.forEach(acc => {
        if (!sameNameGroups[acc.name]) sameNameGroups[acc.name] = [];
        sameNameGroups[acc.name].push(acc);
    });

    for (const acc of accounts) {
        if (acc.type === 'gdrive' && acc.folderId) {
            try {
                const group = sameNameGroups[acc.name] || [];
                const subfolderPrefix = group.length > 1 ? `Folder ${group.indexOf(acc) + 1}` : '';

                const driveFiles = await fetchGDriveFolderFiles(acc.folderId, acc.name);
                driveFiles.forEach(df => {
                    if (df.type === 'image') imageCount++;
                    else if (df.type === 'video') videoCount++;
                    else if (df.type === 'document') docCount++;

                    if (subfolderPrefix) {
                        df.subfolder = df.subfolder && df.subfolder !== 'Utama' 
                            ? `${subfolderPrefix} (${df.subfolder})` 
                            : subfolderPrefix;
                    }
                    mediaList.push(df);
                });
            } catch (e) {}
        }
    }

    cachedMediaList = mediaList;
    accounts[0].usedBytes = localUsed;
    cachedStats = { localUsed, imageCount, videoCount, docCount };
    lastScanTime = Date.now();

    return { mediaList: cachedMediaList, stats: cachedStats };
}

async function getOrUpdateCache(force = false) {
    const now = Date.now();
    if (!force && cachedMediaList && (now - lastScanTime < CACHE_TTL_MS)) {
        return { mediaList: cachedMediaList, stats: cachedStats };
    }
    return await refreshCache();
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

// API: Daftar Akun Storage Terhubung (Unified Duplicate Account Names)
app.get('/api/accounts', async (req, res) => {
    await getOrUpdateCache();
    const uniqueAccountsMap = new Map();
    accounts.forEach(acc => {
        if (!uniqueAccountsMap.has(acc.name)) {
            uniqueAccountsMap.set(acc.name, { ...acc });
        } else {
            const existing = uniqueAccountsMap.get(acc.name);
            existing.usedBytes += acc.usedBytes;
            existing.totalBytes += acc.totalBytes;
            existing.email = `${existing.email}, ${acc.email}`;
            existing.folderId = `${existing.folderId}, ${acc.folderId}`;
        }
    });
    res.json(Array.from(uniqueAccountsMap.values()));
});

function extractFolderId(input) {
    if (!input) return '';
    const match = input.match(/folders\/([a-zA-Z0-9_-]+)/) || input.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : input.trim();
}

// API: Tambah Akun Google Drive Baru
app.post('/api/accounts', async (req, res) => {
    const { name, email, folderId } = req.body;
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

    // Trigger cache refresh
    await getOrUpdateCache(true);

    res.json({ message: 'Akun berhasil ditambahkan', account: newAcc });
});

// API: Hapus Akun Storage
app.delete('/api/accounts/:id', async (req, res) => {
    const { id } = req.params;
    if (id === 'acc-local') {
        return res.status(400).json({ error: 'Akun penyimpanan lokal tidak dapat dihapus' });
    }
    accounts = accounts.filter(acc => acc.id !== id);
    saveAccounts();
    await getOrUpdateCache(true);
    res.json({ message: 'Akun berhasil dihapus' });
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

// Warm up cache on server start
getOrUpdateCache(true);

// Jalankan server
app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIp();
    console.log('\n=======================================================');
    console.log(`🚀 OMNIGALLERY DASHBOARD BERJALAN!`);
    console.log(`💻 Buka di Laptop: http://localhost:${PORT}`);
    console.log(`📱 Buka di HP    : http://${ip}:${PORT}`);
    console.log('=======================================================\n');
});
