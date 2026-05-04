// ── auth.service.ts ───────────────────────────────────────────────────────────
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // ── Registro — NO devuelve token ─────────────────────────────────────────
  async register(username: string, email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('El email ya está en uso');

    const hashed = await bcrypt.hash(password, 10);
    await this.usersService.create({ username, email, password: hashed });

    return { message: 'Usuario registrado con éxito. Ya puedes iniciar sesión.' };
  }

  // ── Login — devuelve token en httpOnly cookie ─────────────────────────────
  async login(email: string, password: string, res: Response) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Credenciales inválidas');

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    // Cookie httpOnly — no accesible desde JavaScript del navegador
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    return {
      message: 'Inicio de sesión exitoso',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      // También devolvemos el token en la respuesta para usarlo en Swagger
      access_token: token,
    };
  }

  async validatePayload(payload: { sub: string; email: string; role: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) return null;
    return { ...user.toObject?.() ?? user, role: payload.role };
  }

  // ── Logout — limpia la cookie ─────────────────────────────────────────────
  async logout(res: Response) {
    res.clearCookie('access_token');
    return { message: 'Sesión cerrada correctamente' };
  }
}