import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { semestersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { checkAdminAccess } from "@/lib/admin-auth";
import { createDriveFolderForEntity } from "@/lib/googleDrive";


export async function GET() {
    try {
        const { isAdmin, error } = await checkAdminAccess();

        if (!isAdmin) {
            return NextResponse.json({
                success: false,
                error: error || "Unauthorized access"
            }, { status: 403 });
        }

        const allSemesters = await db.select().from(semestersTable);
        return NextResponse.json({
            success: true,
            semesters: allSemesters
        });
    } catch (error) {
        console.error("Error fetching semesters:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch semesters"
        }, { status: 500 });
    }
}

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
        const { name, category, description } = body;

        if (!name || !category) {
            return NextResponse.json({
                success: false,
                error: "Name and category are required"
            }, { status: 400 });
        }

        const newSemester = await db.insert(semestersTable).values({
            name,
            category,
            description,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        // Auto-create Google Drive folder for this semester asynchronously
        createDriveFolderForEntity({
            courseCategory: category,
            semesterName: name
        }).catch(err => console.warn(err));

        return NextResponse.json({
            success: true,
            semester: newSemester[0],
            message: "Semester created successfully"
        });
    } catch (error) {
        console.error("Error creating semester:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to create semester"
        }, { status: 500 });
    }
}

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
                error: "Semester ID is required"
            }, { status: 400 });
        }

        await db.delete(semestersTable).where(eq(semestersTable.id, parseInt(id)));

        return NextResponse.json({
            success: true,
            message: "Semester deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting semester:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to delete semester"
        }, { status: 500 });
    }
}