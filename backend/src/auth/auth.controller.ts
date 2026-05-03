import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

 @Post('register')
  @ApiOperation({ summary: 'Registro de nuevo usuario' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'JuanPablo' },
        email: { type: 'string', example: 'test@test.com' },
        password: { type: 'string', example: 'Password123' }
      }
    }
  })
  register(
    @Body() body: { username: string; email: string; password: string },
  ) {
    return this.authService.register(body.username, body.email, body.password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Inicio de sesión — devuelve JWT' })
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  getMe(@Request() req: any) {
    return req.user;
  }
}
