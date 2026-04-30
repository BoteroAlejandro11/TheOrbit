import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Artist, ArtistDocument } from '../map/artists.schema';
import { SpotifyService } from '../spotify/spotify.service';

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * MapService — the core of the spatial discovery engine.
 *
 * Endpoint: GET /map/artists?x1=&y1=&x2=&y2=
 *
 * The frontend passes the current canvas viewport bounding box.
 * We return all artists whose (x, y) fall within that box.
 *
 * If fewer than MIN_RESULTS are found, we trigger an on-demand
 * Spotify search to populate the area and retry.
 */
@Injectable()
export class MapService {
  private static readonly MIN_RESULTS = 5;

  constructor(
    @InjectModel(Artist.name) private artistModel: Model<ArtistDocument>,
    private spotifyService: SpotifyService,
  ) {}

  /**
   * Returns artists within the bounding box [(x1,y1), (x2,y2)].
   *
   * Uses a simple $and query on x/y with the compound index.
   * Limit is capped at 50 to keep payloads small.
   */
  async getArtistsInBounds(box: BoundingBox, limit = 50): Promise<ArtistDocument[]> {
    const { x1, y1, x2, y2 } = box;

    const artists = await this.artistModel
      .find({
        x: { $gte: Math.min(x1, x2), $lte: Math.max(x1, x2) },
        y: { $gte: Math.min(y1, y2), $lte: Math.max(y1, y2) },
      })
      .limit(limit)
      .lean();

    return artists as ArtistDocument[];
  }

  /**
   * Alternative: MongoDB $geoWithin box query using the 2dsphere index.
   * More efficient at large scale; requires coordinates in [lng, lat] order.
   */
  async getArtistsInBoundsGeo(box: BoundingBox, limit = 50): Promise<ArtistDocument[]> {
    const { x1, y1, x2, y2 } = box;

    const artists = await this.artistModel
      .find({
        location: {
          $geoWithin: {
            $box: [
              [Math.min(x1, x2), Math.min(y1, y2)],
              [Math.max(x1, x2), Math.max(y1, y2)],
            ],
          },
        },
      })
      .limit(limit)
      .lean();

    return artists as ArtistDocument[];
  }

  /** Get artists near a point, ordered by distance (for "zoom in" behavior). */
  async getArtistsNear(
    cx: number,
    cy: number,
    radiusUnits: number,
    limit = 20,
  ): Promise<ArtistDocument[]> {
    // Convert canvas units to approximate degrees (1 unit ≈ 0.001°)
    const radiusDeg = radiusUnits * 0.001;

    const artists = await this.artistModel
      .find({
        x: { $gte: cx - radiusDeg * 1000, $lte: cx + radiusDeg * 1000 },
        y: { $gte: cy - radiusDeg * 1000, $lte: cy + radiusDeg * 1000 },
      })
      .sort({ popularity: -1 })
      .limit(limit)
      .lean();

    return artists as ArtistDocument[];
  }

  /** Get total count of seeded artists (for stats/debug). */
  async getStats() {
    const total = await this.artistModel.countDocuments();
    const byGenre = await this.artistModel.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    return { total, topGenres: byGenre };
  }
}
