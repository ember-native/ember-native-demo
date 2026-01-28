import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type SlackAuthService from './slack-auth';

interface Channel {
  id: string;
  name: string;
  is_channel: boolean;
  is_private: boolean;
  is_member: boolean;
  is_starred?: boolean;
  num_members?: number;
}

interface UserBootResponse {
  ok: boolean;
  error?: string;
  channels?: any[];
  ims?: any[];
  starred?: string[];
}

export default class SlackChannelsService extends Service {
  @service declare slackAuth: SlackAuthService;

  @tracked channels: Channel[] = [];
  @tracked selectedChannelId: string | null = null;
  @tracked isLoading = false;
  @tracked error: string | null = null;

  get selectedChannel(): Channel | undefined {
    return this.channels.find((c) => c.id === this.selectedChannelId);
  }

  get publicChannels(): Channel[] {
    return this.channels.filter((c) => !c.is_private && !c.is_starred);
  }

  get privateChannels(): Channel[] {
    return this.channels.filter((c) => c.is_private && !c.is_starred);
  }

  get starredChannels(): Channel[] {
    return this.channels.filter((c) => c.is_starred);
  }

  /**
   * Get workspace URL from auth service
   */
  private getWorkspaceUrl(): string {
    return this.slackAuth.workspaces[0]?.url || 'https://slack.com';
  }

  /**
   * Build common headers for Slack API requests
   */
  private getRequestHeaders(): HeadersInit {
    return {
      'Cookie': `d=${this.slackAuth.dCookie}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    };
  }

  /**
   * Parse channels from userBoot response
   */
  private parseChannels(data: UserBootResponse): Channel[] {
    const channels: Channel[] = [];
    const starredIds = new Set(data.starred || []);

    // Public channels - only include channels user is a member of
    if (data.channels) {
      channels.push(
        ...data.channels.map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          is_channel: true,
          is_private: false,
          is_member: true,
          is_starred: starredIds.has(ch.id),
          num_members: ch.num_members,
        }))
      );
    }

    // Private channels (direct messages)
    if (data.ims) {
      channels.push(
        ...data.ims.map((im: any) => ({
          id: im.id,
          name: im.name || 'Direct Message',
          is_channel: false,
          is_private: true,
          is_member: true,
          is_starred: starredIds.has(im.id),
        }))
      );
    }

    return channels;
  }

  /**
   * Fetch channels from Slack API using client.userBoot
   */
  async fetchChannels(): Promise<void> {
    if (!this.slackAuth.token || !this.slackAuth.dCookie) {
      this.error = 'Not authenticated';
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const apiUrl = `${this.getWorkspaceUrl()}/api/client.userBoot`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: this.getRequestHeaders(),
        body: `token=${encodeURIComponent(this.slackAuth.token)}`,
      });

      const data: UserBootResponse = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch user boot data');
      }

      this.channels = this.parseChannels(data);

      // Auto-select first channel if none selected
      if (this.channels.length > 0 && !this.selectedChannelId) {
        this.selectedChannelId = this.channels[0].id;
      }
    } catch (err) {
      console.error('[SlackChannels] Error fetching channels:', err);
      this.error = err instanceof Error ? err.message : 'Failed to fetch channels';
      this.channels = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Select a channel
   */
  selectChannel(channelId: string): void {
    const channel = this.channels.find((c) => c.id === channelId);
    if (channel) {
      this.selectedChannelId = channelId;
    }
  }

  /**
   * Clear channels and reset state
   */
  clear(): void {
    this.channels = [];
    this.selectedChannelId = null;
    this.error = null;
  }
}

declare module '@ember/service' {
  interface Registry {
    'slack-channels': SlackChannelsService;
  }
}