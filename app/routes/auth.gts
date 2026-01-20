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
  @tracked dCookieInput = '';
  @tracked showWorkspaces = false;

  @action
  updateToken(args: any): void {
    // NativeScript textChange event passes PropertyChangeData
    this.tokenInput = args.value || args.object?.text || '';
  }

  @action
  updateDCookie(args: any): void {
    // NativeScript textChange event passes PropertyChangeData
    this.dCookieInput = args.value || args.object?.text || '';
  }



  @action
  async submitToken(): Promise<void> {
    if (!this.tokenInput.trim()) {
      this.slackAuth.error = 'Please enter a token';
      return;
    }

    if (!this.dCookieInput.trim()) {
      this.slackAuth.error = 'Please enter d cookie';
      return;
    }

    this.slackAuth.setToken(this.tokenInput.trim(), this.dCookieInput.trim());
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
            <label class="subtitle" text="Enter your Slack credentials" />
            
            <stack-layout class="input-container">
              <label class="input-label" text="Slack Client Token (xoxc-)" />
              <text-field
                class="input-field"
                hint="xoxc-..."
                text={{this.tokenInput}}
                {{on "textChange" this.updateToken}}
                secure="false"
                autocorrect="false"
                autocapitalizationType="none"
              />
              
              <label class="input-label" text="D Cookie (required)" />
              <text-field
                class="input-field"
                hint="xoxd-... from browser cookies"
                text={{this.dCookieInput}}
                {{on "textChange" this.updateDCookie}}
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
              <label class="help-title" text="How to get credentials:" />
              <label class="help-step" text="1. Open Slack in browser" />
              <label class="help-substep" text="  • Open DevTools (F12)" />
              <label class="help-substep" text="  • Go to Application → Cookies" />
              <label class="help-substep" text="  • Find slack.com cookies" />
              
              <label class="help-step" text="2. Copy Client Token (xoxc-)" />
              <label class="help-substep" text="  • Go to Network tab" />
              <label class="help-substep" text="  • Look for API requests" />
              <label class="help-substep" text="  • Find 'token' parameter starting with 'xoxc-'" />
              
              <label class="help-step" text="3. Copy D Cookie (xoxd-)" />
              <label class="help-substep" text="  • Back to Application → Cookies" />
              <label class="help-substep" text="  • Copy value of 'd' cookie (starts with 'xoxd-')" />
              
              <label class="help-warning" text="⚠️ Cookies may expire!" />
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
