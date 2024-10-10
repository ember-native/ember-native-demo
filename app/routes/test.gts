import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to.gts';

// this will generate a Route class and use the provided template
export default class ApplicationRoute extends RoutableComponentRoute(<template>
    <page>
        <label text='Hello Test!'></label>
    </page>
</template>) {
    activate() {
        console.log('activate');
    }
}
