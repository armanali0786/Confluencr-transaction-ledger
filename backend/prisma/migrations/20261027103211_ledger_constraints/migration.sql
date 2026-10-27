-- Integrity rules Prisma's schema language cannot express. These are the last line
-- of defence: the service layer validates first, the database guarantees.

-- Accounts --------------------------------------------------------------------
ALTER TABLE "accounts"
  ADD CONSTRAINT "accounts_balance_non_negative" CHECK ("balance" >= 0),
  ADD CONSTRAINT "accounts_name_not_blank" CHECK (char_length(btrim("name")) > 0);

-- Transactions ----------------------------------------------------------------
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "transactions_reference_id_not_blank" CHECK (char_length(btrim("reference_id")) > 0);

-- Transfers -------------------------------------------------------------------
ALTER TABLE "transfers"
  ADD CONSTRAINT "transfers_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "transfers_distinct_accounts" CHECK ("from_account_id" <> "to_account_id"),
  ADD CONSTRAINT "transfers_reference_id_not_blank" CHECK (char_length(btrim("reference_id")) > 0);

-- Immutability ----------------------------------------------------------------
-- Ledger rows are append-only. Statement-level triggers reject every UPDATE/DELETE,
-- even ones matching zero rows, so mutation attempts fail loudly.
CREATE FUNCTION "prevent_transaction_mutation"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% on "%" is not allowed: ledger records are immutable', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER "transactions_prevent_mutation"
  BEFORE UPDATE OR DELETE ON "transactions"
  FOR EACH STATEMENT EXECUTE FUNCTION "prevent_transaction_mutation"();

CREATE TRIGGER "transfers_prevent_mutation"
  BEFORE UPDATE OR DELETE ON "transfers"
  FOR EACH STATEMENT EXECUTE FUNCTION "prevent_transaction_mutation"();

-- Timestamps ------------------------------------------------------------------
-- Balance updates are issued as raw SQL, which bypasses Prisma's @updatedAt.
CREATE FUNCTION "set_updated_at"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER "accounts_set_updated_at"
  BEFORE UPDATE ON "accounts"
  FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
