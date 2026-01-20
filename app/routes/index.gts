import RoutableComponentRoute from 'ember-routable-component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import Component from '@glimmer/component';
import { eq } from 'ember-truth-helpers';
import { fn, concat } from '@ember/helper';
import type SlackAuthService from '../services/slack-auth';
import type SlackChannelsService from '../services/slack-channels';
import type RouterService from '@ember/routing/router-service';
import setOnParent from '../ui/modifiers/set-on-parent';

class HomePage extends Component {
  @service declare slackAuth: SlackAuthService;
  @service declare slackChannels: SlackChannelsService;
  @service declare router: RouterService;

  get selectedWorkspace() {
    return this.slackAuth.workspaces.find(
      w => w.id === this.slackAuth.selectedWorkspace
    );
  }

  @action
  async loadChannels(): Promise<void> {
    await this.slackChannels.fetchChannels();
  }

  @action
  selectChannel(channelId: string): void {
    this.slackChannels.selectChannel(channelId);
  }

  @action
  toggleDrawer(): void {
    const drawer = this.drawer;
    if (drawer) {
      drawer.toggleDrawerState();
    }
  }

  @action
  logout(): void {
    this.slackAuth.logout();
    this.slackChannels.clear();
    this.router.transitionTo('auth');
  }

  drawer: any = null;

  @action
  onDrawerLoaded(args: any): void {
    this.drawer = args.object;
  }

  <template>
    <page class="home-page">
      <action-bar title="Slack Lite - home" />
      <rad-side-drawer {{on "loaded" this.onDrawerLoaded}}>
        {{! Drawer Content (Sidebar) }}
        <stack-layout class="sidebar" {{setOnParent "drawerContent"}}>
          <stack-layout class="sidebar-header">
            <label class="sidebar-title" text="Channels" />
            <button
              class="btn-refresh"
              text="🔄"
              {{on "tap" this.loadChannels}}
            />
          </stack-layout>

          {{#if this.slackChannels.isLoading}}
            <stack-layout class="loading-state">
              <activity-indicator busy="true" />
              <label text="Loading channels..." />
            </stack-layout>
          {{else if this.slackChannels.error}}
            <stack-layout class="error-state">
              <label class="error-text" text={{this.slackChannels.error}} />
              <button
                class="btn btn-small"
                text="Retry"
                {{on "tap" this.loadChannels}}
              />
            </stack-layout>
          {{else}}
            <scroll-view class="channels-list">
              <stack-layout>
                {{#if this.slackChannels.publicChannels.length}}
                  <label class="channel-section-title" text="Public Channels" />
                  {{#each this.slackChannels.publicChannels as |channel|}}
                    <stack-layout
                      class="channel-item {{if (eq channel.id this.slackChannels.selectedChannelId) 'selected'}}"
                      {{on "tap" (fn this.selectChannel channel.id)}}
                    >
                      <label class="channel-icon" text="#" />
                      <label class="channel-name" text={{channel.name}} />
                      {{#if channel.num_members}}
                        <label class="channel-members" text={{channel.num_members}} />
                      {{/if}}
                    </stack-layout>
                  {{/each}}
                {{/if}}

                {{#if this.slackChannels.privateChannels.length}}
                  <label class="channel-section-title" text="Private Channels" />
                  {{#each this.slackChannels.privateChannels as |channel|}}
                    <stack-layout
                      class="channel-item {{if (eq channel.id this.slackChannels.selectedChannelId) 'selected'}}"
                      {{on "tap" (fn this.selectChannel channel.id)}}
                    >
                      <label class="channel-icon" text="🔒" />
                      <label class="channel-name" text={{channel.name}} />
                    </stack-layout>
                  {{/each}}
                {{/if}}

                {{#unless this.slackChannels.channels.length}}
                  <label class="empty-state" text="No channels found" />
                {{/unless}}
              </stack-layout>
            </scroll-view>
          {{/if}}

          <button
            class="btn btn-logout"
            text="🚪 Logout"
            {{on "tap" this.logout}}
          />
        </stack-layout>

        {{! Main Content }}
        <stack-layout class="main-content" {{setOnParent "mainContent"}}>
          <action-bar title={{if this.slackChannels.selectedChannel (concat "#" this.slackChannels.selectedChannel.name) "Slack Lite"}}>
            <navigation-button
              text="☰"
              android.systemIcon="ic_menu_view"
              {{on "tap" this.toggleDrawer}}
            />
          </action-bar>

          <stack-layout class="content-container">
            {{#if this.slackChannels.selectedChannel}}
              <stack-layout class="channel-header">
                <label class="channel-title" text={{concat "#" this.slackChannels.selectedChannel.name}} />
                {{#if this.slackChannels.selectedChannel.num_members}}
                  <label class="channel-info" text={{concat this.slackChannels.selectedChannel.num_members " members"}} />
                {{/if}}
              </stack-layout>

              <stack-layout class="messages-placeholder">
                <label class="placeholder-icon" text="💬" />
                <label class="placeholder-text" text="Messages will appear here" />
                <label class="placeholder-subtext" text="Coming soon..." />
              </stack-layout>
            {{else}}
              <stack-layout class="no-channel-state">
                <label class="state-icon" text="👈" />
                <label class="state-text" text="Select a channel from the sidebar" />
              </stack-layout>
            {{/if}}
          </stack-layout>
        </stack-layout>
      </rad-side-drawer>
    </page>
  </template>
}

export default class IndexRoute extends RoutableComponentRoute(HomePage) {
  @service declare slackAuth: SlackAuthService;
  @service declare slackChannels: SlackChannelsService;
  @service declare router: RouterService;

  beforeModel() {
    // Redirect to auth if not authenticated
    if (!this.slackAuth.isAuthenticated) {
      this.router.transitionTo('auth');
    }
  }

  async model() {
    // Load channels when entering the route
    await this.slackChannels.fetchChannels();
  }

  activate() {
    console.log('Home route activated');
  }
}
