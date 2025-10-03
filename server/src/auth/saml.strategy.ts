// saml.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-saml';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  constructor() {
    super({
      callbackUrl: process.env.SAML_CALLBACK_URL as string,
      entryPoint: process.env.SAML_ENTRY_POINT as string,
      issuer: process.env.SAML_ISSUER as string,
      cert: process.env.SAML_CERT as string,
      identifierFormat: null,
    });
  }

  validate(
    profile: Profile,
    done: (err: any, user?: any, info?: any) => void,
  ): void {
    try {
      const groups = profile.groups as string[];
      const user = {
        id: profile.login || profile.nameID || profile.id || profile.username,
        email:
          profile.email ||
          profile['urn:oid:0.9.2342.19200300.100.1.3'] ||
          profile.mail,
        displayName:
          profile.fullname ||
          profile.displayName ||
          profile.displayname ||
          profile.cn,
        firstName: profile.firstName || profile.givenName,
        lastName: profile.lastName || profile.sn,
        username: profile['urn:oid:0.9.2342.19200300.100.1.1'] || profile.uid,
        groups: groups.filter(
          (group) =>
            group == process.env.TDGEN_ADMIN_ATTR_NAME ||
            group == process.env.TDGEN_USER_ATTR_NAME,
        ),
        rawProfile: profile,
      };

      if (!user.displayName) {
        user.displayName =
          (user.firstName as string | null) +
          ' ' +
          (user.lastName as string | null);
      }

      // Validate required fields
      if (!user.id) return done(null, false, { message: 'SAML_MISSING_ID' });
      if (!user.displayName)
        return done(null, false, { message: 'SAML_MISSING_DISPLAY_NAME' });
      if (!user.groups || user.groups.length === 0)
        return done(null, false, { message: 'SAML_MISSING_GROUPS' });

      done(null, user);
    } catch (error) {
      console.error('SAML validation error:', error);
      done(null, false, { message: 'SAML_VALIDATION_ERROR' });
    }
  }
}
