/**
 * Pure validation rules for the demo booking form. Each validator returns
 * an error key (resolved through `booking.errors.*`) or null.
 */
export const LIMITS = Object.freeze({ nameMax: 80, emailMax: 254, requestsMax: 300, phoneMinDigits: 7, phoneMaxDigits: 15 });

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const PHONE_PATTERN = /^\+?[\d\s().\-/]+$/;

export const normaliseSpaces = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

export const validateName = (value) => {
  const name = normaliseSpaces(value);
  if (!name) return 'nameRequired';
  const parts = name.split(' ');
  if (parts.length < 2 || name.length > LIMITS.nameMax || !NAME_PATTERN.test(name)) return 'nameInvalid';
  return null;
};

export const validateEmail = (value) => {
  const email = String(value ?? '').trim();
  if (!email) return 'emailRequired';
  if (email.length > LIMITS.emailMax || !EMAIL_PATTERN.test(email)) return 'emailInvalid';
  return null;
};

export const validatePhone = (value) => {
  const phone = String(value ?? '').trim();
  if (!phone) return 'phoneRequired';
  const digits = phone.replace(/\D/g, '').length;
  if (!PHONE_PATTERN.test(phone) || digits < LIMITS.phoneMinDigits || digits > LIMITS.phoneMaxDigits) return 'phoneInvalid';
  return null;
};

export const validateRequests = (value) =>
  String(value ?? '').length > LIMITS.requestsMax ? 'requestsLong' : null;

export const validateTable = ({ date, time }) => ({
  date: date ? null : 'date',
  time: time ? null : 'time',
});

export const validateDetails = ({ name, email, phone, requests }) => ({
  name: validateName(name),
  email: validateEmail(email),
  phone: validatePhone(phone),
  requests: validateRequests(requests),
});

export const countErrors = (errors) => Object.values(errors).filter(Boolean).length;
