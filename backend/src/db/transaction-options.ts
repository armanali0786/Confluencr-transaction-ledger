/** Writers queue on account row locks, so allow time to wait for them under contention. */
export const LEDGER_TRANSACTION_OPTIONS = { maxWait: 5_000, timeout: 10_000 };
