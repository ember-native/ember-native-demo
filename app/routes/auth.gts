import RoutableComponentRoute from 'ember-routable-component';
import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import { not } from 'ember-truth-helpers';
import type SlackAuthService from '../services/slack-auth';
import type RouterService from '@ember/routing/router-service';

class AuthComponent extends Component {
  @service declare slackAuth: SlackAuthService;
  @service declare router: RouterService;

  @tracked tokenInput = '';
  @tracked showWorkspaces = false;

  @action
  updateToken(args: any): void {
    // NativeScript textChange event passes PropertyChangeData
    this.tokenInput = args.value || args.object?.text || '';
  }

  @action
  async submitToken(): Promise<void> {
    if (!this.tokenInput.trim()) {
      this.slackAuth.error = 'Please enter a token';
      return;
    }

    this.slackAuth.setToken(this.tokenInput.trim());
    await this.slackAuth.fetchWorkspaces();

    if (this.slackAuth.workspaces.length > 0) {
      this.showWorkspaces = true;
    }
  }

  @action
  selectWorkspace(workspaceId: string): void {
    this.slackAuth.selectWorkspace(workspaceId);
    
    if (this.slackAuth.isAuthenticated) {
      this.router.transitionTo('index');
    }
  }

  @action
  goBack(): void {
    this.showWorkspaces = false;
    this.slackAuth.error = null;
  }

  <template>
    <page class="auth-page">
      <action-bar title="Slack Lite - Sign In" />
      
      <stack-layout class="auth-container">
        {{#unless this.showWorkspaces}}
          {{! Token Input Screen }}
          <stack-layout class="token-input-section">
            <label class="app-title" text="🚀 Slack Lite" />
            <label class="subtitle" text="Enter your Slack token to get started" />
            
            <stack-layout class="input-container">
              <label class="input-label" text="Slack API Token" />
              <text-field
                class="input-field"
                hint="xoxb-your-token-here"
                text={{this.tokenInput}}
                {{on "textChange" this.updateToken}}
                secure="false"
                autocorrect="false"
                autocapitalizationType="none"
              />
              
              {{#if this.slackAuth.error}}
                <label class="error-message" text={{this.slackAuth.error}} />
              {{/if}}
            </stack-layout>

            <button
              class="btn btn-primary"
              text={{if this.slackAuth.isLoading "Loading..." "Continue"}}
              isEnabled={{not this.slackAuth.isLoading}}
              {{on "tap" this.submitToken}}
            />

            <stack-layout class="help-section">
              <label class="help-title" text="Token Options:" />
              <label class="help-step" text="Option 1: Bot Token (xoxb-) - Recommended" />
              <label class="help-substep" text="  • Visit api.slack.com/apps" />
              <label class="help-substep" text="  • Create App → OAuth & Permissions" />
              <label class="help-substep" text="  • Install to Workspace" />
              <label class="help-step" text="Option 2: Session Cookie (xoxd-) - Testing" />
              <label class="help-substep" text="  • Open Slack in browser" />
              <label class="help-substep" text="  • DevTools → Application → Cookies" />
              <label class="help-substep" text="  • Copy 'd' cookie value" />
              <label class="help-warning" text="⚠️ Cookies may expire or break!" />
            </stack-layout>
          </stack-layout>
        {{else}}
          {{! Workspace Selection Screen }}
          <stack-layout class="workspace-selection-section">
            <button
              class="btn btn-back"
              text="← Back"
              {{on "tap" this.goBack}}
            />

            <label class="section-title" text="Select Workspace" />
            <label class="section-subtitle" text="Choose which workspace to connect" />

            <scroll-view class="workspace-list">
              <stack-layout>
                {{#each this.slackAuth.workspaces as |workspace|}}
                  <stack-layout
                    class="workspace-item"
                    {{on "tap" (fn this.selectWorkspace workspace.id)}}
                  >
                    <label class="workspace-icon" text={{workspace.icon}} />
                    <label class="workspace-name" text={{workspace.name}} />
                    <label class="workspace-id" text={{workspace.id}} />
                  </stack-layout>
                {{/each}}
              </stack-layout>
            </scroll-view>
          </stack-layout>
        {{/unless}}
      </stack-layout>
    </page>
  </template>
}

export default class AuthRoute extends RoutableComponentRoute(AuthComponent) {
  @service declare slackAuth: SlackAuthService;
  @service declare router: RouterService;

  beforeModel() {
    // If already authenticated, redirect to main app
    if (this.slackAuth.isAuthenticated) {
      this.router.transitionTo('index');
    }
  }

  activate() {
    console.log('Auth route activated');
  }
}