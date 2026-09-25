import { isSameUser } from './authUser';
import { hasTeamMemberRole } from './teamMember';

/**
 * Giao cho người khác: chỉ người phân công được quyết định.
 * Tự phân công: Account khác hoặc PM của chính dự án được quyết định.
 * Người thực hiện/helper không bao giờ được tự quyết định.
 */
export const canDecideTaskOutcome = (task, currentUserId, project = task?.project) => {
  if (!task || !currentUserId) return false;

  const assignerId = task.assignerId || task.assigner?.id;
  const performerIds = [
    task.assigneeId || task.assignee?.id,
    task.helperId || task.helper?.id,
  ].filter(Boolean);

  if (performerIds.some(id => isSameUser(id, currentUserId))) return false;

  const isSelfAssigned = Boolean(
    assignerId && performerIds.some(id => isSameUser(id, assignerId))
  );
  if (!isSelfAssigned) return isSameUser(assignerId, currentUserId);

  const team = project?.team;
  if (isSameUser(team?.teamLead?.id || team?.teamLeadId, currentUserId)) return true;

  return Boolean(team?.members?.some(member =>
    isSameUser(member.user?.id, currentUserId) &&
    (hasTeamMemberRole(member, 'ACCOUNT') || hasTeamMemberRole(member, 'PROJECT_MANAGER'))
  ));
};
