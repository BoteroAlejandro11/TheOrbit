import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { Artist, ArtistSchema } from '../map/artists.schema';
import { SpotifyModule } from '../spotify/spotify.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Artist.name, schema: ArtistSchema }]),
    SpotifyModule,
    AuthModule,
  ],
  controllers: [MapController],
  providers: [MapService],
})
export class MapModule {}
