"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function UserAutoRegister() {
    const { user, isLoaded, isSignedIn } = useUser();
    const [registered, setRegistered] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        async function registerUser() {
            if (!isLoaded || !isSignedIn || !user || registered || isRegistering) {
                return;
            }

            // Check if user was already registered in this session
            const sessionKey = `user_registered_${user.id}`;
            const alreadyRegistered = sessionStorage.getItem(sessionKey);

            if (alreadyRegistered) {
                setRegistered(true);
                return;
            }

            setIsRegistering(true);

            try {
                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const result = await response.json();
                    if (result.success) {
                        console.log('User registration check completed:', result.message);
                    } else {
                        console.error('User registration failed:', result.error);
                    }
                } else {
                    console.warn('User registration endpoint returned non-JSON response:', response.status);
                }
            } catch (error) {
                console.error('Error during user registration:', error);
            } finally {
                // Always mark as registered to prevent infinite loop retries on errors
                setRegistered(true);
                sessionStorage.setItem(sessionKey, 'true');
                setIsRegistering(false);
            }
        }

        registerUser();
    }, [isLoaded, isSignedIn, user?.id, registered, isRegistering]);

    // This component doesn't render anything visible
    return null;
}