import AuditLog from "../models/AuditLog.js";

export const logAuditAction = async ({
  actorId,
  actorRole,
  action,
  entityType,
  entityId,
  claimId,
  metadata = {},
}) => {
  try {
    return await AuditLog.create({
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      claimId,
      metadata,
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
    return null;
  }
};