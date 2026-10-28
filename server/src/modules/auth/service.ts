import { User, type IUser } from './model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  searchSchema,
} from './schema.js';

const { sign } = jwt;

export function userDTO(user: IUser) {
  return {
    id: user._id.toString(),
    displayName: user.displayName,
    email: user.email,
    avatar: user.avatar ?? undefined,
    about: user.about ?? undefined,
    createdAt: user.createdAt,
  };
}

export function publicUserDTO(user: IUser) {
  return {
    id: user._id.toString(),
    displayName: user.displayName,
    avatar: user.avatar,
    about: user.about,
  };
}

// 12 is a reasonable bcrypt work factor (≈80-100ms hashing).
const SALT_ROUNDS = 12;

export async function register(data: {
  displayName: string;
  email: string;
  password: string;
}) {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    throw parsed.error;
  }

  const existing = await User.findOne({
    email: parsed.data.email.toLowerCase().trim(),
  });
  if (existing) {
    throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');
  }

  const passwordHash = await hash(parsed.data.password, SALT_ROUNDS);
  const user = await User.create({
    displayName: parsed.data.displayName.trim(),
    email: parsed.data.email.toLowerCase().trim(),
    passwordHash,
  });

  const signOptions: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };
  const token = sign(
    { userId: user._id.toString(), email: user.email },
    config.jwtSecret,
    signOptions
  );

  return { user: userDTO(user), token };
}
const { compare, hash } = bcrypt;
export async function login(data: { email: string; password: string }) {
  loginSchema.parse(data);

  const user = await User.findOne({ email: data.email.toLowerCase().trim() });
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await compare(data.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const signOptions: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };
  const token = sign(
    { userId: user._id.toString(), email: user.email },
    config.jwtSecret,
    signOptions
  );

  return { user: userDTO(user), token };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return { user: userDTO(user) };
}

export async function updateProfile(
  userId: string,
  data: { displayName?: string; about?: string; avatar?: string | null }
) {
  updateProfileSchema.parse(data);

  const updates: Partial<
    Pick<IUser, 'displayName' | 'about' | 'avatar'>
  > = {};
  if (data.displayName !== undefined) updates.displayName = data.displayName.trim();
  if (data.about !== undefined) updates.about = data.about;
  if (data.avatar !== undefined) updates.avatar = data.avatar || undefined;

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, {
    new: true,
    runValidators: true,
    select: '-passwordHash',
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return { user: userDTO(user) };
}

export async function searchUsers(query: string, limit: number) {
  searchSchema.parse({ q: query, limit });

  const regex = new RegExp(query.trim(), 'i');
  const users = await User.find(
    { $or: [{ displayName: regex }, { email: regex }] }
  )
    .limit(Math.min(limit, 20))
    .select('displayName avatar about')
    .sort({ createdAt: -1 });

  return users.map(publicUserDTO);
}
