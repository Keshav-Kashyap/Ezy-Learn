import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, or, sql } from "drizzle-orm";

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

        const userEmail = user?.emailAddresses?.[0]?.emailAddress || '';

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
            if (dbUser.userId !== user.id) {
                const [updated] = await db
                    .update(usersTable)
                    .set({ userId: user.id, updatedAt: new Date() })
                    .where(eq(usersTable.id, dbUser.id))
                    .returning();
                if (updated) dbUser = updated;
            }
        }

        // Update credits
        const updatedUsers = await db
            .update(usersTable)
            .set({
                credits: sql`COALESCE(${usersTable.credits}, 0) + ${creditsToAdd}`,
                updatedAt: new Date(),
            })
            .where(eq(usersTable.id, dbUser.id))
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
