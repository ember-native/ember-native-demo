import RoutableComponentRoute from 'ember-routable-component';
import LinkTo from '../ui/components/link-to.gts';

// this will generate a Route class and use the provided template
export default class TestRoute extends RoutableComponentRoute(<template>
        <label text='Hello Test!'></label>
</template>) {
    activate() {
        console.log('activate');
    }
}
