import { NextResponse } from "next/server";
import { getMemoryRefreshToken } from "@/lib/googleDrive";
import { google } from "googleapis";

export async function GET() {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
        const refreshToken = getMemoryRefreshToken();

        const isConfigured = Boolean(clientId && clientSecret);
        const hasRefreshToken = Boolean(refreshToken);

        let authUrl = null;
        if (isConfigured) {
            try {
                const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
                authUrl = oauth2Client.generateAuthUrl({
                    access_type: 'offline',
                    prompt: 'consent',
                    scope: [
                        'https://www.googleapis.com/auth/drive.file',
                        'https://www.googleapis.com/auth/drive.metadata.readonly'
                    ]
                });
            } catch (err) {
                console.warn("Could not generate Auth URL:", err.message);
            }
        }

        return NextResponse.json({
            success: true,
            isConfigured,
            hasRefreshToken,
            refreshToken: refreshToken || null,
            authUrl
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
