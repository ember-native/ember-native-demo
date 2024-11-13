import RoutableComponentRoute from 'ember-routable-component';
import Component from '@glimmer/component';
import InspectorSupport from 'ember-native/components/InspectorSupport';
import SideNav from '~/ui/components/side-nav.gts';


class RoutableComponent extends Component {
    <template>
        <InspectorSupport >
            <SideNav>
                {{outlet}}
            </SideNav>
        </InspectorSupport>
    </template>
}


export default class ApplicationRoute extends RoutableComponentRoute(RoutableComponent) {
    activate() {
        console.log('activate');
    }
}
