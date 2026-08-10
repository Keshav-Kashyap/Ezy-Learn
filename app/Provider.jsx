"use client"

import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { UserDetailContext } from '../context/UserDetailContext'
import { NotificationProvider } from '../context/NotificationContext'
import BuyCreditModal from '../components/BuyCreditModal'

const Provider = ({ children }) => {

    const { user } = useUser();
    const [userDetail, setUserDetail] = useState();
    useEffect(() => {
        user && CreateNewUser();
    }, [user])

    const CreateNewUser = async () => {
        try {
            const result = await axios.post('/api/users/register');
            console.log('User Details:', result.data);
            if (result.data.success) {
                setUserDetail(result.data.user);
            }
        } catch (error) {
            console.error('Error creating/fetching user:', error);
        }
    }

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