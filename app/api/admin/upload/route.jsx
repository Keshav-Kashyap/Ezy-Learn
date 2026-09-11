import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-auth";
import { createClient } from '@supabase/supabase-js';
import { db } from "@/config/db";
import { studyMaterialsTable, materialSubjectMappingTable, subjectsTable } from '@/config/schema';
import { eq } from "drizzle-orm";

// Initialize Supabase client with proper error handling
let supabase;
try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error(' Missing Supabase environment variables');
        throw new Error('Supabase configuration missing');
    }

    supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
    console.log('Supabase client initialized successfully');
} catch (error) {
    console.error(' Failed to initialize Supabase client:', error);
}

// POST - Upload file to Supabase Storage and save to database
export async function POST(request) {
    try {
        // Check Supabase client availability
        if (!supabase) {
            console.warn(' Supabase not configured, using fallback URL method');

            // Fallback: Store using URL instead of actual upload
            return await handleUrlBasedUpload(request);
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
        const thumbnailFile = formData.get('thumbnailFile'); // Optional thumbnail upload
        const courseCode = formData.get('courseCode'); // For backward compatibility
        const subjectIds = formData.get('subjectIds'); // New: comma-separated subject IDs or JSON array
        const title = formData.get('title');
        const fileName = formData.get('fileName');
        const fileSize = formData.get('fileSize');
        const fileType = formData.get('fileType');
        const imageUrl = formData.get('imageUrl'); // Optional thumbnail URL
        const isPopular = formData.get('isPopular') === 'true';

        console.log("Upload params:", { courseCode, subjectIds, isPopular, hasThumbnailFile: !!thumbnailFile, imageUrl });

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

        // Validate file type (PDF only for now)
        if (file.type !== 'application/pdf') {
            return NextResponse.json({
                success: false,
                error: "Only PDF files are allowed"
            }, { status: 400 });
        }

        // Parse subject IDs
        let subjectIdArray = [];

        if (subjectIds) {
            // New flow: Use provided subject IDs
            try {
                subjectIdArray = JSON.parse(subjectIds);
                if (!Array.isArray(subjectIdArray) || subjectIdArray.length === 0) {
                    throw new Error('Invalid subject IDs format');
                }
            } catch (e) {
                // Try comma-separated format
                subjectIdArray = subjectIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                if (subjectIdArray.length === 0) {
                    return NextResponse.json({
                        success: false,
                        error: "Invalid subject IDs format"
                    }, { status: 400 });
                }
            }
        } else if (courseCode) {
            // Old flow: Find subject by code for backward compatibility
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

        // Generate unique file name using first subject or courseCode
        const filePrefix = courseCode || `subject-${subjectIdArray[0]}`;
        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/\s+/g, '_');
        const supabaseFileName = `study-materials/${filePrefix}/${timestamp}-${cleanFileName}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('study-materials')
            .upload(supabaseFileName, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error(' Supabase upload error details:', {
                message: error.message,
                statusCode: error.statusCode,
                error: error
            });

            // More specific error messages
            if (error.message?.includes('Bucket not found')) {
                throw new Error('Storage bucket "study-materials" not found. Please create it in Supabase dashboard.');
            } else if (error.message?.includes('not authorized')) {
                throw new Error('Not authorized to upload. Check Supabase storage policies.');
            } else if (error.message?.includes('fetch failed')) {
                throw new Error('Network error: Unable to connect to Supabase. Check your internet connection.');
            } else {
                throw new Error(`Upload failed: ${error.message}`);
            }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('study-materials')
            .getPublicUrl(supabaseFileName);

        // Upload thumbnail if provided
        let thumbnailPublicUrl = imageUrl || null; // Use URL if provided

        if (thumbnailFile && !imageUrl) {
            try {
                const thumbnailBytes = await thumbnailFile.arrayBuffer();
                const thumbnailBuffer = Buffer.from(thumbnailBytes);
                const thumbnailFileName = `thumbnails/${filePrefix}/${timestamp}-thumb-${thumbnailFile.name.replace(/\s+/g, '_')}`;

                const { data: thumbData, error: thumbError } = await supabase.storage
                    .from('study-materials')
                    .upload(thumbnailFileName, thumbnailBuffer, {
                        contentType: thumbnailFile.type,
                        upsert: false
                    });

                if (!thumbError) {
                    const { data: thumbUrlData } = supabase.storage
                        .from('study-materials')
                        .getPublicUrl(thumbnailFileName);

                    thumbnailPublicUrl = thumbUrlData.publicUrl;
                    console.log(' Thumbnail uploaded:', thumbnailFileName);
                } else {
                    console.warn(' Thumbnail upload failed:', thumbError.message);
                }
            } catch (thumbErr) {
                console.warn(' Error uploading thumbnail:', thumbErr.message);
                // Continue without thumbnail - it's optional
            }
        }

        // Save material to database
        // Prepare tags array
        const tagsArray = [filePrefix, 'study-material'];
        if (isPopular) {
            tagsArray.push('popular');
        }

        const materialData = await db.insert(studyMaterialsTable).values({
            title: title,
            fileUrl: urlData.publicUrl,
            imageUrl: thumbnailPublicUrl,
            description: `Study material - ${title}`,
            tags: JSON.stringify(tagsArray),
            downloadCount: 0,
            isPopular: isPopular,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        // Link material to ALL selected subjects through mapping table
        const mappingPromises = subjectIdArray.map(subjectId =>
            db.insert(materialSubjectMappingTable).values({
                materialId: materialData[0].id,
                subjectId: subjectId,
                createdAt: new Date()
            })
        );

        await Promise.all(mappingPromises);

        // Fetch subject details for response
        const subjects = await db.select()
            .from(subjectsTable)
            .where(eq(subjectsTable.id, subjectIdArray[0]));

        return NextResponse.json({
            success: true,
            message: `Material uploaded and assigned to ${subjectIdArray.length} subject(s) successfully`,
            data: {
                material: materialData[0],
                assignedToSubjects: subjectIdArray.length,
                subjectIds: subjectIdArray,
                file: {
                    url: urlData.publicUrl,
                    fileName: supabaseFileName,
                    originalName: file.name,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString(),
                    supabasePath: data.path
                }
            }
        });

    } catch (error) {
        console.error(' Error uploading material:', error);
        return NextResponse.json({
            success: false,
            error: "Failed to upload material",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE - Delete file from Supabase Storage and database
export async function DELETE(request) {
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
                error: "Admin access required"
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const materialId = searchParams.get('materialId');

        if (!materialId) {
            return NextResponse.json({
                success: false,
                error: "Material ID is required"
            }, { status: 400 });
        }

        // Get material details from database
        const material = await db.select()
            .from(studyMaterialsTable)
            .where(eq(studyMaterialsTable.id, materialId))
            .limit(1);

        if (!material[0]) {
            return NextResponse.json({
                success: false,
                error: "Material not found"
            }, { status: 404 });
        }

        // Extract fileName from fileUrl for Supabase deletion
        const fileUrl = material[0].fileUrl;
        let fileName = null;

        if (fileUrl && fileUrl.includes('study-materials/')) {
            // Extract the file path from the URL
            const urlParts = fileUrl.split('study-materials/');
            if (urlParts[1]) {
                fileName = `study-materials/${urlParts[1]}`;
            }
        }

        // Delete from Supabase Storage
        if (fileName) {
            const { error } = await supabase.storage
                .from('study-materials')
                .remove([fileName]);

            if (error) {
                console.warn('Supabase delete warning:', error.message);
                // Continue with database deletion even if file deletion fails
            }
        }

        // Delete from database
        await db.delete(studyMaterialsTable)
            .where(eq(studyMaterialsTable.id, materialId));

        return NextResponse.json({
            success: true,
            message: "Material deleted successfully"
        });

    } catch (error) {
        console.error(' Error deleting material:', error);
        return NextResponse.json({
            success: false,
            error: "Failed to delete material",
            details: error.message
        }, { status: 500 });
    }
}

// Fallback method: URL-based upload (when Supabase is not configured)
async function handleUrlBasedUpload(request) {
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
                error: "Unauthorized: Admin access required"
            }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const courseCode = formData.get('courseCode');
        const subjectIds = formData.get('subjectIds');
        const title = formData.get('title');
        const isPopular = formData.get('isPopular') === 'true';

        console.log('📝 URL-based upload:', { courseCode, subjectIds, title, isPopular, fileName: file?.name });

        // Validate inputs
        if (!title) {
            return NextResponse.json({
                success: false,
                error: "Title is required"
            }, { status: 400 });
        }

        if (!courseCode && !subjectIds) {
            return NextResponse.json({
                success: false,
                error: "Either course code or subject IDs are required"
            }, { status: 400 });
        }

        if (!file || !(file instanceof File)) {
            return NextResponse.json({
                success: false,
                error: "No file provided"
            }, { status: 400 });
        }

        // Parse subject IDs
        let subjectIdArray = [];

        if (subjectIds) {
            try {
                subjectIdArray = JSON.parse(subjectIds);
            } catch (e) {
                subjectIdArray = subjectIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            }
        } else if (courseCode) {
            // Backward compatibility - find subject by code
            const subject = await db.select().from(subjectsTable)
                .where(eq(subjectsTable.code, courseCode.toUpperCase()));

            if (subject.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: `Subject with code ${courseCode} not found`
                }, { status: 404 });
            }

            subjectIdArray = [subject[0].id];
        }

        if (subjectIdArray.length === 0) {
            return NextResponse.json({
                success: false,
                error: "No valid subject IDs provided"
            }, { status: 400 });
        }

        // Create a placeholder URL (using a free PDF hosting service URL format)
        // In production, you would upload to your own server or use a proper file hosting service
        const placeholderUrl = `https://placeholder-url.com/files/${Date.now()}-${file.name}`;

        // Save material to database with placeholder URL (without subjectId)
        const materialData = await db.insert(studyMaterialsTable).values({
            title: title,
            type: type,
            fileUrl: placeholderUrl,
            description: `${type} material - ${title}`,
            tags: JSON.stringify([type, 'study-material']),
            downloadCount: 0,
            isPopular: isPopular,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        // Link material to ALL selected subjects through mapping table
        const mappingPromises = subjectIdArray.map(subjectId =>
            db.insert(materialSubjectMappingTable).values({
                materialId: materialData[0].id,
                subjectId: subjectId,
                createdAt: new Date()
            })
        );

        await Promise.all(mappingPromises);

        console.log(' Material saved to database (URL-based)');

        return NextResponse.json({
            success: true,
            message: ` Material saved and assigned to ${subjectIdArray.length} subject(s)! Note: File upload is disabled (Supabase not configured). Please add file URL manually or configure Supabase.`,
            data: {
                material: materialData[0],
                assignedToSubjects: subjectIdArray.length,
                subjectIds: subjectIdArray,
                file: {
                    url: placeholderUrl,
                    fileName: file.name,
                    originalName: file.name,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString(),
                    note: "Placeholder URL - Supabase not configured"
                }
            }
        });

    } catch (error) {
        console.error('❌ Error in URL-based upload:', error);
        return NextResponse.json({
            success: false,
            error: "Failed to save material",
            details: error.message
        }, { status: 500 });
    }
}