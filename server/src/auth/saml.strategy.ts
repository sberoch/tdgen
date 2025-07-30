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
      cert: (process.env.SAML_CERT as string).replace(/\\n/g, '\n'),
      disableRequestedAuthnContext: true,
      wantAssertionsSigned: true,
      signatureAlgorithm: 'sha256',
      validateInResponseTo: false,
      acceptedClockSkewMs: 5000,
      additionalParams: {
        debug: 'true',
      },
    });
  }

  validate(
    profile: Profile,
    done: (err: any, user?: any, info?: any) => void,
  ): void {
    const user = {
      id: profile.nameID || profile.id,
      email:
        profile.email ||
        profile['urn:oid:0.9.2342.19200300.100.1.3'] ||
        profile.mail,
      displayName: profile.displayName || profile.cn,
      firstName: profile.firstName || profile.givenName,
      lastName: profile.lastName || profile.sn,
      username: profile['urn:oid:0.9.2342.19200300.100.1.1'] || profile.uid,
      groups: profile.groups,
      rawProfile: profile,
    };
    try {
      done(null, user);
    } catch (error) {
      console.error(error);
    }
  }
}
