import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { usersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req, { params }) {
    try {
        const user = await currentUser();
        const adminUserId = user?.id;

        if (!adminUserId) {
            return NextResponse.json({ 
                success: false, 
                error: 'Unauthorized' 
            }, { status: 401 });
        }

        // Check if current user is admin
        const [adminUser] = await db.select()
            .from(usersTable)
            .where(eq(usersTable.userId, adminUserId))
            .limit(1);

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Only admins can promote users to admin' 
            }, { status: 403 });
        }

        const { id } = await params;

        // Check if target user exists
        const [targetUser] = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, parseInt(id)))
            .limit(1);

        if (!targetUser) {
            return NextResponse.json({ 
                success: false, 
                error: 'User not found' 
            }, { status: 404 });
        }

        // Check if user is already admin
        if (targetUser.role === 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'User is already an admin' 
            }, { status: 400 });
        }

        // Update user role to admin
        await db.update(usersTable)
            .set({ 
                role: 'admin',
                updatedAt: new Date()
            })
            .where(eq(usersTable.id, parseInt(id)));

        console.log(`✅ User ${id} (${targetUser.name}) promoted to admin by ${adminUser.name}`);

        return NextResponse.json({
            success: true,
            message: 'User successfully promoted to admin',
            data: {
                userId: id,
                name: targetUser.name,
                email: targetUser.email,
                newRole: 'admin'
            }
        });

    } catch (error) {
        console.error('❌ Error promoting user to admin:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to update user role' 
        }, { status: 500 });
    }
}
