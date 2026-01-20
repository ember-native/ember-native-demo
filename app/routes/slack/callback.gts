import RoutableComponentRoute from 'ember-routable-component';
import Component from '@glimmer/component';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import type SlackAuthService from '../../services/slack-auth';
import type RouterService from '@ember/routing/router-service';

interface CallbackSignature {
  Args: {
    model: {
      code: string;
      state: string;
      error?: string;
      error_description?: string;
    };
  };
}

class CallbackComponent extends Component<CallbackSignature> {
  @service declare slackAuth: SlackAuthService;
  @service declare router: RouterService;

  @tracked isProcessing = true;
  @tracked errorMessage: string | null = null;

  constructor(owner: unknown, args: CallbackSignature['Args']) {
    super(owner, args);
    this.handleCallback();
  }

  async handleCallback() {
    const { token, team_id, team_name, code, state, error, error_description } = this.args.model;

    // Check if user denied authorization
    if (error) {
      this.errorMessage = error_description || error || 'Authorization was denied';
      this.isProcessing = false;
      return;
    }

    try {
      // If token is provided directly (from backend redirect), use it
      if (token) {
        this.slackAuth.setToken(token);
        await this.slackAuth.fetchWorkspaces();
        
        // Auto-select workspace if only one is available
        if (this.slackAuth.workspaces.length === 1) {
          this.slackAuth.selectWorkspace(this.slackAuth.workspaces[0].id);
        }
        
        // Redirect to main app on success
        this.router.transitionTo('index');
        return;
      }

      // Legacy: Handle OAuth code exchange (won't work with Slack's http/https requirement)
      if (code && state) {
        const useBackend = this.shouldUseBackend();
        
        if (useBackend) {
          await this.slackAuth.handleOAuthCallbackViaBackend(code, state);
        } else {
          await this.slackAuth.handleOAuthCallback(code, state);
        }

        // Redirect to main app on success
        this.router.transitionTo('index');
        return;
      }

      // No valid parameters provided
      this.errorMessage = 'Missing required parameters (token or code)';
      this.isProcessing = false;
    } catch (err) {
      this.errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      this.isProcessing = false;
    }
  }

  /**
   * Determine if we should use backend proxy
   * Check if backend URL is configured and not a placeholder
   */
  private shouldUseBackend(): boolean {
    // Import config to check
    const config = (this.slackAuth as any).constructor.SLACK_OAUTH_CONFIG;
    return config?.backend?.baseUrl && 
           config.backend.baseUrl !== 'https://your-backend.com';
  }

  goToAuth = () => {
    this.router.transitionTo('auth');
  }

  <template>
    <page class="callback-page">
      <action-bar title="Slack Authentication" />
      
      <stack-layout class="callback-container">
        {{#if this.isProcessing}}
          <activity-indicator busy="true" class="loading-spinner" />
          <label class="status-message" text="Completing authentication..." />
        {{else if this.errorMessage}}
          <label class="error-icon" text="❌" />
          <label class="error-title" text="Authentication Failed" />
          <label class="error-message" text={{this.errorMessage}} />
          <button
            class="btn btn-primary"
            text="Try Again"
            {{on "tap" this.goToAuth}}
          />
        {{/if}}
      </stack-layout>
    </page>
  </template>
}

export default class CallbackRoute extends RoutableComponentRoute(CallbackComponent) {
  @service declare slackAuth: SlackAuthService;
  @service declare router: RouterService;

  /**
   * Extract query parameters from URL
   * NativeScript handles deep links differently than web
   * 
   * This route handles deep links from the backend server:
   * - Success: slacklite://oauth/success?token=xxx&team_id=yyy&team_name=zzz
   * - Error: slacklite://oauth/error?error=xxx
   */
  model(params: any) {
    // Backend redirects with token directly (no code exchange needed)
    return {
      token: params.token || '',
      team_id: params.team_id || '',
      team_name: params.team_name || '',
      error: params.error || '',
      // Legacy support for direct Slack callback (won't work in production)
      code: params.code || '',
      state: params.state || '',
      error_description: params.error_description || '',
    };
  }

  /**
   * Redirect if already authenticated
   */
  beforeModel() {
    if (this.slackAuth.isAuthenticated) {
      this.router.transitionTo('index');
    }
  }
}
