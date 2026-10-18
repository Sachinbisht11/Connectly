import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IUser extends Document {
  displayName: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  about?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export type UserModel = Model<IUser>;

const userSchema = new Schema<IUser, UserModel>(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    avatar: { type: String },
    about: { type: String, maxlength: 500 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

// Never return the password hash in public responses.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...rest } = ret;
    return rest;
  },
});

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
