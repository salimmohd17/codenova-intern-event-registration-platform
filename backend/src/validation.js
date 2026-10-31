export function validateRegistration(body = {}) {
 const errors = {};
 const full_name = String(body.full_name || '').trim();
 const email = String(body.email || '').trim().toLowerCase();
 const organization = String(body.organization || '').trim();
 const interests = Array.isArray(body.interests) ? [...new Set(body.interests.map(v => String(v).trim()).filter(Boolean))] : [];
 if (full_name.length < 2 || full_name.length > 100) errors.full_name = 'Enter a name between 2 and 100 characters.';
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
 if (organization.length < 2 || organization.length > 140) errors.organization = 'Enter a college or organization (2140 characters).';
 if (interests.length < 1 || interests.length > 8 || interests.some(v => v.length > 50)) errors.interests = 'Choose between 1 and 8 domain interests.';
 return { errors, value: { full_name, email, organization, interests } };
}
