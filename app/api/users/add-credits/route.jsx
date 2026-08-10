import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";

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

        const body = await req.json();
        const { creditsToAdd, planName, amount } = body;

        if (!creditsToAdd || typeof creditsToAdd !== 'number' || creditsToAdd <= 0) {
            return NextResponse.json(
                { success: false, error: "Invalid credits amount" },
                { status: 400 }
            );
        }

        // Fetch existing user
        const existingUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.userId, user.id))
            .limit(1);

        if (existingUser.length === 0) {
            return NextResponse.json(
                { success: false, error: "User record not found" },
                { status: 404 }
            );
        }

        // Update credits
        const updatedUsers = await db
            .update(usersTable)
            .set({
                credits: sql`COALESCE(${usersTable.credits}, 0) + ${creditsToAdd}`,
                updatedAt: new Date(),
            })
            .where(eq(usersTable.userId, user.id))
            .returning();

        return NextResponse.json({
            success: true,
            message: `Successfully added ${creditsToAdd} credits!`,
            user: updatedUsers[0],
            addedCredits: creditsToAdd,
            planName: planName || "Credit Plan",
            amountPaid: amount || 0
        });
    } catch (error) {
        console.error("Error adding credits:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process credit purchase" },
            { status: 500 }
        );
    }
}
