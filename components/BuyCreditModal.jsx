"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Mail, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function openBuyCreditModal(plan = null) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-buy-credit-modal", { detail: { plan } }));
    }
}

export default function BuyCreditModal() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [copied, setCopied] = useState(false);

    const emailAddress = "kashyapkeshav934@gmail.com";

    useEffect(() => {
        const handleOpenModal = (event) => {
            if (event?.detail?.plan) {
                setSelectedPlan(event.detail.plan);
            } else {
                setSelectedPlan(null);
            }
            setModalOpen(true);
        };

        window.addEventListener("open-buy-credit-modal", handleOpenModal);

        return () => {
            window.removeEventListener("open-buy-credit-modal", handleOpenModal);
        };
    }, []);

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(emailAddress);
        setCopied(true);
        toast.success("Email copied to clipboard!", { description: emailAddress });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
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
                        href={`mailto:${emailAddress}?subject=Credit%20Purchase%20Request${selectedPlan ? `%20(${selectedPlan.name})` : ''}`}
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
    );
}
