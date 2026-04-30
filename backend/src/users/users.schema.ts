// ── users.schema.ts ───────────────────────────────────────────────────────────
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string; // bcrypt hash

  /** Saved artist IDs (the user's library) */
  @Prop({ type: [String], default: [] })
  library: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
