import { db } from '@/config/db';
import { subjectsTable, materialSubjectMappingTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, code, description, credits } = body;

        // Validate required fields
        if (!name?.trim() || !code?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Subject name and code are required' },
                { status: 400 }
            );
        }

        // Check if subject exists
        const existing = await db.select()
            .from(subjectsTable)
            .where(eq(subjectsTable.id, parseInt(id)))
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Subject not found' },
                { status: 404 }
            );
        }

        // Check for duplicate subject code in same semester
        const duplicate = await db.select()
            .from(subjectsTable)
            .where(eq(subjectsTable.code, code.trim().toUpperCase()))
            .limit(1);

        if (duplicate.length > 0 && duplicate[0].id !== parseInt(id) && duplicate[0].semesterName === existing[0].semesterName) {
            return NextResponse.json(
                { success: false, error: 'A subject with this code already exists in this semester' },
                { status: 400 }
            );
        }

        // Update subject
        const updated = await db.update(subjectsTable)
            .set({
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: description?.trim() || null,
                updatedAt: new Date()
            })
            .where(eq(subjectsTable.id, parseInt(id)))
            .returning();

        return NextResponse.json({
            success: true,
            data: updated[0],
            message: 'Subject updated successfully'
        });

    } catch (error) {
        console.error('Error updating subject:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update subject' },
            { status: 500 }
        );
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        // Check if subject exists
        const existing = await db.select()
            .from(subjectsTable)
            .where(eq(subjectsTable.id, parseInt(id)))
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Subject not found' },
                { status: 404 }
            );
        }

        // First, delete all material-subject mappings for this subject
        await db.delete(materialSubjectMappingTable)
            .where(eq(materialSubjectMappingTable.subjectId, parseInt(id)));

        console.log(`✅ Deleted material mappings for subject ${id}`);

        // Then delete the subject
        await db.delete(subjectsTable)
            .where(eq(subjectsTable.id, parseInt(id)));

        console.log(`✅ Subject ${id} deleted successfully`);

        return NextResponse.json({
            success: true,
            message: 'Subject and all related mappings deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting subject:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete subject' },
            { status: 500 }
        );
    }
}
