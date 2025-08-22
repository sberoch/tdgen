import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-denied',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './denied.component.html',
})
export class DeniedComponent implements OnInit {
  errorCode: string | null = null;
  errorMessage: string | null = null;

  private errorMessages: Record<string, string> = {
    saml_no_user: 'SAML authentication successful but no user data received',
    saml_missing_id: 'SAML response missing required user ID field',
    saml_missing_display_name: 'SAML response missing display name',
    saml_missing_groups: 'SAML response missing user groups',
    saml_validation_error: 'Error validating SAML response data',
    saml_callback_error: 'General SAML callback processing error',
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.errorCode = params['error'] || null;
      this.errorMessage = this.errorCode ? this.errorMessages[this.errorCode] || 'Unknown SAML error' : null;
    });
  }
}