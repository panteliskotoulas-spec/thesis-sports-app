import {
  summarizeRatings,
  type ReviewEntry,
  type ReviewInput,
  type ReviewPage,
  type SubmitReviewResult,
} from '@/lib/reviews/review';

const MOCK_REVIEWS: ReviewEntry[] = [
  {
    id: 'mock-1',
    reviewerName: 'Μαρία Κ.',
    rating: 5,
    comment: 'Εξαιρετικό γήπεδο, πολύ καλός φωτισμός και καθαρά αποδυτήρια.',
    createdAt: new Date('2026-09-28T18:30:00Z'),
  },
  {
    id: 'mock-2',
    reviewerName: 'Γιώργος Π.',
    rating: 4,
    comment: 'Καλή επιφάνεια. Θα ήθελα λίγο περισσότερο χώρο στάθμευσης.',
    createdAt: new Date('2026-09-24T17:10:00Z'),
  },
  {
    id: 'mock-3',
    reviewerName: 'Νίκος Α.',
    rating: 5,
    comment: null,
    createdAt: new Date('2026-09-19T20:00:00Z'),
  },
  {
    id: 'mock-4',
    reviewerName: 'Ελένη Σ.',
    rating: 3,
    comment: 'Εντάξει συνολικά, αλλά το γήπεδο ήταν λίγο βρεγμένο.',
    createdAt: new Date('2026-09-14T16:45:00Z'),
  },
  {
    id: 'mock-5',
    reviewerName: 'Δημήτρης Λ.',
    rating: 4,
    comment: 'Εύκολη κράτηση και σωστή ώρα έναρξης.',
    createdAt: new Date('2026-09-09T19:15:00Z'),
  },
  {
    id: 'mock-6',
    reviewerName: 'Άννα Τ.',
    rating: 5,
    comment: 'Το αγαπημένο μας γήπεδο για τα Σαββατοκύριακα.',
    createdAt: new Date('2026-09-02T10:00:00Z'),
  },
  {
    id: 'mock-7',
    reviewerName: 'Κώστας Μ.',
    rating: 2,
    comment: 'Τα φώτα έσβηναν κατά διαστήματα.',
    createdAt: new Date('2026-08-27T21:20:00Z'),
  },
  {
    id: 'mock-8',
    reviewerName: 'Σοφία Δ.',
    rating: 4,
    comment: null,
    createdAt: new Date('2026-08-21T18:00:00Z'),
  },
];

export function mockListFieldReviews(
  offset: number,
  limit: number,
): ReviewPage {
  return {
    items: MOCK_REVIEWS.slice(offset, offset + limit),
    total: MOCK_REVIEWS.length,
    rating: summarizeRatings(MOCK_REVIEWS.map((review) => review.rating)),
  };
}

export async function mockSubmitFieldReview(
  input: ReviewInput,
): Promise<SubmitReviewResult> {
  void input;
  await new Promise((resolve) => setTimeout(resolve, 600));
  return 'ok';
}
