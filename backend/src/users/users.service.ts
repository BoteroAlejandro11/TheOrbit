// ── users.service.ts ──────────────────────────────────────────────────────────
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './users.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: { username: string; email: string; password: string }): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel.findById(id).select('-password');
  }

  async getProfile(userId: string) {
    return this.userModel.findById(userId).select('-password').lean();
  }

  async addToLibrary(userId: string, trackId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { library: trackId } },
      { new: true },
    ).select('-password');
  }

  async removeFromLibrary(userId: string, trackId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { library: trackId } },
      { new: true },
    ).select('-password');
  }
}
