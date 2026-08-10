import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, gt, or, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(req) {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse amount (default 1)
        let amount = 1;
        try {
            const body = await req.json();
            if (body && typeof body.amount === 'number' && body.amount > 0) {
                amount = Math.floor(body.amount);
            }
        } catch (e) {
            // body missing or empty, default to 1
        }

        const userEmail = user?.emailAddresses?.[0]?.emailAddress || '';

        // Fetch existing user to check role and credits (matching by userId OR email)
        let dbUser;
        const existingUsers = await db
            .select()
            .from(usersTable)
            .where(
                userEmail
                    ? or(eq(usersTable.userId, user.id), eq(usersTable.email, userEmail))
                    : eq(usersTable.userId, user.id)
            )
            .limit(1);

        if (existingUsers.length === 0) {
            // Auto-create user if not yet in database
            const [newUser] = await db
                .insert(usersTable)
                .values({
                    userId: user.id,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || 'User',
                    email: userEmail,
                    role: 'student',
                    isActive: true,
                    image: user.imageUrl,
                    credits: 10,
                })
                .returning();
            dbUser = newUser;
        } else {
            dbUser = existingUsers[0];
            // Link userId if user was found by email but userId column was unlinked/missing
            if (dbUser.userId !== user.id) {
                const [updated] = await db
                    .update(usersTable)
                    .set({ userId: user.id, updatedAt: new Date() })
                    .where(eq(usersTable.id, dbUser.id))
                    .returning();
                if (updated) dbUser = updated;
            }
        }

        // Admin bypass: Admins don't lose credits
        if (dbUser.role === 'admin') {
            return NextResponse.json({
                success: true,
                message: "Admin download - no credit deducted",
                user: dbUser,
            });
        }

        // Check if credits are available
        const currentCredits = dbUser.credits ?? 10;
        if (currentCredits < amount) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Requires at least ${amount} credits to download`,
                    credits: currentCredits,
                },
                { status: 403 }
            );
        }

        const updatedUsers = await db
            .update(usersTable)
            .set({
                credits: sql`COALESCE(${usersTable.credits}, 10) - ${amount}`,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(usersTable.id, dbUser.id),
                    gt(usersTable.credits, amount - 1)
                )
            )
            .returning();

        if (updatedUsers.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Not enough credits`,
                    credits: currentCredits,
                },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${amount} credit(s) deducted successfully`,
            user: updatedUsers[0],
        });
    } catch (error) {
        console.error("Error deducting credit:", error);
        return NextResponse.json(
            { success: false, error: "Failed to deduct credit" },
            { status: 500 }
        );
    }
}