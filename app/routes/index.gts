import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to.gts';
import {on} from "@ember/modifier";
import {service} from "@ember/service";
import Component from "@glimmer/component";


class Page extends Component {
    @service history;
    <template>
        <page>
            <actionBar title="MyApp">
                <navigationButton
                    {{on 'tap' this.history.back}}
                    visibility="{{unless this.history.stack.length 'collapse'}}"
                    android.position="left"
                    text="Go back"
                    android.systemIcon="ic_menu_back"
                />
            </actionBar>
            <stackLayout>
                <label text='Hello world 2!'></label>
                <LinkTo @route='test' @text="test" />
            </stackLayout>
        </page>
    </template>
}

// this will generate a Route class and use the provided template
export default class IndexRoute extends RoutableComponentRoute(Page) {
    activate() {
        console.log('activate');
    }
}
