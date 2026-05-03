import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ArtistDocument = Artist & Document;

/**
 * The Artist schema stores Spotify metadata plus computed (x, y) coordinates.
 *
 * Coordinate Algorithm:
 *   r (radius)  = 100 - popularity          → popular artists near center (0,0)
 *   θ (angle)   = genre_hash(genres) * 2π   → genre determines angular position
 *   x           = r * cos(θ)
 *   y           = r * sin(θ)
 *
 * MongoDB 2dsphere index on `location` enables efficient bounding-box queries.
 */
@Schema({ timestamps: true, collection: 'artists' })
export class Artist {
  // ── Spotify identity ──────────────────────────────────────────────────
  @Prop({ required: true, unique: true, index: true })
  spotify_id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  profile_image!: string;

  @Prop()
  banner_image!: string;

  @Prop({ type: [String], default: [] })
  genres!: string[];

  @Prop({ default: 0, min: 0, max: 100 })
  popularity!: number;

  @Prop({ default: 0 })
  followers!: number;

  @Prop({ default: false })
  is_verified!: boolean;

  // ── Top track preview ─────────────────────────────────────────────────
  @Prop()
  preview_url!: string;       // 30-second clip from Spotify

  @Prop()
  top_track_name!: string;

  @Prop()
  top_track_album_art!: string;

  // ── Spatial coordinates ───────────────────────────────────────────────
  /** Flat Cartesian x coordinate (derived from popularity + genre angle). */
  @Prop({ required: true })
  x!: number;

  /** Flat Cartesian y coordinate (derived from popularity + genre angle). */
  @Prop({ required: true })
  y!: number;

  /**
   * GeoJSON Point for MongoDB 2dsphere index.
   * coordinates: [longitude = x, latitude = y]
   * We treat our canvas space as if it were a geographic plane.
   */
}

export const ArtistSchema = SchemaFactory.createForClass(Artist);

// Flat 2d index on x,y for simple Cartesian bounding-box queries
ArtistSchema.index({ x: 1, y: 1 });
