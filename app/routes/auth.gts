import Route from '@ember/routing/route';
import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import { not } from 'ember-truth-helpers';
import type SlackAuthService from '../services/slack-auth';
import type RouterService from '@ember/routing/router-service';

export class AuthRoute extends Route {
  @service declare slackAuth: SlackAuthService;
  @service declare router: RouterService;

  beforeModel() {
    // If already authenticated, redirect to main app
    if (this.slackAuth.isAuthenticated) {
      this.router.transitionTo('index');
    }
  }
}

export default AuthRoute;

class AuthComponent extends Component {
  @service declare slackAuth: SlackAuthService;
  @service declare router: RouterService;

  @tracked tokenInput = '';
  @tracked showWorkspaces = false;

  @action
  updateToken(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.tokenInput = target.value;
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
              <label class="help-text" text="Don't have a token?" />
              <label 
                class="help-link" 
                text="Learn how to get your Slack token →"
              />
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
