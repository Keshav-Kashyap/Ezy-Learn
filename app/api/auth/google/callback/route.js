import { NextResponse } from "next/server";
import { setMemoryRefreshToken } from "@/lib/googleDrive";
import { google } from "googleapis";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(new URL('/admin/library?google_drive_error=' + encodeURIComponent(error), request.url));
        }

        if (!code) {
            return NextResponse.json({ success: false, error: "No code provided" }, { status: 400 });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        const { tokens } = await oauth2Client.getToken(code);

        if (tokens.refresh_token) {
            console.log(" Obtained Google Drive Refresh Token:", tokens.refresh_token);
            setMemoryRefreshToken(tokens.refresh_token);

            // Persist token to .env file automatically
            try {
                const fs = require('fs');
                const path = require('path');
                const envPath = path.join(process.cwd(), '.env');

                if (fs.existsSync(envPath)) {
                    let envContent = fs.readFileSync(envPath, 'utf8');
                    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
                        envContent = envContent.replace(
                            /GOOGLE_REFRESH_TOKEN=.*/,
                            `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
                        );
                    } else {
                        envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
                    }
                    fs.writeFileSync(envPath, envContent, 'utf8');
                    console.log(" Successfully saved GOOGLE_REFRESH_TOKEN to .env file!");
                }
            } catch (envErr) {
                console.warn(" Could not write GOOGLE_REFRESH_TOKEN to .env file:", envErr.message);
            }
        }

        // Redirect back to admin library with success message
        const redirectUrl = new URL('/admin/library', request.url);
        redirectUrl.searchParams.set('google_drive', 'connected');
        if (tokens.refresh_token) {
            redirectUrl.searchParams.set('refresh_token_retrieved', 'true');
        }

        return NextResponse.redirect(redirectUrl);
    } catch (err) {
        console.error("❌ Google Drive callback error:", err);
        return NextResponse.redirect(new URL('/admin/library?google_drive_error=' + encodeURIComponent(err.message), request.url));
    }
}
