import RoutableComponentRoute from 'ember-routable-component';
import InspectorSupport from 'ember-native/components/InspectorSupport';
import { service } from '@ember/service';
import type SlackAuthService from '../services/slack-auth';
import type RouterService from '@ember/routing/router-service';


const RoutableComponent = <template>
    <InspectorSupport >
        {{outlet}}
    </InspectorSupport>
</template>;


export default class ApplicationRoute extends RoutableComponentRoute(RoutableComponent) {
    @service declare slackAuth: SlackAuthService;
    @service declare router: RouterService;

    beforeModel() {
        // Restore authentication state from storage
        this.slackAuth.restoreAuth();
    }

    activate() {
        console.log('Application route activated');
        
        // Check authentication and redirect if needed
        const currentRoute = this.router.currentRouteName;
        
        if (!this.slackAuth.isAuthenticated && currentRoute !== 'auth') {
            this.router.transitionTo('auth');
        } else if (this.slackAuth.isAuthenticated && currentRoute === 'auth') {
            this.router.transitionTo('index');
        }
    }
}