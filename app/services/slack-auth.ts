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
      // In a real app, this would call the Slack API
      // For now, we'll simulate with mock data
      const response = await this.mockSlackApiCall();
      
      this.workspaces = response.teams || [];
      
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

  /**
   * Mock Slack API call for demo purposes
   * In production, this would call the actual Slack API
   */
  private async mockSlackApiCall(): Promise<{ teams: Array<{ id: string; name: string; icon?: string }> }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response based on token
    if (this.token === 'invalid') {
      throw new Error('Invalid token');
    }

    return {
      teams: [
        {
          id: 'T01234567',
          name: 'My Workspace',
          icon: '🚀'
        },
        {
          id: 'T01234568',
          name: 'Development Team',
          icon: '💻'
        },
        {
          id: 'T01234569',
          name: 'Design Squad',
          icon: '🎨'
        }
      ]
    };
  }
}

declare module '@ember/service' {
  interface Registry {
    'slack-auth': SlackAuthService;
  }
}
