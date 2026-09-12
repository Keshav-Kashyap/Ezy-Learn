"use client"

import React, { useContext } from 'react'
import { Coins, ShieldCheck, Check } from 'lucide-react'
import { UserDetailContext } from '@/context/UserDetailContext'
import PricingTable from './_components/PricingTable'

const Billing = () => {
    const { userDetail } = useContext(UserDetailContext) || {};
    const isAdmin = userDetail?.role === 'admin';
    const credits = userDetail?.credits ?? 0;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    Credits & Billing
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Purchase study credits for offline note downloads and bulk ZIP access.
                </p>
            </div>

            {/* Current Balance Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-[#353532] bg-white dark:bg-[#20201e] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3 text-center sm:text-left">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Coins className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Balance</span>
                            {isAdmin && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                                    <ShieldCheck className="h-3 w-3" /> ADMIN UNLIMITED
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            {isAdmin ? "Unlimited" : `${credits} Credits`}
                        </p>
                    </div>
                </div>

                {/* Minimal Credit Usage Info Badges */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                    <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#282825] border border-gray-200 dark:border-[#383835]">
                         Online Reader: <strong className="text-emerald-500">FREE</strong>
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#282825] border border-gray-200 dark:border-[#383835]">
                         PDF Download: <strong className="text-purple-500">1 Credit</strong>
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#282825] border border-gray-200 dark:border-[#383835]">
                         Syllabus: <strong className="text-emerald-500">FREE</strong>
                    </span>
                </div>
            </div>

            {/* Pricing Cards */}
            <PricingTable />

            {/* Footer Trust Note */}
            <div className="text-center pt-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-4">
                    <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-500" /> Instant Activation</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-500" /> No Expiry Date</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-500" /> 100% Safe Payment</span>
                </p>
            </div>
        </div>
    )
}

export default Billing