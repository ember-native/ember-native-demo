import RoutableComponentRoute from 'ember-routable-component';
import Component from '@glimmer/component';
import InspectorSupport from 'ember-native/components/InspectorSupport';
import type StoreService from '@ember-data/store';


class RoutableComponent extends Component {
    <template>
        <InspectorSupport >
            <main class='container m-auto min-h-screen px-4 py-8'>
                <div
                    class='mb-6 flex justify-between gap-4 text-2xl font-extrabold lg:text-5xl'
                >
                    <h2>
                        <LinkTo
                            @route='index'
                            class='bg-gradient-to-r from-red-400 to-pink-600 bg-clip-text text-transparent'
                        >
                            Ember Polaris Pokedex
                        </LinkTo>
                        📕🔍✨
                    </h2>
                    <LinkTo @route='about' class='drop-shadow hover:drop-shadow-lg'>
                        ℹ️
                    </LinkTo>
                </div>

                {{outlet}}
            </main>
            <footer class='container m-auto px-4 py-8 text-sm text-slate-700'>
                <p class='font-bold'>© 2024 Ember Polaris Pokedex.</p>
                <p>Pokémon and all related trademarks, characters, and images are
                    ©1995-2024 Nintendo, Creatures, GAME FREAK, and The Pokémon Company.
                    This fan site is not affiliated with or endorsed by any of these
                    entities.</p>
            </footer>
        </InspectorSupport>
    </template>
}


export default class ApplicationRoute extends RoutableComponentRoute(RoutableComponent) {
    @service declare store: StoreService;
    model() {
        return {
            pokemonRequest: this.store.request(query<PokemonModel>('pokemon')),
        };
    }
}
