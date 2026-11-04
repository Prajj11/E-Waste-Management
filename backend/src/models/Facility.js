import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Facility location is required'],
      trim: true,
    },
    capacityKg: {
      type: Number,
      required: [true, 'Capacity in kg is required'],
      min: [1, 'Capacity must be greater than 0'],
    },
    certification: {
      type: String,
      trim: true,
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

facilitySchema.index({ name: 1 });

const Facility = mongoose.model('Facility', facilitySchema);
export default Facility;

