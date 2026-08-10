import { NextResponse } from 'next/server'

function getGoogleDriveDownloadUrl(url) {
    if (!url.includes('drive.google.com')) return url;

    // Extract file ID from /file/d/FILE_ID/ or id=FILE_ID
    const fileIdMatch = url.match(/[-\w]{25,}/);
    if (fileIdMatch) {
        const fileId = fileIdMatch[0];
        return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
    }
    return url;
}

export async function POST(req) {
    try {
        const { url, fileName } = await req.json()

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        const targetUrl = getGoogleDriveDownloadUrl(url);

        // Fetch the file from the provided URL
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch file' }, { status: response.status })
        }

        // Get the file as array buffer
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Get content type, default to PDF
        const contentType = response.headers.get('Content-Type') || 'application/pdf'
        const safeName = (fileName || 'document.pdf').replace(/[/\\?%*:|"<>]/g, '_');

        // Return the file with appropriate headers
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${safeName}"`,
                'Content-Length': buffer.length.toString(),
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'no-cache',
            },
        })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const targetUrl = getGoogleDriveDownloadUrl(url);

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch file' }, { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const bytes = buffer.length;
        const formattedSize = bytes > (1024 * 1024)
            ? (bytes / (1024 * 1024)).toFixed(1) + ' MB'
            : (bytes / 1024).toFixed(0) + ' KB';

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Length': bytes.toString(),
                'X-File-Size': formattedSize,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': 'Content-Length, X-File-Size',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Proxy GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}
