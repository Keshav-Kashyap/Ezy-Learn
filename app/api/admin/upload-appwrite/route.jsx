import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-auth";
import { appwriteStorage, ID } from "@/lib/appwrite";
import { db } from "@/config/db";
import { studyMaterialsTable, materialSubjectMappingTable, subjectsTable } from '@/config/schema';
import { eq } from "drizzle-orm";

// POST - Upload file to Appwrite Storage and save to database
export async function POST(request) {
    try {
        // Check Appwrite client availability
        if (!appwriteStorage) {
            return NextResponse.json({
                success: false,
                error: "Appwrite is not configured. Please set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, and NEXT_PUBLIC_APPWRITE_BUCKET_ID in your .env file"
            }, { status: 500 });
        }

        const adminCheck = await checkAdminAccess();

        if (!adminCheck.isAuthenticated) {
            return NextResponse.json({
                success: false,
                error: "Please login first"
            }, { status: 401 });
        }

        if (!adminCheck.isAdmin) {
            return NextResponse.json({
                success: false,
                error: "Admin access required. Your role: " + (adminCheck.user?.role || 'unknown')
            }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const thumbnailFile = formData.get('thumbnailFile');
        const courseCode = formData.get('courseCode');
        const subjectIds = formData.get('subjectIds');
        const title = formData.get('title');
        const imageUrl = formData.get('imageUrl');
        const isPopular = formData.get('isPopular') === 'true';

        console.log("📤 Appwrite upload params:", { courseCode, subjectIds, isPopular, hasThumbnailFile: !!thumbnailFile, imageUrl });

        if (!file || !title) {
            return NextResponse.json({
                success: false,
                error: "File and title are required"
            }, { status: 400 });
        }

        // Check if we have either courseCode or subjectIds
        if (!courseCode && !subjectIds) {
            return NextResponse.json({
                success: false,
                error: "Either subject code or subject IDs are required"
            }, { status: 400 });
        }

        // Validate file type (PDF only)
        if (file.type !== 'application/pdf') {
            return NextResponse.json({
                success: false,
                error: "Only PDF files are allowed"
            }, { status: 400 });
        }

        // Parse subject IDs
        let subjectIdArray = [];

        if (subjectIds) {
            try {
                subjectIdArray = JSON.parse(subjectIds);
                if (!Array.isArray(subjectIdArray) || subjectIdArray.length === 0) {
                    throw new Error('Invalid subject IDs format');
                }
            } catch (e) {
                subjectIdArray = subjectIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                if (subjectIdArray.length === 0) {
                    return NextResponse.json({
                        success: false,
                        error: "Invalid subject IDs format"
                    }, { status: 400 });
                }
            }
        } else if (courseCode) {
            const subject = await db.select()
                .from(subjectsTable)
                .where(eq(subjectsTable.code, courseCode.toUpperCase()))
                .limit(1);

            if (!subject[0]) {
                return NextResponse.json({
                    success: false,
                    error: `Subject with code '${courseCode}' not found. Please create the subject first.`
                }, { status: 404 });
            }

            subjectIdArray = [subject[0].id];
        }

        // Get bucket ID from environment
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
        if (!bucketId) {
            return NextResponse.json({
                success: false,
                error: "Appwrite bucket ID not configured"
            }, { status: 500 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create File object for Appwrite
        const appwriteFile = new File([buffer], file.name, { type: file.type });

        // Upload to Appwrite Storage
        const uploadedFile = await appwriteStorage.createFile(
            bucketId,
            ID.unique(),
            appwriteFile
        );

        console.log(" File uploaded to Appwrite:", uploadedFile.$id);

        // Get file URL
        const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${uploadedFile.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&mode=admin`;

        // Upload thumbnail if provided
        let thumbnailPublicUrl = imageUrl || null;

        if (thumbnailFile && !imageUrl) {
            try {
                const thumbnailBytes = await thumbnailFile.arrayBuffer();
                const thumbnailBuffer = Buffer.from(thumbnailBytes);
                const appwriteThumbnailFile = new File([thumbnailBuffer], thumbnailFile.name, { type: thumbnailFile.type });

                const uploadedThumbnail = await appwriteStorage.createFile(
                    bucketId,
                    ID.unique(),
                    appwriteThumbnailFile
                );

                thumbnailPublicUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${uploadedThumbnail.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&mode=admin`;
                console.log(' Thumbnail uploaded to Appwrite:', uploadedThumbnail.$id);
            } catch (thumbErr) {
                console.warn(' Thumbnail upload to Appwrite failed:', thumbErr.message);
            }
        }

        // Create tags array
        const tags = isPopular ? ['popular'] : [];

        // Save to database
        const [newMaterial] = await db.insert(studyMaterialsTable)
            .values({
                title: title,
                description: `Uploaded via Appwrite by admin`,
                fileUrl: fileUrl,
                type: file.type,
                imageUrl: thumbnailPublicUrl,
                tags: JSON.stringify(tags)
            })
            .returning();

        console.log(" Material saved to database:", newMaterial.id);

        // Create subject mappings
        const mappings = subjectIdArray.map(subjectId => ({
            materialId: newMaterial.id,
            subjectId: subjectId
        }));

        await db.insert(materialSubjectMappingTable)
            .values(mappings);

        console.log(` Created ${mappings.length} subject mapping(s)`);

        return NextResponse.json({
            success: true,
            message: `Material uploaded successfully to ${subjectIdArray.length} subject(s) via Appwrite`,
            data: {
                materialId: newMaterial.id,
                fileUrl: fileUrl,
                thumbnailUrl: thumbnailPublicUrl,
                title: title,
                subjectCount: subjectIdArray.length,
                appwriteFileId: uploadedFile.$id
            }
        });

    } catch (error) {
        console.error("❌ Appwrite upload error:", error);

        let errorMessage = "Failed to upload file to Appwrite";

        if (error.message?.includes('Bucket not found')) {
            errorMessage = 'Storage bucket not found in Appwrite. Please create it first.';
        } else if (error.message?.includes('not authorized') || error.message?.includes('Unauthorized')) {
            errorMessage = 'Not authorized to upload to Appwrite. Check your API keys and permissions.';
        } else if (error.message?.includes('Network') || error.message?.includes('fetch failed')) {
            errorMessage = 'Network error: Unable to connect to Appwrite. Check your internet connection.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}
