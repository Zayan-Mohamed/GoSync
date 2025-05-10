import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: true,
    enum: ['Route', 'Stop', 'Schedule'], // Track changes for these entities
  },
  entityId: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'add_stop', 'remove_stop', 'toggle_status'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for system-triggered actions
  },
  details: {
    type: Object,
    required: false, // Store additional info (e.g., changed fields)
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;