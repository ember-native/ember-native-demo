import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type SlackAuthService from './slack-auth';
import { Http } from '@nativescript/core';

interface Message {
  ts: string;
  user: string;
  text: string;
  type: string;
  subtype?: string;
  username?: string;
  bot_id?: string;
  edited?: {
    user: string;
    ts: string;
  };
}

interface User {
  id: string;
  name: string;
  real_name: string;
  profile: {
    display_name: string;
    real_name: string;
    image_72: string;
  };
}

interface SlackApiResponse {
  ok: boolean;
  error?: string;
  messages?: Message[];
  members?: User[];
}

export default class SlackMessagesService extends Service {
  @service declare slackAuth: SlackAuthService;

  @tracked messages: Message[] = [];
  @tracked users: Map<string, User> = new Map();
  @tracked isLoading = false;
  @tracked error: string | null = null;
  @tracked currentChannelId: string | null = null;

  /**
   * Build common headers for Slack API requests
   */
  private getRequestHeaders(): Record<string, string> {
    return {
      'Cookie': `d=${this.slackAuth.dCookie}; d-s=${Date.now()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Authorization': `Bearer ${this.slackAuth.token}`,
    };
  }

  /**
   * Get workspace URL from auth service
   */
  private getWorkspaceUrl(): string {
    return this.slackAuth.workspaces[0]?.url || 'https://slack.com';
  }

  /**
   * Make a Slack API request
   */
  private async makeSlackRequest(
    endpoint: string,
    params: Record<string, string>
  ): Promise<SlackApiResponse> {
    const url = `${this.getWorkspaceUrl()}/api/${endpoint}`;
    const body = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const response = await Http.request({
      url,
      method: 'POST',
      headers: this.getRequestHeaders(),
      content: body,
    });

    const data = response.content?.toJSON() as SlackApiResponse;

    if (!data.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  /**
   * Fetch messages for a specific channel
   */
  async fetchMessages(channelId: string): Promise<void> {
    if (!this.slackAuth.token || !this.slackAuth.dCookie) {
      this.error = 'Not authenticated';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.currentChannelId = channelId;

    try {
      const data = await this.makeSlackRequest('conversations.history', {
        token: this.slackAuth.token,
        channel: channelId,
        limit: '50',
      });

      // Sort messages by timestamp (oldest first)
      this.messages = (data.messages || []).reverse();

      // Fetch users if not already loaded
      if (this.users.size === 0) {
        await this.fetchAllUsers();
      }
    } catch (err) {
      console.error('[SlackMessages] Error fetching messages:', err);
      this.error = err instanceof Error ? err.message : 'Failed to fetch messages';
      this.messages = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch all users at once using users.list
   */
  private async fetchAllUsers(): Promise<void> {
    if (!this.slackAuth.token || !this.slackAuth.dCookie) {
      return;
    }

    try {
      const data = await this.makeSlackRequest('users.list', {
        token: this.slackAuth.token,
        limit: '1000',
      });

      if (data.members) {
        for (const user of data.members) {
          this.users.set(user.id, user);
        }
        // Trigger reactivity
        this.users = new Map(this.users);
      }
    } catch (err) {
      console.error('[SlackMessages] Error fetching users:', err);
    }
  }

  /**
   * Get display name for a user
   */
  getUserDisplayName(userId: string): string {
    if (!this.users || !userId) {
      return 'Unknown User';
    }

    const user = this.users.get(userId);
    if (!user) {
      return 'Unknown User';
    }

    return (
      user.profile?.display_name ||
      user.profile?.real_name ||
      user.real_name ||
      user.name ||
      'Unknown User'
    );
  }

  /**
   * Send a message to the current channel
   */
  async sendMessage(text: string): Promise<void> {
    if (!this.slackAuth.token || !this.slackAuth.dCookie) {
      throw new Error('Not authenticated');
    }

    if (!this.currentChannelId) {
      throw new Error('No channel selected');
    }

    if (!text.trim()) {
      throw new Error('Message cannot be empty');
    }

    try {
      await this.makeSlackRequest('chat.postMessage', {
        token: this.slackAuth.token,
        channel: this.currentChannelId,
        text: text.trim(),
      });

      // Refresh messages to show the new one
      await this.fetchMessages(this.currentChannelId);
    } catch (err) {
      console.error('[SlackMessages] Error sending message:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to send message');
    }
  }

  /**
   * Format timestamp to readable time
   */
  formatTimestamp(ts: string): string {
    const timestamp = parseFloat(ts) * 1000;
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Clear messages and user cache
   */
  clear(): void {
    this.messages = [];
    this.users.clear();
    this.currentChannelId = null;
    this.error = null;
  }
}

declare module '@ember/service' {
  interface Registry {
    'slack-messages': SlackMessagesService;
  }
}