import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: {
        values: ['USER', 'COLLECTOR', 'ADMIN'],
        message: '{VALUE} is not a valid role',
      },
      default: 'USER',
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    vehicleNo: {
      type: String,
      trim: true,
      default: null,
    },
    area: {
      type: String,
      trim: true,
      default: null,
    },
    available: {
      type: Boolean,
      default: true,
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
        delete ret.passwordHash;
        if (ret.createdAt instanceof Date) {
          ret.createdAt = ret.createdAt.toISOString();
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

// Index on role for querying collectors / users
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
