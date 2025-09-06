#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { config } from 'dotenv';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {toPassportConfig, MetadataReader} from 'passport-saml-metadata';

config();

interface MetadataOptions {
  metadataUrl?: string;
  entryPointUrl?: string;
  outputFile?: string;
  timeout?: number;
}

class SamlMetadataFetcher {
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

  /**
   * Construct metadata URL from common IdP entry point patterns
   */
  private static constructMetadataUrl(entryPointUrl: string): string[] {
    const possibleUrls: string[] = [];

    try {
      const url = new URL(entryPointUrl);

      // Keycloak pattern: /realms/{realm}/protocol/saml -> /realms/{realm}/protocol/saml/descriptor
      if (
        url.pathname.includes('/protocol/saml') &&
        !url.pathname.includes('/descriptor')
      ) {
        possibleUrls.push(entryPointUrl + '/descriptor');
      }

      // ADFS pattern: /adfs/services/trust -> /federationmetadata/2007-06/federationmetadata.xml
      if (url.pathname.includes('/adfs/services/trust')) {
        possibleUrls.push(
          `${url.origin}/federationmetadata/2007-06/federationmetadata.xml`,
        );
      }

      // Azure AD pattern: might have different patterns
      if (url.hostname.includes('login.microsoftonline.com')) {
        // Azure AD uses different metadata endpoints
        const tenantId = url.pathname.split('/')[1];
        possibleUrls.push(
          `https://login.microsoftonline.com/${tenantId}/federationmetadata/2007-06/federationmetadata.xml`,
        );
      }

      // Okta pattern
      if (url.hostname.includes('.okta.com')) {
        possibleUrls.push(`${url.origin}/app/metadata`);
      }

      // Generic fallback - try appending common metadata paths
      possibleUrls.push(entryPointUrl + '/metadata');
      possibleUrls.push(entryPointUrl.replace(/\/saml$/, '/saml/metadata'));

      // If no specific pattern matches, try the entry point as-is (some IdPs use same URL for both)
      possibleUrls.push(entryPointUrl);
    } catch (error) {
      console.warn(`Failed to parse entry point URL: ${entryPointUrl}`, error);
    }

    return possibleUrls;
  }

  /**
   * Attempt to fetch metadata from multiple possible URLs
   */
  private static async fetchMetadataFromUrls(
    urls: string[],
    timeout: number,
  ): Promise<string> {
    for (const url of urls) {
      try {
        console.log(`Attempting to fetch metadata from: ${url}`);
        const response = await axios.get(url, {
          timeout,
          headers: {
            Accept: 'application/samlmetadata+xml, application/xml, text/xml',
            'User-Agent': 'TDGen-SAML-Metadata-Fetcher/1.0',
          },
          validateStatus: (status) => status >= 200 && status < 400,
        });

        if (
          response.data &&
          typeof response.data === 'string' &&
          response.data.includes('EntityDescriptor')
        ) {
          console.log(`Successfully fetched metadata from: ${url}`);
          return response.data;
        } else {
          console.log(
            `Warning: Response from ${url} doesn't appear to be valid SAML metadata`,
          );
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.log(
            `Failed to fetch from ${url}: ${error.response?.status} ${error.response?.statusText || error.message}`,
          );
        } else {
          console.log(`Failed to fetch from ${url}: ${error}`);
        }
      }
    }

    throw new Error(
      `Failed to fetch metadata from any of the attempted URLs: ${urls.join(', ')}`,
    );
  }

  /**
   * Fetch and validate SAML metadata
   */
  static async fetchMetadata(options: MetadataOptions = {}): Promise<string> {
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;
    let metadataXml: string;

    if (options.metadataUrl) {
      // Direct metadata URL provided
      console.log('Using direct metadata URL...');
      metadataXml = await this.fetchMetadataFromUrls(
        [options.metadataUrl],
        timeout,
      );
    } else if (options.entryPointUrl) {
      // Construct metadata URL from entry point
      console.log('Constructing metadata URLs from entry point...');
      const possibleUrls = this.constructMetadataUrl(options.entryPointUrl);
      metadataXml = await this.fetchMetadataFromUrls(possibleUrls, timeout);
    } else {
      throw new Error('Either metadataUrl or entryPointUrl must be provided');
    }

    // Validate that we got valid SAML metadata
    if (!metadataXml.includes('EntityDescriptor')) {
      throw new Error(
        'Fetched content does not appear to be valid SAML metadata (missing EntityDescriptor)',
      );
    }

    return metadataXml;
  }

  /**
   * Save metadata XML to file
   */
  static saveMetadataToFile(metadataXml: string, filename?: string): string {
    const scriptsDir = path.dirname(__filename);
    const defaultFilename = `saml-metadata-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xml`;
    const outputFilename = filename || defaultFilename;
    const outputPath = path.join(scriptsDir, outputFilename);

    fs.writeFileSync(outputPath, metadataXml, 'utf8');
    return outputPath;
  }
}

/**
 * Main CLI function
 */
async function main() {
  try {
    const metadataUrl = process.env.SAML_METADATA_URL;
    const entryPointUrl = process.env.SAML_ENTRY_POINT;

    if (!metadataUrl && !entryPointUrl) {
      console.error(
        'Error: Either SAML_METADATA_URL or SAML_ENTRY_POINT environment variable must be set',
      );
      process.exit(1);
    }

    console.log('Fetching SAML Identity Provider Metadata...\n');

    const options: MetadataOptions = {
      metadataUrl,
      entryPointUrl,
      timeout: 10000,
    };

    // Fetch raw metadata XML
    const metadataXml = await SamlMetadataFetcher.fetchMetadata(options);

    // Save metadata to file
    const savedPath = SamlMetadataFetcher.saveMetadataToFile(
      metadataXml,
      options.outputFile,
    );
    console.log(`\nMetadata saved to: ${savedPath}`);

    console.log('\nSAML Metadata XML:');
    console.log('='.repeat(50));
    console.log(metadataXml);
    console.log('='.repeat(50));

    const passportConfig = toPassportConfig(new MetadataReader(metadataXml))
      console.log('\nPassport-SAML Compatible Configuration:');
      console.log(JSON.stringify(passportConfig, null, 2));

    console.log('\nMetadata fetch completed successfully!');
  } catch (error) {
    console.error('\nError fetching SAML metadata:', error.message || error);
    process.exit(1);
  }
}

// Export for programmatic use
export { SamlMetadataFetcher, MetadataOptions };

// Run main function if script is executed directly
if (require.main === module) {
  main();
}
