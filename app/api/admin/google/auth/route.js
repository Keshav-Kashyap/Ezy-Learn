import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request) {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

        if (!clientId || !clientSecret) {
            return NextResponse.json({
                success: false,
                error: "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in environment variables"
            }, { status: 400 });
        }

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Requests refresh token
            prompt: 'consent',     // Forces consent screen to ensure refresh token is returned
            scope: [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.metadata.readonly'
            ]
        });

        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error("Error generating Google Auth URL:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to generate Google Drive authentication link",
            details: error.message
        }, { status: 500 });
    }
}
