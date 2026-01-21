const mongoose = require('mongoose');

const livreurSchema = new mongoose.Schema({
    // Reference to User
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    matricule: {
        type: String,
        unique: true,
        sparse: true
    },
    cin: {
        number: String,
        recto: String, // URL/Path to image
        verso: String  // URL/Path to image
    },
    type: {
        type: String,
        enum: ['independent', 'company', 'employee'],
        default: 'independent'
    },
    parentCompany: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Livreur' // Reference to the company Livreur profile
    },
    associatedVendors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    }],

    // Vehicle information
    vehicleType: {
        type: String,
        enum: ['moto', 'voiture', 'camionnette', 'velo', 'pieton'],
        default: 'moto'
    },

    licensePlate: {
        type: String,
        trim: true
    },

    // Delivery zone
    zone: {
        type: String,
        required: true
    },

    // Additional zones
    additionalZones: [String],

    // Availability status
    isAvailable: {
        type: Boolean,
        default: true
    },

    // Currently assigned orders
    currentOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],

    // Maximum orders at once
    maxOrdersAtOnce: {
        type: Number,
        default: 5
    },

    // Statistics
    stats: {
        totalDeliveries: { type: Number, default: 0 },
        successfulDeliveries: { type: Number, default: 0 },
        failedDeliveries: { type: Number, default: 0 },
        returnedDeliveries: { type: Number, default: 0 },
        averageDeliveryTime: { type: Number, default: 0 }, // in minutes
        rating: { type: Number, default: 5, min: 1, max: 5 },
        totalRatings: { type: Number, default: 0 }
    },

    // Working hours
    workingHours: {
        start: { type: String, default: '08:00' },
        end: { type: String, default: '20:00' }
    },

    // Documents
    documents: {
        idCard: String,
        drivingLicense: String,
        vehicleRegistration: String
    },

    // Bank info for payments
    bankInfo: {
        bankName: String,
        accountNumber: String,
        rib: String
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'suspended', 'inactive'],
        default: 'pending'
    },

    // Notes
    notes: String

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for success rate
livreurSchema.virtual('successRate').get(function () {
    if (this.stats.totalDeliveries === 0) return 100;
    return Math.round((this.stats.successfulDeliveries / this.stats.totalDeliveries) * 100);
});

// Method to check if can accept more orders
livreurSchema.methods.canAcceptOrder = function () {
    return this.isAvailable &&
        this.status === 'approved' &&
        this.currentOrders.length < this.maxOrdersAtOnce;
};

// Method to update stats after delivery
livreurSchema.methods.recordDelivery = async function (success, deliveryTime = 0) {
    this.stats.totalDeliveries += 1;

    if (success) {
        this.stats.successfulDeliveries += 1;
        // Update average delivery time
        const totalTime = this.stats.averageDeliveryTime * (this.stats.successfulDeliveries - 1) + deliveryTime;
        this.stats.averageDeliveryTime = Math.round(totalTime / this.stats.successfulDeliveries);
    } else {
        this.stats.failedDeliveries += 1;
    }

    await this.save();
};

// Index
livreurSchema.index({ userId: 1 });
livreurSchema.index({ zone: 1, isAvailable: 1 });
livreurSchema.index({ status: 1 });

module.exports = mongoose.model('Livreur', livreurSchema);
