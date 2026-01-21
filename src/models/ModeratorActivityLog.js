const mongoose = require('mongoose');

const moderatorActivityLogSchema = new mongoose.Schema({
    moderatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    action: {
        type: String,
        enum: [
            'login',
            'logout',
            'view_reclamation',
            'update_reclamation_status',
            'respond_reclamation',
            'block_user',
            'unblock_user',
            'approve_review',
            'reject_review',
            'delete_review',
            'view_order',
            'update_order_status',
            'view_product',
            'suspend_product',
            'other'
        ],
        required: true
    },

    targetType: {
        type: String,
        enum: ['user', 'vendor', 'product', 'order', 'reclamation', 'review', 'other'],
        default: 'other'
    },

    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'targetModel'
    },

    targetModel: {
        type: String,
        enum: ['User', 'Vendor', 'Product', 'Order', 'Reclamation', 'Review']
    },

    description: {
        type: String,
        maxlength: 500
    },

    metadata: {
        type: mongoose.Schema.Types.Mixed
    },

    ipAddress: String,
    userAgent: String

}, {
    timestamps: true
});

moderatorActivityLogSchema.index({ createdAt: -1 });
moderatorActivityLogSchema.index({ action: 1 });

// Static method to log an activity
moderatorActivityLogSchema.statics.logActivity = async function (data) {
    return this.create(data);
};

module.exports = mongoose.model('ModeratorActivityLog', moderatorActivityLogSchema);
