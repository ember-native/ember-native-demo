import RoutableComponentRoute from 'ember-routable-component';
import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import type RouterService from '@ember/routing/router-service';

interface ErrorSignature {
  Args: {
    model: {
      error: string;
    };
  };
}

class ErrorComponent extends Component<ErrorSignature> {
  @service declare router: RouterService;

  get errorMessage(): string {
    const error = this.args.model.error;
    
    // Provide user-friendly error messages
    const errorMessages: Record<string, string> = {
      'access_denied': 'You denied access to the Slack app. Please try again and click "Allow".',
      'invalid_state': 'Security validation failed. This might be a CSRF attack. Please try again.',
      'invalid_code': 'The authorization code is invalid or expired. Please try again.',
      'invalid_client_id': 'The Slack app configuration is incorrect. Please contact support.',
      'invalid_client_secret': 'The Slack app configuration is incorrect. Please contact support.',
    };

    return errorMessages[error] || `Authentication failed: ${error}`;
  }

  @action
  tryAgain(): void {
    this.router.transitionTo('auth');
  }

  <template>
    <page class="oauth-error-page">
      <action-bar title="Authentication Error" />
      
      <stack-layout class="oauth-container">
        <label class="error-icon" text="❌" />
        <label class="error-title" text="Authentication Failed" />
        <label class="error-message" text={{this.errorMessage}} />
        
        <button
          class="btn btn-primary"
          text="Try Again"
          {{on "tap" this.tryAgain}}
        />
      </stack-layout>
    </page>
  </template>
}

export default class ErrorRoute extends RoutableComponentRoute(ErrorComponent) {
  /**
   * Extract error from deep link
   * Format: slacklite://oauth/error?error=xxx
   */
  model(params: any) {
    return {
      error: params.error || 'unknown_error',
    };
  }
}
