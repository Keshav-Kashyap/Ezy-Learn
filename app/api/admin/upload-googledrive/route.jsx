import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-auth";
import { db } from "@/config/db";
import { studyMaterialsTable, materialSubjectMappingTable, subjectsTable } from '@/config/schema';
import { eq, inArray } from "drizzle-orm";
import { getDriveClient, getTargetFolderId, uploadFileToGoogleDrive } from "@/lib/googleDrive";

export async function POST(request) {
    try {
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

        console.log("📤 Google Drive upload params:", { courseCode, subjectIds, title, isPopular });

        if (!file || !title) {
            return NextResponse.json({
                success: false,
                error: "File and document title are required"
            }, { status: 400 });
        }

        if (!courseCode && !subjectIds) {
            return NextResponse.json({
                success: false,
                error: "Subject selection is required"
            }, { status: 400 });
        }

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
            }
        } else if (courseCode) {
            const foundSubject = await db.select()
                .from(subjectsTable)
                .where(eq(subjectsTable.code, courseCode.toUpperCase()))
                .limit(1);

            if (foundSubject[0]) {
                subjectIdArray = [foundSubject[0].id];
            }
        }

        if (subjectIdArray.length === 0) {
            return NextResponse.json({
                success: false,
                error: "No valid subjects selected"
            }, { status: 400 });
        }

        // Fetch primary subject details to construct Google Drive folder structure
        const targetSubjects = await db.select()
            .from(subjectsTable)
            .where(inArray(subjectsTable.id, subjectIdArray));

        const primarySubject = targetSubjects[0] || {};
        const courseCategory = primarySubject.category || 'General';
        const semesterName = primarySubject.semesterName || 'Semester Notes';
        const subjectName = primarySubject.name || 'General';
        const subjectCodeVal = primarySubject.code || '';

        console.log(` Target Folder Hierarchy: EzyStudy_Materials > ${courseCategory} > ${semesterName} > ${subjectName} (${subjectCodeVal})`);

        // Initialize Google Drive Client
        let drive;
        try {
            drive = getDriveClient();
        } catch (driveErr) {
            return NextResponse.json({
                success: false,
                error: "Google Drive is not authenticated. Please open http://localhost:3000/api/admin/google/auth once in your browser to get your GOOGLE_REFRESH_TOKEN, or set GOOGLE_REFRESH_TOKEN in .env."
            }, { status: 400 });
        }

        // Get or Create Google Drive Folder for this subject
        const targetFolderId = await getTargetFolderId(drive, {
            courseCategory: courseCategory,
            semesterName: semesterName,
            subjectName: subjectName,
            subjectCode: subjectCodeVal,
        });

        // Convert uploaded file to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload File directly into the target subject folder on Google Drive
        const uploadResult = await uploadFileToGoogleDrive({
            buffer: buffer,
            fileName: file.name,
            mimeType: file.type,
            folderId: targetFolderId,
        });

        console.log(" File uploaded to Google Drive folder:", uploadResult.fileId);

        // Prepare Tags
        const tags = isPopular ? ['popular', 'google-drive'] : ['google-drive'];

        // Save material record in PostgreSQL Database
        const [newMaterial] = await db.insert(studyMaterialsTable)
            .values({
                title: title,
                description: `Uploaded via Google Drive into ${courseCategory} / ${semesterName} / ${subjectName}`,
                fileUrl: uploadResult.webViewLink,
                type: 'PDF',
                imageUrl: imageUrl || null,
                tags: JSON.stringify(tags),
                isPopular: isPopular,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        // Create subject mappings
        const mappings = subjectIdArray.map(subjectId => ({
            materialId: newMaterial.id,
            subjectId: subjectId,
            createdAt: new Date()
        }));

        await db.insert(materialSubjectMappingTable).values(mappings);

        return NextResponse.json({
            success: true,
            message: `Material uploaded to Google Drive folder (${courseCategory} > ${semesterName} > ${subjectName}) and assigned to ${subjectIdArray.length} subject(s)!`,
            data: {
                materialId: newMaterial.id,
                fileUrl: uploadResult.webViewLink,
                googleDriveFileId: uploadResult.fileId,
                folderId: targetFolderId,
                folderPath: `EzyStudy_Materials / ${courseCategory} / ${semesterName} / ${subjectName}`,
                title: title,
                subjectCount: subjectIdArray.length
            }
        });

    } catch (error) {
        console.error("❌ Google Drive upload route error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to upload file to Google Drive: " + (error.message || "Unknown error")
        }, { status: 500 });
    }
}
