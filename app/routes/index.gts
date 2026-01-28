import RoutableComponentRoute from 'ember-routable-component';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import Component from '@glimmer/component';
import { eq } from 'ember-truth-helpers';
import { fn, concat } from '@ember/helper';
import type SlackAuthService from '../services/slack-auth';
import type SlackChannelsService from '../services/slack-channels';
import type SlackMessagesService from '../services/slack-messages';
import type RouterService from '@ember/routing/router-service';
import setOnParent from '../ui/modifiers/set-on-parent';
import { tracked } from "@glimmer/tracking";

class HomePage extends Component {
  @service declare slackAuth: SlackAuthService;
  @service declare slackChannels: SlackChannelsService;
  @service declare slackMessages: SlackMessagesService;
  @service declare router: RouterService;

  @tracked messageText = '';
  messageInputField: any = null;

  get selectedWorkspace() {
    return this.slackAuth.workspaces.find(
      w => w.id === this.slackAuth.selectedWorkspace
    );
  }

  getUserDisplayName = (userId: string): string => {
    return this.slackMessages.getUserDisplayName(userId);
  }

  formatTimestamp = (ts: string): string => {
    return this.slackMessages.formatTimestamp(ts);
  }

  @action
  async loadChannels(): Promise<void> {
    await this.slackChannels.fetchChannels();
  }

  @action
  async selectChannel(channelId: string): Promise<void> {
    this.slackChannels.selectChannel(channelId);
    // Load messages for the selected channel
    await this.slackMessages.fetchMessages(channelId);
    // Close the drawer after selecting a channel
    if (this.drawer) {
      this.drawer.closeDrawer();
    }
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

  @action
  onMessageTextChange(args: any): void {
    this.messageText = args.value;
  }

  @action
  onMessageInputLoaded(args: any): void {
    this.messageInputField = args.object;
  }

  @action
  async sendMessage(): Promise<void> {
    if (!this.messageText.trim()) {
      return;
    }

    try {
      await this.slackMessages.sendMessage(this.messageText);
      this.messageText = '';
      // Clear the text field
      if (this.messageInputField) {
        this.messageInputField.text = '';
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Note: alert is not available in NativeScript, use dialogs module
      console.error('Error sending message:', err instanceof Error ? err.message : 'Failed to send message');
    }
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
                {{#if this.slackChannels.starredChannels.length}}
                  <label class="channel-section-title" text="⭐ Starred" />
                  {{#each this.slackChannels.starredChannels as |channel|}}
                    <stack-layout
                      class="channel-item {{if (eq channel.id this.slackChannels.selectedChannelId) 'selected'}}"
                      {{on "tap" (fn this.selectChannel channel.id)}}
                    >
                      <label class="channel-icon" text={{if channel.is_private "🔒" "#"}} />
                      <label class="channel-name" text={{channel.name}} />
                      {{#if channel.num_members}}
                        <label class="channel-members" text={{channel.num_members}} />
                      {{/if}}
                    </stack-layout>
                  {{/each}}
                {{/if}}

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
              {{#if this.slackMessages.isLoading}}
                <stack-layout class="loading-messages">
                  <activity-indicator busy="true" />
                  <label text="Loading messages..." />
                </stack-layout>
              {{else if this.slackMessages.error}}
                <stack-layout class="error-messages">
                  <label class="error-text" text={{this.slackMessages.error}} />
                </stack-layout>
              {{else}}
                <grid-layout rows="*, auto" class="messages-container">
                  <scroll-view row="0" class="messages-scroll">
                    <stack-layout class="messages-list">
                      {{#each this.slackMessages.messages as |message|}}
                        <stack-layout class="message-item">
                          <grid-layout columns="auto, *" class="message-header">
                            <label col="0" class="message-user" text={{this.getUserDisplayName message.user}} />
                            <label col="1" class="message-time" text={{this.formatTimestamp message.ts}} />
                          </grid-layout>
                          <label class="message-text" text={{message.text}} textWrap="true" />
                        </stack-layout>
                      {{else}}
                        <stack-layout class="no-messages">
                          <label class="placeholder-icon" text="💬" />
                          <label class="placeholder-text" text="No messages yet" />
                          <label class="placeholder-subtext" text="Be the first to send a message!" />
                        </stack-layout>
                      {{/each}}
                    </stack-layout>
                  </scroll-view>

                  <grid-layout row="1" columns="*, auto" class="message-input-container">
                    <text-field
                      col="0"
                      class="message-input"
                      hint="Type a message..."
                      text={{this.messageText}}
                      {{on "loaded" this.onMessageInputLoaded}}
                      {{on "textChange" this.onMessageTextChange}}
                      returnKeyType="send"
                      {{on "returnPress" this.sendMessage}}
                    />
                    <button
                      col="1"
                      class="btn-send"
                      text="📤"
                      {{on "tap" this.sendMessage}}
                    />
                  </grid-layout>
                </grid-layout>
              {{/if}}
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
