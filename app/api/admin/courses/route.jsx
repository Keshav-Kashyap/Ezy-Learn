import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { coursesTable, usersTable, semestersTable } from '@/config/schema'
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { createDriveFolderForEntity } from "@/lib/googleDrive";


export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({
                success: false,
                error: "Authentication required"
            }, { status: 401 });
        }

        // Check if user is admin from database
        const dbUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.userId, user.id))
            .limit(1);

        if (!dbUser[0] || dbUser[0].role !== 'admin') {
            return NextResponse.json({
                success: false,
                error: "Admin access required"
            }, { status: 403 });
        }

        const allCourses = await db.select().from(coursesTable);
        return NextResponse.json({
            success: true,
            courses: allCourses
        });
    } catch (error) {
        console.error("Error fetching admin courses:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch courses"
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({
                success: false,
                error: "Authentication required"
            }, { status: 401 });
        }

        // Check if user is admin from database
        const dbUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.userId, user.id))
            .limit(1);

        if (!dbUser[0] || dbUser[0].role !== 'admin') {
            return NextResponse.json({
                success: false,
                error: "Admin access required"
            }, { status: 403 });
        }

        // Handle FormData from FormCreateCourse
        const formData = await request.formData();
        const title = formData.get('title');
        const subtitle = formData.get('subtitle');
        const description = formData.get('description');
        const category = formData.get('category');
        const duration = formData.get('duration');
        const imageFile = formData.get('image');

        if (!title || !category || !duration) {
            return NextResponse.json({
                success: false,
                error: "Title, category, and duration are required"
            }, { status: 400 });
        }

        // Check if course already exists
        const existingCourse = await db.select()
            .from(coursesTable)
            .where(eq(coursesTable.category, category.toLowerCase()))
            .limit(1);

        if (existingCourse.length > 0) {
            return NextResponse.json({
                success: false,
                error: "Course with this category already exists"
            }, { status: 409 });
        }

        // Handle image upload to Supabase
        let imageUrl = null;
        if (imageFile && imageFile.size > 0) {
            try {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                );

                const fileExt = imageFile.name.split('.').pop();
                const fileName = `course-${category.toLowerCase()}-${Date.now()}.${fileExt}`;
                const filePath = `courses/${fileName}`;

                const arrayBuffer = await imageFile.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('course-images')
                    .upload(filePath, buffer, {
                        contentType: imageFile.type,
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Supabase upload error:', uploadError);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('course-images')
                        .getPublicUrl(filePath);
                    imageUrl = publicUrl;
                    console.log(' Image uploaded successfully:', imageUrl);
                }
            } catch (error) {
                console.error('❌ Error uploading image:', error);
            }
        }

        // Create the course
        const newCourse = await db.insert(coursesTable).values({
            title: title.trim(),
            subtitle: subtitle?.trim() || null,
            description: description?.trim() || null,
            category: category.toLowerCase(),
            duration: parseInt(duration),
            image: imageUrl,
            isActive: true,
            documentsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        // Automatically create semesters based on duration
        const courseDuration = parseInt(duration);
        const totalSemesters = courseDuration * 2; // 2 semesters per year
        const createdSemesters = [];

        for (let i = 1; i <= totalSemesters; i++) {
            const semesterName = `Semester ${i}`;
            const year = Math.ceil(i / 2);
            const semesterInYear = i % 2 === 1 ? 'First' : 'Second';

            const semester = await db.insert(semestersTable).values({
                category: category.toLowerCase(),
                name: semesterName,
                description: `${semesterInYear} semester of year ${year}`,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();

            createdSemesters.push(semester[0]);
        }

        // Auto-create Google Drive folders for new course & semesters asynchronously
        createDriveFolderForEntity({ courseCategory: category.toLowerCase() }).catch(err => console.warn(err));
        for (let i = 1; i <= totalSemesters; i++) {
            createDriveFolderForEntity({
                courseCategory: category.toLowerCase(),
                semesterName: `Semester ${i}`
            }).catch(err => console.warn(err));
        }

        return NextResponse.json({
            success: true,
            course: newCourse[0],
            semesters: createdSemesters,
            message: `Course created successfully with ${totalSemesters} semesters!`
        });
    } catch (error) {
        console.error("Error creating course:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to create course"
        }, { status: 500 });
    }
}




export async function DELETE(request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({
                success: false,
                error: "Authentication required"
            }, { status: 401 });
        }

        // Check if user is admin from database
        const dbUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.userId, user.id))
            .limit(1);

        if (!dbUser[0] || dbUser[0].role !== 'admin') {
            return NextResponse.json({
                success: false,
                error: "Admin access required"
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({
                success: false,
                error: "Course ID is required"
            }, { status: 400 });
        }

        await db.delete(coursesTable).where(eq(coursesTable.id, id));

        return NextResponse.json({
            success: true,
            message: "Course deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting course:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to delete course"
        }, { status: 500 });
    }
}

