"use client";

import { useUser } from "@clerk/nextjs";
import { useUserProfile } from "@/hooks/useUser";

export default function UserAutoRegister() {
    const { user, isLoaded, isSignedIn } = useUser();

    // Deduplicated register query via React Query
    useUserProfile({ enabled: isLoaded && isSignedIn && !!user });

    return null;
}