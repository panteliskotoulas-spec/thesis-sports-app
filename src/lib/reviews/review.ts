export const REVIEW_COMMENT_MAX = 500;
export const REVIEW_PAGE_SIZE = 5;
export const REVIEW_RATINGS = [1, 2, 3, 4, 5] as const;

export interface ReviewRating {
  average: number;
  count: number;
}

export interface ReviewEntry {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface ReviewPage {
  items: ReviewEntry[];
  total: number;
  rating: ReviewRating | null;
}

export interface ReviewInput {
  rating: number;
  comment: string;
}

export interface SessionReview {
  rating: number;
  comment: string | null;
}

export type SubmitReviewResult = 'ok' | 'conflict' | 'forbidden' | 'error';

export function isValidRating(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function summarizeRatings(ratings: number[]): ReviewRating | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((total, value) => total + value, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
  };
}
