import { NextResponse } from 'next/server';

function formatBytes(bytes) {
    if (!bytes || isNaN(bytes) || bytes <= 0) return null;
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function getGoogleDriveSize(fileId) {
    try {
        // 1. Try scraping Google Drive view page metadata for sizeBytes
        const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
        const viewRes = await fetch(viewUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        if (viewRes.ok) {
            const html = await viewRes.text();
            
            // Regex match for "sizeBytes":"1234567" or ["sizeBytes","1234567"]
            const sizeBytesMatch = html.match(/"sizeBytes"\s*:\s*"(\d+)"/) || 
                                   html.match(/\["sizeBytes",\s*"(\d+)"\]/) ||
                                   html.match(/sizeBytes\\":\\"(\d+)\\"/);
            if (sizeBytesMatch && sizeBytesMatch[1]) {
                const bytes = parseInt(sizeBytesMatch[1], 10);
                if (bytes > 0) return formatBytes(bytes);
            }
        }
    } catch (e) {
        console.error("Google Drive scrape error:", e);
    }

    try {
        // 2. Try export download URL with confirm=t
        const exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
        const res = await fetch(exportUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const len = res.headers.get('content-length');
        if (len && parseInt(len, 10) > 0) {
            return formatBytes(parseInt(len, 10));
        }
    } catch (e) {
        console.error("Google Drive export fetch error:", e);
    }

    return null;
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // If Google Drive URL
        if (url.includes('drive.google.com')) {
            const fileIdMatch = url.match(/[-\w]{25,}/);
            if (fileIdMatch) {
                const driveSize = await getGoogleDriveSize(fileIdMatch[0]);
                if (driveSize) {
                    return NextResponse.json({
                        success: true,
                        formattedSize: driveSize
                    });
                }
            }
        }

        // Direct HTTP / Storage URL handling
        let res = await fetch(url, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        let contentLength = res.headers.get('content-length');

        if (!contentLength || parseInt(contentLength, 10) === 0) {
            res = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Range': 'bytes=0-0'
                }
            });

            const contentRange = res.headers.get('content-range');
            if (contentRange) {
                const match = contentRange.match(/\/(\d+)/);
                if (match) contentLength = match[1];
            } else {
                contentLength = res.headers.get('content-length');
            }
        }

        const bytes = contentLength ? parseInt(contentLength, 10) : null;
        const formattedSize = formatBytes(bytes);

        return NextResponse.json({
            success: true,
            formattedSize: formattedSize || null
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
