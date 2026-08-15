-- invitations.invited_by bloquait la suppression des users Auth
-- ("Database error deleting user").
alter table public.invitations
  drop constraint if exists invitations_invited_by_fkey;

alter table public.invitations
  add constraint invitations_invited_by_fkey
  foreign key (invited_by) references auth.users(id) on delete set null;
