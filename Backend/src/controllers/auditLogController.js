import AuditLog from '../models/auditLogModel.js';

// Log an action to the audit log
export const logAction = async ({ entityType, entityId, action, userId, details }) => {
  try {
    await AuditLog.create({
      entityType,
      entityId,
      action,
      userId,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
};

// Get audit logs for a specific entity or criteria
export const getAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId, startDate, endDate, action } = req.query;
    const query = {};

    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (action) query.action = action;
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .lean();

    res.status(200).json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs', details: error.message });
  }
};