-- Audit types for manager workflows. Kept in their own migration because a new
-- enum value cannot be used in the transaction that adds it.
alter type public.ledger_change_type add value if not exists 'complexity_changed';
alter type public.ledger_change_type add value if not exists 'task_reopened';
