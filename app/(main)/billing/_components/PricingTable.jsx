"use client";

import React, { useState } from "react";
import { Check, Mail, Copy, ExternalLink, AlertCircle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const plans = [
    {
        id: "starter_5",
        name: "Starter",
        price: "₹50",
        amount: 50,
        credits: 5,
        badge: "₹10 / credit",
        description: "For quick single notes & subject downloads.",
        features: [
            "5 PDF Note Downloads",
            "Unlimited Online PDF Reader",
            "Free Syllabus Access",
            "Instant Credit Activation"
        ]
    },
    {
        id: "popular_12",
        name: "Popular",
        price: "₹100",
        amount: 100,
        credits: 12,
        badge: "Most Popular",
        description: "Best for semester exam preparation.",
        popular: true,
        features: [
            "12 PDF Note Downloads (+2 Bonus)",
            "Online PDF Reader + AI Assistance",
            "Free Syllabus Access",
            "Instant Credit Activation"
        ]
    },
    {
        id: "mega_35",
        name: "Pro Pack",
        price: "₹250",
        amount: 250,
        credits: 35,
        badge: "Best Value",
        description: "Maximum savings for semester-long prep & ZIP downloads.",
        bestValue: true,
        features: [
            "35 PDF Note Downloads (+10 Bonus)",
            "Supports 'Download All' Bulk ZIPs",
            "Priority AI Queries",
            "No Expiry Date"
        ]
    }
];

export default function PricingTable() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [copied, setCopied] = useState(false);

    const emailAddress = "kashyapkeshav934@gmail.com";

    const handleBuyClick = (plan) => {
        setSelectedPlan(plan);
        setModalOpen(true);
        toast.info("Service in progress! Contact via email for credits.", {
            description: emailAddress
        });
    };

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(emailAddress);
        setCopied(true);
        toast.success("Email copied to clipboard!", { description: emailAddress });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative rounded-2xl border bg-white dark:bg-[#20201e] p-6 flex flex-col justify-between transition-all duration-200 ${
                            plan.popular
                                ? "border-purple-500/60 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30"
                                : "border-gray-200 dark:border-[#353532]"
                        }`}
                    >
                        {(plan.popular || plan.bestValue) && (
                            <div
                                className={`absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-sm ${
                                    plan.popular
                                        ? "bg-gradient-to-r from-purple-600 to-indigo-600"
                                        : "bg-emerald-600"
                                }`}
                            >
                                {plan.badge}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {plan.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="flex items-baseline gap-1.5 pt-1 border-b border-gray-100 dark:border-[#2d2d2a] pb-4">
                                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                    {plan.price}
                                </span>
                                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                    / {plan.credits} Credits
                                </span>
                            </div>

                            <ul className="space-y-2.5 pt-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Button
                            type="button"
                            onClick={() => handleBuyClick(plan)}
                            className={`w-full mt-6 h-10 rounded-xl text-xs font-semibold transition-all ${
                                plan.popular
                                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm"
                                    : "bg-gray-900 hover:bg-black text-white dark:bg-[#2e2e2b] dark:hover:bg-[#383835] dark:text-white border border-gray-800 dark:border-[#3e3e3b]"
                            }`}
                        >
                            <span>Buy {plan.credits} Credits for {plan.price}</span>
                        </Button>
                    </div>
                ))}
            </div>

            {/* Service In Progress Contact Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#20201e] border-gray-200 dark:border-[#353532] text-gray-900 dark:text-white">
                    <DialogHeader className="space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                            <Wrench className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-lg font-bold">
                            Payment Service In Progress
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                            Automated online payment gateway is currently under development. If you need study credits immediately, please contact us via email.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {selectedPlan && (
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#282825] border border-gray-200 dark:border-[#383835] flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Selected Plan: </span>
                                    <strong className="text-purple-600 dark:text-purple-400 font-bold">{selectedPlan.name} ({selectedPlan.credits} Credits)</strong>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">{selectedPlan.price}</span>
                            </div>
                        )}

                        {/* Email Details Card */}
                        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                <Mail className="h-4 w-4" />
                                <span>Support Email Address</span>
                            </div>
                            <p className="text-sm font-mono font-bold select-all text-gray-900 dark:text-white">
                                {emailAddress}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleCopyEmail}
                            className="flex-1 h-9 text-xs border-gray-200 dark:border-[#383835] hover:bg-gray-100 dark:hover:bg-[#282825]"
                        >
                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                            {copied ? "Copied!" : "Copy Email"}
                        </Button>
                        <a
                            href={`mailto:${emailAddress}?subject=Credit%20Purchase%20Request%20(${selectedPlan?.name || 'Credits'})`}
                            className="flex-1"
                        >
                            <Button
                                className="w-full h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                Send Email
                            </Button>
                        </a>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
