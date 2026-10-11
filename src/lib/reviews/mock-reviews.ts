import {
  summarizeRatings,
  type ReviewEntry,
  type ReviewRating,
} from './review';

const NAMES = [
  'Μαρία Κ.',
  'Νίκος Π.',
  'Έλενα Δ.',
  'Γιώργος Α.',
  'Σοφία Μ.',
  'Δημήτρης Τ.',
  'Άννα Λ.',
  'Κώστας Β.',
];

const COMMENTS: (string | null)[] = [
  'Πολύ καλός, εξήγησε τα πάντα ξεκάθαρα και προσάρμοσε την προπόνηση στο επίπεδό μας.',
  'Ακριβής στις ώρες και με πολύ καλή οργάνωση.',
  'Καλή προπόνηση, θα ήθελα λίγο περισσότερη ώρα στις ασκήσεις.',
  null,
  'Εξαιρετική εμπειρία, θα ξανακλείσω σίγουρα.',
  'Ήταν εντάξει, αλλά ξεκίνησε με μικρή καθυστέρηση.',
  'Μας βοήθησε πολύ να βελτιώσουμε την τεχνική μας.',
  null,
];

const RATINGS = [5, 5, 4, 4, 5, 3, 5, 4];

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) % 100_000;
  }
  return result;
}

export function getMockCoachReviews(coachId: string): ReviewEntry[] {
  const count = hash(coachId) % 9;
  const now = Date.now();

  return Array.from({ length: count }, (_, index) => ({
    id: `${coachId}-review-${index}`,
    reviewerName: NAMES[index % NAMES.length],
    rating: RATINGS[index % RATINGS.length],
    comment: COMMENTS[index % COMMENTS.length],
    createdAt: new Date(now - (index + 1) * 6 * 86_400_000),
  }));
}

export function getMockCoachRating(coachId: string): ReviewRating | null {
  return summarizeRatings(getMockCoachReviews(coachId).map((r) => r.rating));
}
