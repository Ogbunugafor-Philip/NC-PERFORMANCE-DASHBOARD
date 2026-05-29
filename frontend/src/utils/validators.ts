export const passwordPattern = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const daoCodePattern = /^[A-Za-z0-9_-]{2,64}$/;

export const passwordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 35;
  if (/\d/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  if (/[A-Z]/.test(password)) score += 15;
  return Math.min(score, 100);
};
