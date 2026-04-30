import {
  Controller,
  Get,
  Query,
  ParseFloatPipe,
  DefaultValuePipe,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MapService } from './map.service';
import { SpotifyService } from '../spotify/spotify.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Map')
@Controller('map')
export class MapController {
  constructor(
    private readonly mapService: MapService,
    private readonly spotifyService: SpotifyService,
  ) {}

  /**
   * Core spatial endpoint.
   * GET /map/artists?x1=-100&y1=-100&x2=100&y2=100
   *
   * The NextJS canvas sends the current viewport's canvas-space bounding box.
   * Returns up to `limit` artist documents within that box.
   */
  @Get('artists')
  @ApiOperation({ summary: 'Get artists within a canvas bounding box' })
  @ApiQuery({ name: 'x1', type: Number, example: -200 })
  @ApiQuery({ name: 'y1', type: Number, example: -200 })
  @ApiQuery({ name: 'x2', type: Number, example: 200 })
  @ApiQuery({ name: 'y2', type: Number, example: 200 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 50 })
  async getArtistsInBounds(
    @Query('x1', ParseFloatPipe) x1: number,
    @Query('y1', ParseFloatPipe) y1: number,
    @Query('x2', ParseFloatPipe) x2: number,
    @Query('y2', ParseFloatPipe) y2: number,
    @Query('limit', new DefaultValuePipe(50), ParseFloatPipe) limit: number,
  ) {
    const artists = await this.mapService.getArtistsInBounds(
      { x1, y1, x2, y2 },
      Math.min(limit, 100),
    );
    return { artists, count: artists.length, bounds: { x1, y1, x2, y2 } };
  }

  /** Stats endpoint for debugging / admin use. */
  @Get('stats')
  @ApiOperation({ summary: 'Map population stats' })
  async getStats() {
    return this.mapService.getStats();
  }

  /**
   * Seed endpoint — triggers a Spotify search and populates a region.
   * Protected: only authenticated users can trigger seeding.
   * In production you'd restrict this to admins.
   *
   * POST /map/seed  { "query": "indie folk", "limit": 20 }
   */
  @Post('seed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed artists from Spotify by genre/query' })
  async seedArtists(@Body() body: { query: string; limit?: number }) {
    const artists = await this.spotifyService.searchAndSeed(body.query, body.limit ?? 20);
    return { seeded: artists.length, message: `Seeded ${artists.length} artists for query: "${body.query}"` };
  }

  /**
   * Seed by explicit Spotify Artist IDs.
   * POST /map/seed-ids  { "ids": ["4Z8W4fkeB5StDbG9I7DHVr", ...] }
   */
  @Post('seed-ids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed specific artists by Spotify ID' })
  async seedById(@Body() body: { ids: string[] }) {
    await this.spotifyService.seedPopularArtists(body.ids);
    return { message: `Queued ${body.ids.length} artists for seeding` };
  }
}
