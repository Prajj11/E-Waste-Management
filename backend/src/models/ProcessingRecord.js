import mongoose from 'mongoose';

const processingRecordSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: [true, 'Request ID is required'],
      unique: true,
    },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility',
      required: [true, 'Facility ID is required'],
    },
    weightKg: {
      type: Number,
      required: [true, 'Weight in kg is required'],
      min: [0.01, 'Weight must be greater than 0'],
    },
    processStatus: {
      type: String,
      enum: {
        values: ['In Progress', 'Completed'],
        message: '{VALUE} is not a valid processing status',
      },
      default: 'In Progress',
    },
    finalStatus: {
      type: String,
      enum: {
        values: ['Recycled', 'Disposed', null],
        message: '{VALUE} is not a valid final status',
      },
      default: null,
    },
    processedOn: {
      type: String, // YYYY-MM-DD
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;

        // If populated, extract joined display fields
        if (ret.requestId && typeof ret.requestId === 'object') {
          ret.itemName = ret.requestId.itemName || null;
          ret.categoryName =
            ret.requestId.categoryName ||
            (ret.requestId.categoryId && typeof ret.requestId.categoryId === 'object'
              ? ret.requestId.categoryId.name
              : null);
          ret.requestId = ret.requestId._id ? ret.requestId._id.toString() : ret.requestId.id || ret.requestId;
        }
        if (ret.facilityId && typeof ret.facilityId === 'object') {
          ret.facilityName = ret.facilityId.name || null;
          ret.facilityId = ret.facilityId._id ? ret.facilityId._id.toString() : ret.facilityId.id || ret.facilityId;
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

processingRecordSchema.index({ facilityId: 1 });

const ProcessingRecord = mongoose.model('ProcessingRecord', processingRecordSchema);
export default ProcessingRecord;
