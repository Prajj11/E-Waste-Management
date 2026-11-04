import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Assigned', 'Collected', 'Processing', 'Recycled', 'Disposed'],
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required'],
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    condition: {
      type: String,
      enum: {
        values: ['Working', 'Damaged', 'Dead'],
        message: '{VALUE} is not a valid condition',
      },
      required: [true, 'Item condition is required'],
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
    },
    preferredDate: {
      type: String, // Stored as YYYY-MM-DD
      required: [true, 'Preferred pickup date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Assigned', 'Collected', 'Processing', 'Recycled', 'Disposed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Pending',
    },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    scheduledDate: {
      type: String, // YYYY-MM-DD
      default: null,
    },
    collectedOn: {
      type: String, // YYYY-MM-DD
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: null,
    },
    history: {
      type: [statusHistorySchema],
      default: () => [{ status: 'Pending', at: new Date() }],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;

        // If populated objects exist, extract their display names and IDs
        if (ret.userId && typeof ret.userId === 'object') {
          ret.userName = ret.userId.fullName || null;
          ret.userId = ret.userId._id ? ret.userId._id.toString() : ret.userId.id || ret.userId;
        }
        if (ret.categoryId && typeof ret.categoryId === 'object') {
          ret.categoryName = ret.categoryId.name || null;
          ret.categoryId = ret.categoryId._id ? ret.categoryId._id.toString() : ret.categoryId.id || ret.categoryId;
        }
        if (ret.collectorId && typeof ret.collectorId === 'object') {
          ret.collectorName = ret.collectorId.fullName || null;
          ret.collectorId = ret.collectorId._id ? ret.collectorId._id.toString() : ret.collectorId.id || ret.collectorId;
        }

        // Ensure createdAt is an ISO string
        if (ret.createdAt instanceof Date) {
          ret.createdAt = ret.createdAt.toISOString();
        }

        // Ensure history timestamps are formatted ISO strings
        if (Array.isArray(ret.history)) {
          ret.history = ret.history.map((h) => ({
            status: h.status,
            at: h.at instanceof Date ? h.at.toISOString() : h.at,
          }));
        }

        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

requestSchema.index({ userId: 1 });
requestSchema.index({ collectorId: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ categoryId: 1 });

const Request = mongoose.model('Request', requestSchema);
export default Request;

