import RoutableComponentRoute from 'ember-routable-component';
import Component from '@glimmer/component';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type SlackAuthService from '../../services/slack-auth';
import type RouterService from '@ember/routing/router-service';

interface SuccessSignature {
  Args: {
    model: {
      token: string;
      team_id: string;
      team_name: string;
    };
  };
}

class SuccessComponent extends Component<SuccessSignature> {
  @service declare slackAuth: SlackAuthService;
  @service declare router: RouterService;

  @tracked isProcessing = true;
  @tracked errorMessage: string | null = null;

  constructor(owner: unknown, args: SuccessSignature['Args']) {
    super(owner, args);
    this.handleSuccess();
  }

  async handleSuccess() {
    const { token, team_id, team_name } = this.args.model;

    if (!token) {
      this.errorMessage = 'No access token received from backend';
      this.isProcessing = false;
      return;
    }

    try {
      // Store the token
      this.slackAuth.setToken(token);
      
      // Fetch workspace info
      await this.slackAuth.fetchWorkspaces();

      // Auto-select workspace if only one is available
      if (this.slackAuth.workspaces.length === 1) {
        this.slackAuth.selectWorkspace(this.slackAuth.workspaces[0].id);
      } else if (team_id) {
        // Select the workspace that matches the team_id from OAuth
        this.slackAuth.selectWorkspace(team_id);
      }

      // Redirect to main app
      this.router.transitionTo('index');
    } catch (err) {
      this.errorMessage = err instanceof Error ? err.message : 'Failed to complete authentication';
      this.isProcessing = false;
    }
  }

  <template>
    <page class="oauth-success-page">
      <action-bar title="Slack Authentication" />
      
      <stack-layout class="oauth-container">
        {{#if this.isProcessing}}
          <activity-indicator busy="true" class="loading-spinner" />
          <label class="status-message" text="Completing authentication..." />
        {{else if this.errorMessage}}
          <label class="error-icon" text="❌" />
          <label class="error-title" text="Authentication Failed" />
          <label class="error-message" text={{this.errorMessage}} />
        {{/if}}
      </stack-layout>
    </page>
  </template>
}

export default class SuccessRoute extends RoutableComponentRoute(SuccessComponent) {
  @service declare slackAuth: SlackAuthService;
  @service declare router: RouterService;

  /**
   * Extract query parameters from deep link
   * Format: slacklite://oauth/success?token=xxx&team_id=yyy&team_name=zzz
   */
  model(params: any) {
    return {
      token: params.token || '',
      team_id: params.team_id || '',
      team_name: decodeURIComponent(params.team_name || ''),
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
