import RoutableComponentRoute from 'ember-routable-component';

// this will generate a Route class and use the provided template
export default class ApplicationRoute extends RoutableComponentRoute(<template>
    <page>
        <label text='Hello world!'></label>
    </page>
</template>) {
    activate() {
        console.log('activate');
    }
}
