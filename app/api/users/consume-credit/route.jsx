import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, gt, sql } from "drizzle-orm";

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

        // Fetch existing user to check role and credits
        const existingUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.userId, user.id))
            .limit(1);

        if (existingUser.length === 0) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const dbUser = existingUser[0];

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
                    eq(usersTable.userId, user.id),
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