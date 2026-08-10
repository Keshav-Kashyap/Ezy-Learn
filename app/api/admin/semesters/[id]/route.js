import { db } from '@/config/db';
import { semestersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, semesterNumber, description } = body;

        // Validate required fields
        if (!name?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Semester name is required' },
                { status: 400 }
            );
        }

        // Check if semester exists
        const existing = await db.select()
            .from(semestersTable)
            .where(eq(semestersTable.id, parseInt(id)))
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Semester not found' },
                { status: 404 }
            );
        }

        // Check for duplicate semester name in same category
        const duplicate = await db.select()
            .from(semestersTable)
            .where(eq(semestersTable.name, name.trim()))
            .limit(1);

        if (duplicate.length > 0 && duplicate[0].id !== parseInt(id) && duplicate[0].category === existing[0].category) {
            return NextResponse.json(
                { success: false, error: 'A semester with this number already exists in this course' },
                { status: 400 }
            );
        }

        // Update semester
        const updated = await db.update(semestersTable)
            .set({
                name: name.trim(),
                description: description?.trim() || null,
                updatedAt: new Date()
            })
            .where(eq(semestersTable.id, parseInt(id)))
            .returning();

        return NextResponse.json({
            success: true,
            data: updated[0],
            message: 'Semester updated successfully'
        });

    } catch (error) {
        console.error('Error updating semester:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update semester' },
            { status: 500 }
        );
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        // Check if semester exists
        const existing = await db.select()
            .from(semestersTable)
            .where(eq(semestersTable.id, parseInt(id)))
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Semester not found' },
                { status: 404 }
            );
        }

        // Delete semester (cascade will handle related subjects and materials)
        await db.delete(semestersTable)
            .where(eq(semestersTable.id, parseInt(id)));

        return NextResponse.json({
            success: true,
            message: 'Semester deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting semester:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete semester' },
            { status: 500 }
        );
    }
}
