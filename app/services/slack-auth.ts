import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class SlackAuthService extends Service {
  @tracked token: string | null = null;
  @tracked selectedWorkspace: string | null = null;
  @tracked workspaces: Array<{ id: string; name: string; icon?: string }> = [];
  @tracked isAuthenticated = false;
  @tracked isLoading = false;
  @tracked error: string | null = null;

  /**
   * Set the Slack API token
   */
  setToken(token: string): void {
    this.token = token;
    this.error = null;
  }

  /**
   * Fetch available workspaces using the provided token
   */
  async fetchWorkspaces(): Promise<void> {
    if (!this.token) {
      this.error = 'No token provided';
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      // Check if it's a session cookie (xoxd-) - use internal API
      if (this.token.startsWith('xoxd-')) {
        await this.fetchWithSessionCookie();
      } 
      // OAuth tokens (xoxb- or xoxp-) - use public API
      else if (this.token.startsWith('xoxb-') || this.token.startsWith('xoxp-')) {
        await this.fetchWithOAuthToken();
      } 
      // Invalid format
      else {
        throw new Error('Invalid token format. Use Bot Token (xoxb-), User Token (xoxp-), or Session Cookie (xoxd-)');
      }
      
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
   * Fetch workspace info using OAuth token (public API)
   */
  private async fetchWithOAuthToken(): Promise<void> {
    const response = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.ok) {
      let errorMsg = data.error || 'Failed to authenticate with Slack';
      
      if (data.error === 'invalid_auth') {
        errorMsg = 'Invalid token. Please create a Bot Token at api.slack.com/apps → OAuth & Permissions';
      } else if (data.error === 'token_revoked') {
        errorMsg = 'Token has been revoked. Please generate a new token';
      } else if (data.error === 'account_inactive') {
        errorMsg = 'Account is inactive. Please check your Slack workspace';
      }
      
      throw new Error(errorMsg);
    }

    this.workspaces = [
      {
        id: data.team_id,
        name: data.team,
        icon: '💬'
      }
    ];
  }

  /**
   * Fetch workspace info using session cookie (internal API)
   * WARNING: This uses undocumented Slack internal API and may break at any time
   */
  private async fetchWithSessionCookie(): Promise<void> {
    const response = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Cookie': `d=${this.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Session cookie authentication failed. Cookie may be expired or invalid.');
    }

    this.workspaces = [
      {
        id: data.team_id,
        name: data.team,
        icon: '🍪'
      }
    ];
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
  logout(): void {
    this.token = null;
    this.selectedWorkspace = null;
    this.workspaces = [];
    this.isAuthenticated = false;
    this.error = null;

    // Clear from storage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('slack_token');
      localStorage.removeItem('slack_workspace');
    }
  }

  /**
   * Restore authentication from storage
   */
  restoreAuth(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const storedToken = localStorage.getItem('slack_token');
    const storedWorkspace = localStorage.getItem('slack_workspace');

    if (storedToken && storedWorkspace) {
      this.token = storedToken;
      this.selectedWorkspace = storedWorkspace;
      this.isAuthenticated = true;
    }
  }

  /**
   * Persist authentication to storage
   */
  private persistAuth(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (this.token) {
      localStorage.setItem('slack_token', this.token);
    }
    
    if (this.selectedWorkspace) {
      localStorage.setItem('slack_workspace', this.selectedWorkspace);
    }
  }


}

declare module '@ember/service' {
  interface Registry {
    'slack-auth': SlackAuthService;
  }
}
