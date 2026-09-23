export const getTeamMemberRoles = (member) => {
  if (Array.isArray(member?.roles)) {
    return [...new Set(member.roles
      .map(item => typeof item === 'string' ? item : item?.role)
      .filter(Boolean))];
  }
  return member?.role ? [member.role] : [];
};

export const hasTeamMemberRole = (member, role) =>
  getTeamMemberRoles(member).includes(role);

