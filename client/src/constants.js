// Frontend Constants for EkaaRegistrationPortal
// These should ideally be kept in sync with backend enums and models.

export const ROLES = {
    ADMIN: 'admin',
    INSTRUCTOR: 'instructor',
    FINANCE: 'finance',
    MANAGEMENT: 'management',
    REGISTRATION_ADMIN: 'registration_admin'
};

export const PROGRAM_LEVELS = [
    'Level 1 – Decode Your Mind',
    'Level 2 – Decode Your Behavior',
    'Level 3 – Decode Your Relationship',
    'Level 4 – Decode Your Blueprint'
];

export const PAYMENT_STATUSES = {
    PENDING: 'Pending',
    PAID: 'Paid',
    EMERGENCY_OVERRIDE: 'Emergency Override'
};

export const CERTIFICATE_STATUSES = {
    PENDING: 'Pending',
    ISSUED: 'Issued',
    REVOKED: 'Revoked'
};

export const MODE_OPTIONS = {
    ONLINE: 'Online Training',
    OFFLINE: 'Offline'
};

export const REGIONS = {
    IN: 'INDIA',
    US: 'USA',
    UAE: 'UAE'
};
