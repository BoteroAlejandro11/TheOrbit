// ── map.controller.ts ────────────────────────────────────────────────────────
import {
  Controller,
  Get,
  Query,
  ParseFloatPipe,
  DefaultValuePipe,
  UseGuards,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { MapService } from './map.service';
import { SpotifyService } from '../spotify/spotify.service';
import { RolesGuard } from '../auth/Roles.guard';
import { Roles } from '../auth/Roles.decorator';

@ApiTags('Map')
@Controller('map')
export class MapController {
  constructor(
    private readonly mapService: MapService,
    private readonly spotifyService: SpotifyService,
  ) {}

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

  @Get('stats')
  @ApiOperation({ summary: 'Map population stats' })
  async getStats() {
    return this.mapService.getStats();
  }

  @Get('artist/:id')
  @ApiOperation({ summary: 'Get artist by Spotify ID' })
  async getArtist(@Param('id') id: string) {
    const artist = await this.mapService.getArtistById(id);
    if (!artist) {
      throw new NotFoundException(`Artista con Spotify ID ${id} no encontrado`);
    }
    return artist;
  }

  // ── Solo ADMIN ────────────────────────────────────────────────────────────

  @Post('seed')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed artists from Spotify by genre/query' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', example: 'salsa' },
        limit: { type: 'number', example: 20 },
      },
      required: ['query'],
    },
  })
  async seedArtists(@Body() body: { query: string; limit?: number }) {
    const artists = await this.spotifyService.searchAndSeed(body.query, body.limit ?? 20);
    return { seeded: artists.length, message: `Seeded ${artists.length} artists for query: "${body.query}"` };
  }

  @Post('seed-ids')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed specific artists by Spotify ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          example: ['3TVXtAsR1Inumwj472S9r4'],
        },
      },
      required: ['ids'],
    },
  })
  async seedById(@Body() body: { ids: string[] }) {
    await this.spotifyService.seedPopularArtists(body.ids);
    return { message: `Queued ${body.ids.length} artists for seeding` };
  }
}