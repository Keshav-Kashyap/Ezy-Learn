import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, or } from "drizzle-orm";

// Add runtime config
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
                console.log(` Database timeout, retrying in ${delay}ms (attempt ${i + 2}/${maxRetries + 1})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else if (i < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
    throw lastError;
}

export async function POST() {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json({
                success: false,
                error: "Not logged in"
            }, { status: 401 });
        }

        const userEmail = user.emailAddresses?.[0]?.emailAddress || '';
        console.log('User image:', user.imageUrl);

        // Check if user already exists by Clerk ID or email with retry
        const existingUser = await retryDbOperation(async () => {
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

        if (existingUser.length > 0) {
            if (existingUser[0].credits == null) {
                const normalizedUser = await db.update(usersTable)
                    .set({ credits: 10 })
                    .where(eq(usersTable.userId, user.id))
                    .returning();

                return NextResponse.json({
                    success: true,
                    message: "User already exists",
                    user: normalizedUser[0],
                    isNew: false
                });
            }

            return NextResponse.json({
                success: true,
                message: "User already exists",
                user: existingUser[0],
                isNew: false
            });
        }

        // Create new user in database with retry
        const newUser = await retryDbOperation(async () => {
            return await db.insert(usersTable).values({
                userId: user.id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
                email: userEmail,
                role: 'student', // Default role
                isActive: true,
                image: user.imageUrl,
                credits: 10 // Default credits
            }).returning();
        });

        console.log(' New user created in database:', {
            userId: user.id,
            email: userEmail,
            name: newUser[0].name,
            image:user.imageUrl
        });

        return NextResponse.json({
            success: true,
            message: "User created successfully",
            user: newUser[0],
            isNew: true
        });

    } catch (error) {
        console.error('Error creating user:', error);

        // Return more user-friendly error
        return NextResponse.json({
            success: false,
            error: error.message?.includes('Connect Timeout')
                ? 'Database connection timeout. Please try again in a moment.'
                : error.message || 'Failed to create user'
        }, { status: 500 });
    }
}