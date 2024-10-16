import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to.gts';

// this will generate a Route class and use the provided template
export default class ApplicationRoute extends RoutableComponentRoute(<template>
    <frame>
        <page>
            <absoluteLayout>
                <label text='Hello world 2!'></label>
                <LinkTo @route='test'></LinkTo>
                {{outlet}}
            </absoluteLayout>
        </page>
    </frame>
</template>) {
    activate() {
        console.log('activate');
    }
}
