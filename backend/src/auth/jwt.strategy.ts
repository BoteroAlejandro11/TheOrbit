// ── jwt.strategy.ts ───────────────────────────────────────────────────────────
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'change-me-in-production'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.authService.validatePayload(payload);
    if (!user) throw new UnauthorizedException('Token inválido o usuario no encontrado');
    return user;
  }
}

