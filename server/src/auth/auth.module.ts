import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SamlStrategy } from './saml.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [SamlStrategy],
})
export class AuthModule {}
