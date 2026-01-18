import RoutableComponentRoute from 'ember-routable-component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import Component from '@glimmer/component';
import type SlackAuthService from '../services/slack-auth';
import type RouterService from '@ember/routing/router-service';

class HomePage extends Component {
  @service declare slackAuth: SlackAuthService;
  @service declare router: RouterService;

  get selectedWorkspace() {
    return this.slackAuth.workspaces.find(
      w => w.id === this.slackAuth.selectedWorkspace
    );
  }

  @action
  logout(): void {
    this.slackAuth.logout();
    this.router.transitionTo('auth');
  }

  <template>
    <page class="home-page">
      <action-bar title="Slack Lite" />
      
      <stack-layout class="home-container">
        {{#if this.selectedWorkspace}}
          <stack-layout class="workspace-header">
            <label class="workspace-icon-large" text={{this.selectedWorkspace.icon}} />
            <label class="workspace-name-large" text={{this.selectedWorkspace.name}} />
            <label class="workspace-id-small" text={{this.selectedWorkspace.id}} />
          </stack-layout>

          <stack-layout class="content-section">
            <label class="welcome-text" text="Welcome to Slack Lite! 👋" />
            <label class="info-text" text="Your workspace is connected and ready." />
            
            <stack-layout class="feature-list">
              <label class="feature-item" text="✓ Token authenticated" />
              <label class="feature-item" text="✓ Workspace selected" />
              <label class="feature-item" text="✓ Ready for messaging" />
            </stack-layout>
          </stack-layout>

          <stack-layout class="actions-section">
            <label class="section-label" text="Quick Actions" />
            
            <button
              class="btn btn-secondary"
              text="📱 View Channels (Coming Soon)"
              isEnabled="false"
            />
            
            <button
              class="btn btn-secondary"
              text="💬 Direct Messages (Coming Soon)"
              isEnabled="false"
            />
            
            <button
              class="btn btn-secondary"
              text="👥 Team Members (Coming Soon)"
              isEnabled="false"
            />
          </stack-layout>

          <button
            class="btn btn-logout"
            text="🚪 Logout"
            {{on "tap" this.logout}}
          />
        {{else}}
          <stack-layout class="error-state">
            <label class="error-icon" text="⚠️" />
            <label class="error-title" text="No Workspace Selected" />
            <label class="error-message" text="Please authenticate to continue." />
            
            <button
              class="btn btn-primary"
              text="Go to Login"
              {{on "tap" this.logout}}
            />
          </stack-layout>
        {{/if}}
      </stack-layout>
    </page>
  </template>
}

export default class IndexRoute extends RoutableComponentRoute(HomePage) {
  @service declare slackAuth: SlackAuthService;
  @service declare router: RouterService;

  beforeModel() {
    // Redirect to auth if not authenticated
    if (!this.slackAuth.isAuthenticated) {
      this.router.transitionTo('auth');
    }
  }

  activate() {
    console.log('Home route activated');
  }
}