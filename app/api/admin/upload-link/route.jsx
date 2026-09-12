import { db } from "@/config/db";
import { studyMaterialsTable, materialSubjectMappingTable } from "@/config/schema";
import { NextResponse } from "next/server";

// Helper function to convert Google Drive view link to direct download link
function convertGoogleDriveLink(url) {
    try {
        // Check if it's a Google Drive link
        if (url.includes('drive.google.com')) {
            // Extract file ID from various Google Drive URL formats
            let fileId = null;

            // Format: https://drive.google.com/file/d/FILE_ID/view
            const viewMatch = url.match(/\/file\/d\/([^\/]+)/);
            if (viewMatch) {
                fileId = viewMatch[1];
            }

            // Format: https://drive.google.com/open?id=FILE_ID
            const openMatch = url.match(/[?&]id=([^&]+)/);
            if (openMatch) {
                fileId = openMatch[1];
            }

            if (fileId) {
                // Use direct Google Drive viewer embed URL - bypasses virus scan for large files
                return `https://drive.google.com/file/d/${fileId}/preview`;
            }
        }

        return url; // Return original if not Google Drive or can't parse
    } catch (error) {
        console.log('Error parsing Google Drive link:', error);
        return url;
    }
}

export async function POST(request) {
    try {
        const { title, fileUrl, subjectIds, courseCode, imageUrl, isPopular } = await request.json();

        console.log('📝 Link-based upload:', { title, fileUrl, subjectIds, courseCode, imageUrl, isPopular });

        // Validation
        if (!title || !fileUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Title and file URL are required"
                },
                { status: 400 }
            );
        }

        // Validate subjectIds
        let subjectIdArray = [];
        if (Array.isArray(subjectIds)) {
            subjectIdArray = subjectIds;
        } else if (typeof subjectIds === 'string') {
            try {
                subjectIdArray = JSON.parse(subjectIds);
            } catch {
                subjectIdArray = subjectIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            }
        }

        if (subjectIdArray.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "At least one subject ID is required"
                },
                { status: 400 }
            );
        }

        // Convert Google Drive link if needed
        const processedUrl = convertGoogleDriveLink(fileUrl);

        // Detect file type from URL
        const { getFileType } = await import('@/lib/utils');
        const detectedFileType = getFileType(processedUrl);
        console.log(' Detected file type:', detectedFileType);

        // Prepare tags array
        const tagsArray = [courseCode, 'study-material'];
        if (isPopular) {
            tagsArray.push('popular');
        }

        // Insert material into database
        const [newMaterial] = await db.insert(studyMaterialsTable).values({
            title: title,
            type: detectedFileType.toUpperCase(), // Store detected file type
            fileUrl: processedUrl,
            description: `Uploaded via link`,
            imageUrl: imageUrl || null,
            tags: JSON.stringify(tagsArray),
            isPopular: isPopular || false,
            isActive: true,
        }).returning();

        console.log(' Material created:', newMaterial.id);

        // Create mappings for all selected subjects
        const mappings = subjectIdArray.map(subjectId => ({
            materialId: newMaterial.id,
            subjectId: subjectId,
        }));

        await db.insert(materialSubjectMappingTable).values(mappings);

        console.log(` Created ${mappings.length} material-subject mappings`);

        return NextResponse.json({
            success: true,
            message: `Material added to ${subjectIdArray.length} subject(s) successfully`,
            data: {
                materialId: newMaterial.id,
                title: newMaterial.title,
                fileUrl: newMaterial.fileUrl,
                subjectsCount: subjectIdArray.length,
            }
        });

    } catch (error) {
        console.error('❌ Error adding material via link:', error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to add material",
                details: error.message
            },
            { status: 500 }
        );
    }
}
