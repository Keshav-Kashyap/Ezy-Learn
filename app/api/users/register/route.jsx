import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable, userProfileTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, or } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Retry helper for database operations
 */
async function retryDbOperation(operation, maxRetries = 3) {
    let lastError;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            const isTimeoutError = error.message?.includes('Connect Timeout') ||
                error.message?.includes('fetch failed') ||
                error.code === 'UND_ERR_CONNECT_TIMEOUT';

            if (i < maxRetries && isTimeoutError) {
                const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s
                console.log(`Database timeout, retrying in ${delay}ms (attempt ${i + 2}/${maxRetries + 1})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else if (i < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
    throw lastError;
}

// Helper to ensure user_profile table exists
async function ensureUserProfileTable() {
    try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`
            CREATE TABLE IF NOT EXISTS user_profile (
                id SERIAL PRIMARY KEY,
                "userId" VARCHAR(255) UNIQUE,
                name VARCHAR(255),
                course VARCHAR(100),
                semester VARCHAR(100),
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
    } catch (err) {
        console.error("Error ensuring user_profile table:", err);
    }
}

export async function POST(req) {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json({
                success: false,
                error: "Not logged in"
            }, { status: 401 });
        }

        const userEmail = user.emailAddresses?.[0]?.emailAddress || '';
        await ensureUserProfileTable();

        // Check if request body contains profile update data
        let body = null;
        try {
            if (req && req.headers.get("content-type")?.includes("application/json")) {
                body = await req.json();
            }
        } catch (e) {
            // Empty body when called as zero-arg POST
        }

        // 1. Get or Create DB User in usersTable
        let dbUser;
        const existingUsers = await retryDbOperation(async () => {
            if (userEmail) {
                return await db.select()
                    .from(usersTable)
                    .where(or(eq(usersTable.userId, user.id), eq(usersTable.email, userEmail)))
                    .limit(1);
            }
            return await db.select()
                .from(usersTable)
                .where(eq(usersTable.userId, user.id))
                .limit(1);
        });

        if (existingUsers.length > 0) {
            dbUser = existingUsers[0];
            if (dbUser.credits == null) {
                const updated = await db.update(usersTable)
                    .set({ credits: 10 })
                    .where(eq(usersTable.userId, user.id))
                    .returning();
                dbUser = updated[0];
            }
        } else {
            const inserted = await retryDbOperation(async () => {
                return await db.insert(usersTable).values({
                    userId: user.id,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
                    email: userEmail,
                    role: 'student',
                    isActive: true,
                    image: user.imageUrl,
                    credits: 10
                }).returning();
            });
            dbUser = inserted[0];
        }

        // 2. If body contains profile updates (name, course, semester)
        if (body && (body.name || body.course)) {
            const { name, course, semester } = body;
            const finalSemester = (course === 'Other' || course === 'Others') ? (semester || "N/A") : semester;

            const existingProfiles = await db.select()
                .from(userProfileTable)
                .where(eq(userProfileTable.userId, user.id))
                .limit(1);

            let savedProfile;
            if (existingProfiles.length > 0) {
                const updated = await db.update(userProfileTable)
                    .set({
                        name: name ? name.trim() : dbUser.name,
                        course: course ? course.trim() : existingProfiles[0].course,
                        semester: finalSemester ? finalSemester.trim() : existingProfiles[0].semester,
                        updatedAt: new Date()
                    })
                    .where(eq(userProfileTable.userId, user.id))
                    .returning();
                savedProfile = updated[0];
            } else {
                const inserted = await db.insert(userProfileTable)
                    .values({
                        userId: user.id,
                        name: name ? name.trim() : dbUser.name,
                        course: course ? course.trim() : "Other",
                        semester: finalSemester ? finalSemester.trim() : "N/A"
                    })
                    .returning();
                savedProfile = inserted[0];
            }

            if (name) {
                await db.update(usersTable)
                    .set({ name: name.trim(), updatedAt: new Date() })
                    .where(eq(usersTable.userId, user.id));
                dbUser.name = name.trim();
            }

            return NextResponse.json({
                success: true,
                message: "Profile updated successfully",
                user: dbUser,
                hasProfile: true,
                exists: true,
                profile: savedProfile
            });
        }

        // 3. Check userProfileTable to verify if user profile exists
        const profiles = await db.select()
            .from(userProfileTable)
            .where(eq(userProfileTable.userId, user.id))
            .limit(1);

        const hasProfile = profiles.length > 0;
        const profile = hasProfile ? profiles[0] : null;

        return NextResponse.json({
            success: true,
            message: hasProfile ? "User and profile exist" : "User registered, profile pending",
            user: dbUser,
            hasProfile: hasProfile,
            exists: hasProfile,
            profile: profile
        });

    } catch (error) {
        console.error('Error in /api/users/register:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to register/fetch user'
        }, { status: 500 });
    }
}