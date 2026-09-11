import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-auth";
import { syncAllFoldersToDrive } from "@/lib/googleDrive";

export async function POST(request) {
    try {
        const adminCheck = await checkAdminAccess();

        if (!adminCheck.isAuthenticated || !adminCheck.isAdmin) {
            return NextResponse.json({
                success: false,
                error: "Admin authentication required"
            }, { status: 403 });
        }

        const syncResult = await syncAllFoldersToDrive();

        return NextResponse.json({
            success: true,
            message: `Successfully created/synced ${syncResult.totalFoldersSynced} course & subject folders on Google Drive!`,
            data: syncResult
        });

    } catch (error) {
        console.error("❌ Error syncing Google Drive folders:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to sync Google Drive folders: " + error.message
        }, { status: 500 });
    }
}
