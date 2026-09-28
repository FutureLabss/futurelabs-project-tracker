alter type public.ledger_subject_type add value if not exists 'person';

alter type public.ledger_change_type add value if not exists 'person_created';
alter type public.ledger_change_type add value if not exists 'profile_updated';
alter type public.ledger_change_type add value if not exists 'role_changed';
alter type public.ledger_change_type add value if not exists 'status_changed';
alter type public.ledger_change_type add value if not exists 'sessions_revoked';
