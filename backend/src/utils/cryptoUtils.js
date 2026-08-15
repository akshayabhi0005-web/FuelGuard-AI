import crypto from 'crypto';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZZ23456789'; // Avoid confusing: O, 0, I, 1

export const generateShortToken = () => {
  let result = '';
  // Generate cryptographically secure random bytes
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    const index = bytes[i] % CHARSET.length;
    result += CHARSET[index];
  }
  // Format as F7K9-X2QP-8M (4-4-2)
  return `${result.substring(0, 4)}-${result.substring(4, 8)}-${result.substring(8, 10)}`;
};

export const hashToken = (token) => {
  if (!token) return '';
  const clean = token.replace(/-/g, '').toUpperCase().trim();
  return crypto.createHash('sha256').update(clean).digest('hex');
};
