// Life members are always active. Others need an end date that has not passed.
// No end date means the member never took a membership.
export function hasActiveMembership(member: { is_life_member: number; active_until: string | null }): boolean {
  if (member.is_life_member === 1) return true;
  if (!member.active_until) return false;
  return new Date(member.active_until) >= new Date();
}
