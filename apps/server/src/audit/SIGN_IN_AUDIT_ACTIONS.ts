import type { AuditAction } from '@ValenceContracts/schemas/Audit';

const SIGN_IN_AUDIT_ACTIONS: readonly AuditAction[] = [
  'auth.signedIn',
  'auth.signInFailed',
  'auth.signedOut',
];

export { SIGN_IN_AUDIT_ACTIONS };
