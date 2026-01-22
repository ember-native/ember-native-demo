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

export default class SlackMessagesService extends Service {
  @service declare slackAuth: SlackAuthService;

  @tracked messages: Message[] = [];
  @tracked users: Map<string, User> = new Map();
  @tracked isLoading = false;
  @tracked error: string | null = null;
  @tracked currentChannelId: string | null = null;

  /**
   * Fetch messages for a specific channel
   */
  async fetchMessages(channelId: string): Promise<void> {
    console.log('[SlackMessages] fetchMessages called with channelId:', channelId);

    if (!this.slackAuth.token) {
      console.error('[SlackMessages] No token available');
      this.error = 'Not authenticated';
      return;
    }

    if (!this.slackAuth.dCookie) {
      console.error('[SlackMessages] No dCookie available');
      this.error = 'd cookie is required';
      return;
    }

    console.log('[SlackMessages] Token prefix:', this.slackAuth.token.substring(0, 10));
    console.log('[SlackMessages] Token length:', this.slackAuth.token.length);
    console.log('[SlackMessages] dCookie prefix:', this.slackAuth.dCookie.substring(0, 10));
    console.log('[SlackMessages] dCookie length:', this.slackAuth.dCookie.length);
    console.log('[SlackMessages] Starting fetch with token and dCookie present');
    this.isLoading = true;
    this.error = null;
    this.currentChannelId = channelId;

    try {
      // Fetch conversation info which includes recent messages and user information
      const url = 'https://ibm.enterprise.slack.com/api/conversations.history';
      const body = `token=${encodeURIComponent(this.slackAuth.token)}&channel=${encodeURIComponent(channelId)}&limit=28&ignore_replies=true&include_pin_count=true&inclusive=true&no_user_profile=true&include_stories=true&include_free_team_extra_messages=true&include_date_joined=false&include_all_metadata=true`;

      console.log('[SlackMessages] Fetching from:', url);
      console.log('[SlackMessages] Request body length:', body.length);

      const response = await Http.request({
        url,
        method: 'POST',
        headers: {
          'Cookie': `d=${this.slackAuth.dCookie}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        content: body,
      });

      console.log('[SlackMessages] Response status:', response.statusCode);
      const data = response.content?.toJSON();
      console.log('[SlackMessages] Response data:', JSON.stringify(data).substring(0, 200));

      if (!data.ok) {
        console.error('[SlackMessages] API returned error:', data.error);
        throw new Error(JSON.stringify(data) || 'Failed to fetch messages');
      }

      console.log('[SlackMessages] Received', data.messages?.length || 0, 'messages');

      // Sort messages by timestamp (oldest first)
      this.messages = (data.messages || []).reverse();

      // Extract user information from the response if available
      if (data.users) {
        console.log('[SlackMessages] Response includes', data.users.length, 'users');
        for (const user of data.users) {
          this.users.set(user.id, user);
        }
        // Trigger reactivity
        this.users = new Map(this.users);
      }

      // If users not in response, fetch all users at once
      if (!data.users || data.users.length === 0) {
        console.log('[SlackMessages] No users in response, fetching all users');
        await this.fetchAllUsers();
      }

      console.log('[SlackMessages] Successfully loaded messages');
    } catch (err) {
      console.error('[SlackMessages] Error fetching messages:', err);
      this.error = 'Failed to fetch messages';
      this.messages = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch all users at once using users.list
   */
  private async fetchAllUsers(): Promise<void> {
    console.log('[SlackMessages] fetchAllUsers called');

    if (!this.slackAuth.token || !this.slackAuth.dCookie) {
      console.error('[SlackMessages] Missing token or dCookie in fetchAllUsers');
      return;
    }

    try {
      console.log('[SlackMessages] Fetching users list');
      const response = await Http.request({
        url: 'https://ibm.enterprise.slack.com/api/users.list',
        method: 'POST',
        headers: {
          'Cookie': `d=${this.slackAuth.dCookie}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        content: `token=${encodeURIComponent(this.slackAuth.token)}&limit=1000`,
      });

      console.log('[SlackMessages] Users list response status:', response.statusCode);
      const data = response.content?.toJSON();
      console.log('[SlackMessages] Users list response ok:', data.ok, 'members count:', data.members?.length || 0);

      if (data.ok && data.members) {
        for (const user of data.members) {
          this.users.set(user.id, user);
        }
        // Trigger reactivity
        this.users = new Map(this.users);
        console.log('[SlackMessages] Successfully loaded', this.users.size, 'users');
      } else {
        console.error('[SlackMessages] Failed to fetch users:', data.error);
      }
    } catch (err) {
      console.error('[SlackMessages] Error in fetchAllUsers:', err);
    }
  }

  /**
   * Get display name for a user
   */
  getUserDisplayName(userId: string): string {
    const user = this.users.get(userId);
    if (!user) return 'Unknown User';

    return user.profile.display_name ||
           user.profile.real_name ||
           user.real_name ||
           user.name ||
           'Unknown User';
  }

  /**
   * Send a message to the current channel
   */
  async sendMessage(text: string): Promise<void> {
    console.log('[SlackMessages] sendMessage called with text length:', text.length);

    if (!this.slackAuth.token || !this.slackAuth.dCookie) {
      console.error('[SlackMessages] Not authenticated for sendMessage');
      throw new Error('Not authenticated');
    }

    if (!this.currentChannelId) {
      console.error('[SlackMessages] No channel selected');
      throw new Error('No channel selected');
    }

    if (!text.trim()) {
      console.error('[SlackMessages] Empty message text');
      throw new Error('Message cannot be empty');
    }

    try {
      console.log('[SlackMessages] Sending message to channel:', this.currentChannelId);
      const response = await Http.request({
        url: 'https://ibm.enterprise.slack.com/api/chat.postMessage',
        method: 'POST',
        headers: {
          'Cookie': `d=${this.slackAuth.dCookie}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        content: `token=${encodeURIComponent(this.slackAuth.token)}&channel=${encodeURIComponent(this.currentChannelId)}&text=${encodeURIComponent(text)}`,
      });

      console.log('[SlackMessages] Send message response status:', response.statusCode);
      const data = response.content?.toJSON();
      console.log('[SlackMessages] Send message response ok:', data.ok);

      if (!data.ok) {
        console.error('[SlackMessages] Failed to send message:', data.error);
        throw new Error(data.error || 'Failed to send message');
      }

      console.log('[SlackMessages] Message sent successfully, refreshing messages');
      // Refresh messages to show the new one
      await this.fetchMessages(this.currentChannelId);
    } catch (err) {
      console.error('[SlackMessages] Error in sendMessage:', err);
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
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * Clear messages
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

