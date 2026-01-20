import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { SecureStorage } from '@nativescript/secure-storage';

export default class SlackAuthService extends Service {
  @tracked token: string | null = null;
  @tracked dCookie: string | null = null;
  @tracked workspaceDomain: string | null = null;
  @tracked selectedWorkspace: string | null = null;
  @tracked workspaces: Array<{ id: string; name: string; icon?: string }> = [];
  @tracked isAuthenticated = false;
  @tracked isLoading = false;
  @tracked error: string | null = null;

  private _secureStorage: SecureStorage | null = null;

  private get secureStorage(): SecureStorage | null {
    if (!this._secureStorage) {
      try {
        this._secureStorage = new SecureStorage();
      } catch (err) {
        console.warn('SecureStorage not available:', err);
        return null;
      }
    }
    return this._secureStorage;
  }

  /**
   * Set the Slack API token and d cookie (both required)
   */
  setToken(token: string, dCookie: string): void {
    this.token = token;
    this.dCookie = dCookie;
    this.error = null;
  }

  /**
   * Fetch available workspaces using the client token
   */
  async fetchWorkspaces(): Promise<void> {
    if (!this.token) {
      this.error = 'No token provided';
      return;
    }

    if (!this.dCookie) {
      this.error = 'd cookie is required';
      return;
    }

    if (!this.token.startsWith('xoxc-')) {
      this.error = 'Only xoxc- client tokens are supported';
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      await this.fetchWithClientToken();

      if (this.workspaces.length === 0) {
        this.error = 'No workspaces found for this token';
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch workspaces';
      this.workspaces = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch workspace info using client token (xoxc-) with d cookie
   * This is how Slack's web/desktop client authenticates
   */
  private async fetchWithClientToken(): Promise<void> {
    const url = `https://slack.com/api/team.info?token=${encodeURIComponent(this.token!)}`;

    console.log('Fetching with client token:', { hasToken: !!this.token, hasCookie: !!this.dCookie });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': `d=${this.dCookie}`,
        'User-Agent': 'Mozilla/5.0 (compatible; SlackLite/1.0)',
      },
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data).substring(0, 200));

    if (!data.ok) {
      throw new Error(`${data.error || 'Client token authentication failed'} - Status: ${response.status}`);
    }

    if (data.team) {
      this.workspaces = [
        {
          id: data.team.id,
          name: data.team.name || data.team.domain,
          icon: '🔐'
        }
      ];
    } else {
      throw new Error('Could not extract team info from response');
    }
  }

  /**
   * Select a workspace and complete authentication
   */
  selectWorkspace(workspaceId: string): void {
    const workspace = this.workspaces.find(w => w.id === workspaceId);

    if (!workspace) {
      this.error = 'Invalid workspace selected';
      return;
    }

    this.selectedWorkspace = workspaceId;
    this.isAuthenticated = true;
    this.error = null;

    // Store token and workspace in local storage for persistence
    this.persistAuth();
  }

  /**
   * Clear authentication and reset state
   */
  async logout() {
    this.token = null;
    this.dCookie = null;
    this.selectedWorkspace = null;
    this.workspaces = [];
    this.isAuthenticated = false;
    this.error = null;

    // Clear from secure storage
    try {
      await this.secureStorage.remove({ key: 'slack_token' });
      await this.secureStorage.remove({ key: 'slack_d_cookie' });
      await this.secureStorage.remove({ key: 'slack_workspace' });
    } catch (err) {
      console.error('Failed to clear secure storage:', err);
    }
  }

  /**
   * Restore authentication from storage
   */
  async restoreAuth(): Promise<void> {
    const storage = this.secureStorage;
    if (!storage) {
      console.warn('SecureStorage not available, skipping auth restoration');
      return;
    }

    try {
      const storedToken = await storage.get({ key: 'slack_token' });
      const storedDCookie = await storage.get({ key: 'slack_d_cookie' });
      const storedWorkspace = await storage.get({ key: 'slack_workspace' });

      if (storedToken && storedDCookie && storedWorkspace) {
        this.token = storedToken;
        this.dCookie = storedDCookie;
        this.selectedWorkspace = storedWorkspace;
        this.isAuthenticated = true;
      }
    } catch (err) {
      console.error('Failed to restore from secure storage:', err);
    }
  }

  /**
   * Persist authentication to storage
   */
  private persistAuth(): void {
    const storage = this.secureStorage;
    if (!storage) {
      console.warn('SecureStorage not available, skipping auth persistence');
      return;
    }

    try {
      if (this.token) {
        storage.set({ key: 'slack_token', value: this.token });
      }

      if (this.dCookie) {
        storage.set({ key: 'slack_d_cookie', value: this.dCookie });
      }

      if (this.selectedWorkspace) {
        storage.set({ key: 'slack_workspace', value: this.selectedWorkspace });
      }
    } catch (err) {
      console.error('Failed to persist to secure storage:', err);
      this.error = 'Failed to save credentials securely';
    }
  }
}

declare module '@ember/service' {
  interface Registry {
    'slack-auth': SlackAuthService;
  }
}

