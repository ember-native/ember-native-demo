import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to.gts';

// this will generate a Route class and use the provided template
export default class IndexRoute extends RoutableComponentRoute(<template>
    <page>
        <actionBar title="MyApp">
            <navigationButton text="Go back" android.systemIcon="ic_menu_back" />
        </actionBar>
        <stackLayout>

            <label text='Hello world 2!'></label>
            <LinkTo @route='test' @text="test" />

        </stackLayout>
    </page>
</template>) {
    activate() {
        console.log('activate');
    }
}
