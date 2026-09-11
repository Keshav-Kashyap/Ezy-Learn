"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';

const ReviewPromptModal = ({ isOpen, onClose, onReviewSubmitted }) => {
    const { user } = useUser();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Simple validation - just need rating and some text
    const isFormValid = rating > 0 && reviewText.trim().length > 0;

    const handleSubmitReview = async () => {
        if (!rating) {
            toast.error('Please select a rating');
            return;
        }
        if (!reviewText.trim()) {
            toast.error('Please write your review');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating,
                    reviewText: reviewText.trim(),
                    userName: user?.fullName || user?.firstName || 'Anonymous',
                    userEmail: user?.emailAddresses?.[0]?.emailAddress
                })
            });

            const data = await response.json();
            if (data.success) {
                // Show success message
                toast.success('🎉 Thank You for Your Review!', {
                    description: ' Your feedback helps us improve our service!',
                    duration: 4000,
                });

                // Reset form
                setRating(0);
                setReviewText('');

                // Close modal immediately
                onClose();

                // Trigger download callback after modal closes
                if (onReviewSubmitted) {
                    // Call immediately, don't wait
                    onReviewSubmitted();
                }
            } else {
                toast.error(data.error || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const getRatingText = (rating) => {
        switch (rating) {
            case 5: return 'Excellent!';
            case 4: return 'Very Good!';
            case 3: return 'Good';
            case 2: return 'Fair';
            case 1: return 'Poor';
            default: return '';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500" />
                        Help Us Improve! 🙏
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Your download has started! If you have a moment, please share your experience to help us serve you better.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Rating Stars */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Your Rating *</Label>
                        <div className="flex gap-2 justify-center py-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={`w-12 h-12 transition-colors ${(hoverRating || rating) >= star
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center text-lg font-medium text-yellow-600 dark:text-yellow-400"
                            >
                                {getRatingText(rating)}
                            </motion.p>
                        )}
                    </div>

                    {/* Review Text */}
                    <div className="space-y-2">
                        <Label htmlFor="reviewText" className="text-base font-semibold">
                            Share Your Experience *
                        </Label>
                        <Textarea
                            id="reviewText"
                            placeholder="Write your thoughts about the website..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={5}
                            className="resize-none text-base"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-green-800 dark:text-green-200">
                            💡 <strong>Optional:</strong> Your feedback helps us improve! You can skip this and review later, or take a moment to share your thoughts.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Maybe Later
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmitReview}
                            disabled={!isFormValid || submitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Review
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewPromptModal;
