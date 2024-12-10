import { RouteTemplate } from 'ember-polaris-pokedex/utils/ember-route-template';
import Component from '@glimmer/component';
import { LinkTo } from '@ember/routing';

@RouteTemplate
export default class ApplicationTemplate extends Component {
  <template>
    <content-view class='container m-auto min-h-screen px-4 py-8'>
      <content-view
        class='mb-6 flex justify-between gap-4 text-2xl font-extrabold lg:text-5xl'
      >
      <LinkTo
        @route='index'
        class='bg-gradient-to-r from-red-400 to-pink-600 bg-clip-text text-transparent'
      >
        Ember Polaris Pokedex
      </LinkTo>
      📕🔍✨
        <LinkTo @route='about' class='drop-shadow hover:drop-shadow-lg'>
          ℹ️
        </LinkTo>
      </content-view>

      {{outlet}}
    </content-view>
    <content-view class='container m-auto px-4 py-8 text-sm text-slate-700'>
      <label class='font-bold'>© 2024 Ember Polaris Pokedex.</label>
      <label>Pokémon and all related trademarks, characters, and images are
        ©1995-2024 Nintendo, Creatures, GAME FREAK, and The Pokémon Company.
        This fan site is not affiliated with or endorsed by any of these
        entities.</label>
    </content-view>
  </template>
}
