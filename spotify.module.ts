// ── spotify.module.ts ─────────────────────────────────────────────────────────
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpotifyService } from './spotify.service';
import { Artist, ArtistSchema } from '../artists/artists.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Artist.name, schema: ArtistSchema }])],
  providers: [SpotifyService],
  exports: [SpotifyService],
})
export class SpotifyModule {}
