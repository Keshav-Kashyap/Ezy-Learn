import { db } from "@/config/db";
import { subjectsTable, semestersTable, coursesTable } from "@/config/schema";
import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-auth";
import { eq, and } from "drizzle-orm";
import { createDriveFolderForEntity } from "@/lib/googleDrive";


// GET - Get all subjects
export async function GET() {
    try {
        const { isAdmin, error } = await checkAdminAccess();

        if (!isAdmin) {
            return NextResponse.json({
                success: false,
                error: error || "Unauthorized access"
            }, { status: 403 });
        }

        const allSubjects = await db.select().from(subjectsTable);
        return NextResponse.json({
            success: true,
            subjects: allSubjects
        });
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch subjects"
        }, { status: 500 });
    }
}

// POST - Add subject to semester
export async function POST(request) {
    try {
        const { isAdmin, error } = await checkAdminAccess();

        if (!isAdmin) {
            return NextResponse.json({
                success: false,
                error: error || "Unauthorized access"
            }, { status: 403 });
        }

        const body = await request.json();
        const {
            category,
            semesterName,
            name,
            code,
            description
        } = body;

        if (!category || !semesterName || !name || !code) {
            return NextResponse.json({
                success: false,
                error: "Category, semester name, name, and code are required"
            }, { status: 400 });
        }

        // Verify semester exists for this category
        const semester = await db.select().from(semestersTable)
            .where(and(
                eq(semestersTable.name, semesterName),
                eq(semestersTable.category, category)
            ));

        if (semester.length === 0) {
            return NextResponse.json({
                success: false,
                error: `Semester '${semesterName}' not found for course '${category}'. Please create the semester first.`
            }, { status: 404 });
        }

        // Create new subject
        const newSubject = await db.insert(subjectsTable).values({
            category,
            semesterName,
            name,
            code: code.toUpperCase(),
            description: description || `Comprehensive study of ${name}`,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        // Auto-create Google Drive folder for this subject asynchronously
        createDriveFolderForEntity({
            courseCategory: category,
            semesterName: semesterName,
            subjectName: name,
            subjectCode: code.toUpperCase()
        }).catch(err => console.warn(err));

        return NextResponse.json({
            success: true,
            message: "Subject added successfully",
            subject: newSubject[0]
        });

    } catch (error) {
        console.error(' Error adding subject:', error);
        return NextResponse.json({
            success: false,
            error: "Failed to add subject",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE - Delete subject
export async function DELETE(request) {
    try {
        const { isAdmin, error } = await checkAdminAccess();

        if (!isAdmin) {
            return NextResponse.json({
                success: false,
                error: error || "Unauthorized access"
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({
                success: false,
                error: "Subject ID is required"
            }, { status: 400 });
        }

        await db.delete(subjectsTable).where(eq(subjectsTable.id, parseInt(id)));

        return NextResponse.json({
            success: true,
            message: "Subject deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting subject:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to delete subject"
        }, { status: 500 });
    }
}

