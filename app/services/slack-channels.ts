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

export default class SlackChannelsService extends Service {
  @service declare slackAuth: SlackAuthService;

  @tracked channels: Channel[] = [];
  @tracked selectedChannelId: string | null = null;
  @tracked isLoading = false;
  @tracked error: string | null = null;

  get selectedChannel(): Channel | undefined {
    return this.channels.find(c => c.id === this.selectedChannelId);
  }

  get publicChannels(): Channel[] {
    return this.channels.filter(c => !c.is_private);
  }

  get privateChannels(): Channel[] {
    return this.channels.filter(c => c.is_private);
  }

  get starredChannels(): Channel[] {
    return this.channels.filter(c => c.is_starred);
  }

  /**
   * Fetch channels from Slack API using client.userBoot
   */
  async fetchChannels(): Promise<void> {
    if (!this.slackAuth.token) {
      this.error = 'Not authenticated';
      return;
    }

    if (!this.slackAuth.dCookie) {
      this.error = 'd cookie is required';
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch('https://ibm.enterprise.slack.com/api/client.userBoot', {
        method: 'POST',
        headers: {
          'Cookie': `d=${this.slackAuth.dCookie}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `token=${encodeURIComponent(this.slackAuth.token)}`,
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch user boot data');
      }

      // Extract channels from userBoot response
      const channels: Channel[] = [];
      const starredIds = new Set(data.starred || []);
      
      // Public channels
      if (data.channels) {
        channels.push(...data.channels.map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          is_channel: true,
          is_private: false,
          is_member: ch.is_member || false,
          is_starred: starredIds.has(ch.id),
          num_members: ch.num_members,
        })));
      }

      // Private channels (groups)
      if (data.ims) {
        channels.push(...data.ims.map((im: any) => ({
          id: im.id,
          name: im.name || 'Direct Message',
          is_channel: false,
          is_private: true,
          is_member: true,
          is_starred: starredIds.has(im.id),
        })));
      }

      this.channels = channels;

      // Auto-select first channel if none selected
      if (this.channels.length > 0 && !this.selectedChannelId) {
        this.selectedChannelId = this.channels[0].id;
      }
    } catch (err) {
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
    const channel = this.channels.find(c => c.id === channelId);
    if (channel) {
      this.selectedChannelId = channelId;
    }
  }

  /**
   * Clear channels
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
