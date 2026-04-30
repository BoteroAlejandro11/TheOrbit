import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Artist, ArtistDocument } from '../artists/artists.schema';

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * SpotifyService
 * ──────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 *  1. Obtain + refresh a Client Credentials access token (no user login needed).
 *  2. Fetch artist data from the Spotify Web API.
 *  3. Run the spatial algorithm to produce (x, y) canvas coordinates.
 *  4. Seed / upsert Artist documents into MongoDB.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class SpotifyService implements OnModuleInit {
  private readonly logger = new Logger(SpotifyService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  // ── Genre → angle mapping ────────────────────────────────────────────────
  // We bucket known genres into 12 "slices" (like a clock).
  // Unknown genres are hashed deterministically.
  private static readonly GENRE_ANGLES: Record<string, number> = {
    pop: 0,
    'dance pop': 0.2,
    'electropop': 0.4,
    electronic: Math.PI / 6,
    edm: Math.PI / 5,
    house: Math.PI / 4,
    'hip hop': Math.PI / 3,
    rap: Math.PI / 2.8,
    'trap': Math.PI / 2.5,
    'r&b': Math.PI / 2,
    soul: Math.PI / 1.9,
    jazz: Math.PI / 1.7,
    classical: Math.PI,
    metal: Math.PI * 1.2,
    rock: Math.PI * 1.3,
    'indie rock': Math.PI * 1.4,
    alternative: Math.PI * 1.5,
    folk: Math.PI * 1.6,
    country: Math.PI * 1.7,
    reggae: Math.PI * 1.8,
    latin: Math.PI * 1.9,
    'k-pop': Math.PI * 0.1,
  };

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Artist.name) private artistModel: Model<ArtistDocument>,
  ) {}

  async onModuleInit() {
    // Pre-warm the token on startup
    await this.ensureToken();
  }

  // ── Token management ──────────────────────────────────────────────────────

  /**
   * OAuth 2.0 Client Credentials Flow.
   * The backend authenticates with its own Client ID + Secret.
   * No user account or redirect is required.
   */
  private async ensureToken(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return; // Token still valid
    }

    const clientId = this.config.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get<string>('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.warn('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set — skipping token fetch');
      return;
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Spotify token error: ${err}`);
      throw new Error('Failed to obtain Spotify access token');
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    this.logger.log('Spotify access token refreshed');
  }

  private async spotifyGet<T>(path: string): Promise<T> {
    await this.ensureToken();
    const res = await fetch(`https://api.spotify.com/v1${path}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!res.ok) throw new Error(`Spotify API error ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  }

  // ── Spatial Algorithm ────────────────────────────────────────────────────

  /**
   * Converts a Spotify artist's metadata into Cartesian (x, y) coordinates.
   *
   * RADIUS:  r = MAX_RADIUS * (1 - popularity/100)
   *   - popularity 100 → r = 0   → center of the map (mainstream)
   *   - popularity 0   → r = MAX → periphery (niche/undiscovered)
   *
   * ANGLE:   θ = weighted average of known genre angles (or a hash for unknown)
   *   - Each genre contributes its mapped angle weighted by 1/rank
   *   - This keeps similar genres in the same angular sector
   *
   * RESULT:  x = r * cos(θ),  y = r * sin(θ)
   */
  computeCoordinates(popularity: number, genres: string[]): { x: number; y: number } {
    const MAX_RADIUS = 500; // canvas units; frontend maps this to viewport pixels

    const r = MAX_RADIUS * (1 - popularity / 100);

    // Genre → angle
    let theta = 0;
    if (genres.length === 0) {
      theta = Math.random() * 2 * Math.PI; // completely unknown → random quadrant
    } else {
      let totalWeight = 0;
      let weightedAngle = 0;

      genres.forEach((genre, i) => {
        const weight = 1 / (i + 1); // first genre is most important
        const angle = SpotifyService.GENRE_ANGLES[genre.toLowerCase()]
          ?? this.hashGenreToAngle(genre);
        weightedAngle += angle * weight;
        totalWeight += weight;
      });

      theta = weightedAngle / totalWeight;
    }

    return {
      x: parseFloat((r * Math.cos(theta)).toFixed(4)),
      y: parseFloat((r * Math.sin(theta)).toFixed(4)),
    };
  }

  /** Deterministic hash → [0, 2π] for genres not in the lookup table. */
  private hashGenreToAngle(genre: string): number {
    let hash = 0;
    for (let i = 0; i < genre.length; i++) {
      hash = (hash * 31 + genre.charCodeAt(i)) >>> 0;
    }
    return (hash % 1000) / 1000 * 2 * Math.PI;
  }

  // ── Data Fetching & Seeding ───────────────────────────────────────────────

  /** Fetch a single Spotify artist by ID and upsert into MongoDB. */
  async fetchAndSeedArtist(spotifyId: string): Promise<ArtistDocument> {
    const [artistData, topTracksData] = await Promise.all([
      this.spotifyGet<SpotifyArtist>(`/artists/${spotifyId}`),
      this.spotifyGet<SpotifyTopTracks>(`/artists/${spotifyId}/top-tracks?market=US`),
    ]);

    const { x, y } = this.computeCoordinates(artistData.popularity, artistData.genres);
    const topTrack = topTracksData.tracks[0];

    const doc = await this.artistModel.findOneAndUpdate(
      { spotify_id: spotifyId },
      {
        spotify_id: spotifyId,
        name: artistData.name,
        profile_image: artistData.images[0]?.url ?? null,
        genres: artistData.genres,
        popularity: artistData.popularity,
        followers: artistData.followers.total,
        preview_url: topTrack?.preview_url ?? null,
        top_track_name: topTrack?.name ?? null,
        top_track_album_art: topTrack?.album?.images[0]?.url ?? null,
        x,
        y,
        location: { type: 'Point', coordinates: [x, y] },
      },
      { upsert: true, new: true },
    );

    this.logger.log(`Seeded artist: ${artistData.name} @ (${x}, ${y})`);
    return doc;
  }

  /**
   * Seed a batch of popular artists to populate the map center.
   * Call this once on first setup (or via a cron job).
   */
  async seedPopularArtists(ids: string[]): Promise<void> {
    this.logger.log(`Seeding ${ids.length} artists...`);
    const results = await Promise.allSettled(ids.map(id => this.fetchAndSeedArtist(id)));
    const failed = results.filter(r => r.status === 'rejected').length;
    this.logger.log(`Seeding complete. Success: ${ids.length - failed}, Failed: ${failed}`);
  }

  /**
   * Search Spotify for artists by query and seed the results.
   * Useful for populating niche genres on demand.
   */
  async searchAndSeed(query: string, limit = 20): Promise<ArtistDocument[]> {
    const data = await this.spotifyGet<SpotifySearchResult>(
      `/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`,
    );
    const artists = data.artists.items;
    const seeded: ArtistDocument[] = [];
    for (const a of artists) {
      try {
        seeded.push(await this.fetchAndSeedArtist(a.id));
      } catch (e) {
        this.logger.warn(`Failed to seed ${a.name}: ${e.message}`);
      }
    }
    return seeded;
  }
}

// ── Spotify API types (minimal surface) ──────────────────────────────────────

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
  images: { url: string; width: number; height: number }[];
}

interface SpotifyTopTracks {
  tracks: {
    id: string;
    name: string;
    preview_url: string | null;
    album: { images: { url: string }[] };
  }[];
}

interface SpotifySearchResult {
  artists: {
    items: SpotifyArtist[];
  };
}
