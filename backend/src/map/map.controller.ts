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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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
  return this.mapService.getArtistById(id);
}

  @Post('seed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed artists from Spotify by genre/query' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          example: 'salsa',
          description: 'The genre or artist name to search for',
        },
        limit: {
          type: 'number',
          example: 20,
          description: 'Number of artists to fetch (optional)',
        },
      },
      required: ['query'],
    },
  })
  async seedArtists(@Body() body: { query: string; limit?: number }) {
    const artists = await this.spotifyService.searchAndSeed(body.query, body.limit ?? 20);
    return { seeded: artists.length, message: `Seeded ${artists.length} artists for query: "${body.query}"` };
  }

  @Post('seed-ids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed specific artists by Spotify ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          example: ['3TVXtAsR1Inumwj472S9r4', '1Xyo4u8uXC1ZmMpatF05PJ'],
          description: 'List of Spotify Artist IDs to seed',
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