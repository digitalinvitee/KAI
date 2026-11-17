/**
 * Links that hand a message to the guest's own apps: WhatsApp, email, phone.
 * No backend is involved; the guest sends the message themselves. With no
 * restaurant number or address set (the concept), the apps open without a
 * recipient, so nothing can reach a stranger by accident.
 */
const digits = (value) => String(value ?? '').replace(/\D/g, '');

export const whatsappHref = (number, message = '') =>
  `https://wa.me/${digits(number)}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

export const mailHref = (address = '', subject = '', body = '') => {
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${encodeURI(String(address ?? '').trim())}${params.length ? `?${params.join('&')}` : ''}`;
};

export const telHref = (phone) => `tel:${String(phone ?? '').replace(/[^\d+]/g, '')}`;
