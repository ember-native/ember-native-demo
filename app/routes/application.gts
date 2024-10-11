import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to.gts';

// this will generate a Route class and use the provided template
export default class ApplicationRoute extends RoutableComponentRoute(<template>
    <page>
        <absoluteLayout>
            <label text='Hello world 2!'></label>
            <LinkTo @route='test' @text="test"></LinkTo>
            {{outlet}}
        </absoluteLayout>
    </page>
</template>) {
    activate() {
        console.log('activate');
    }
}
