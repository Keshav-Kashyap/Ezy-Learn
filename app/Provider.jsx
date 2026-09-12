"use client"

import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { UserDetailContext } from '../context/UserDetailContext'
import { NotificationProvider } from '../context/NotificationContext'
import BuyCreditModal from '../components/BuyCreditModal'
import { useUserProfile } from '@/hooks/useUser'

const Provider = ({ children }) => {
    const { user, isLoaded } = useUser();
    const [userDetail, setUserDetail] = useState();

    // Use React Query useUserProfile hook for deduplicated user registration & profile fetching
    const { data: profileData } = useUserProfile({ enabled: isLoaded && !!user });

    useEffect(() => {
        if (profileData?.success && profileData.user) {
            setUserDetail(profileData.user);
        }
    }, [profileData]);

    return (
        <div>
            <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
                <NotificationProvider>
                    {children}
                    <BuyCreditModal />
                </NotificationProvider>
            </UserDetailContext.Provider>
        </div>
    )
}

export default Provider