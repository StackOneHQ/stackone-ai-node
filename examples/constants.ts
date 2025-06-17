/**
 * Centralized account IDs for StackOne examples
 *
 * These account IDs are organized by vertical and can be reused across examples.
 * Update these values with your actual account IDs for each integration.
 */

export const ACCOUNT_IDS = {
  // Human Resources Information System
  HRIS: '46132201201510402136',

  // Applicant Tracking System
  ATS: '46132127373317208518',

  // Customer Relationship Management
  CRM: '46132129512514182883',

  // Document Management System
  DOCUMENTS: '46132143471913690795',

  TEST: {
    VALID: 'test_account_id',
    OVERRIDE: 'test_account_id_override',
    DIRECT: 'test_account_id_direct',
    INVALID: 'invalid_test_account_id',
  },
} as const;

/**
 * Helper function to get account ID by vertical
 */
export const getAccountId = (vertical: keyof typeof ACCOUNT_IDS): string => {
  const accountId = ACCOUNT_IDS[vertical];

  if (typeof accountId === 'string') {
    return accountId;
  }

  // For TEST vertical, return VALID as default
  if (vertical === 'TEST') {
    return ACCOUNT_IDS.TEST.VALID;
  }

  throw new Error(`Invalid vertical: ${vertical}`);
};
