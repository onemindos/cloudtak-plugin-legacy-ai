import { h } from 'vue';
import type { App } from 'vue';
import type { PluginAPI, PluginInstance } from '@tak-ps/cloudtak';
import MenuTemplate from './lib/MenuTemplate.vue';
import AIPanel from './lib/AIPanel.vue';
import AIBottomBar from './lib/AIBottomBar.vue';
import IconAI from './lib/IconAI.vue';

const ROUTE_NAME = 'home-menu-onemind-ai';
const MENU_KEY   = 'onemind-ai';
const BB_KEY     = 'onemind-ai-status';

export default class OneMindAI implements PluginInstance {
    api: PluginAPI;

    constructor(api: PluginAPI) {
        this.api = api;
    }

    static async install(_app: App, api: PluginAPI): Promise<PluginInstance> {
        return new OneMindAI(api);
    }

    async enable(): Promise<void> {
        this.api.routes.add(
            {
                path: 'onemind-ai',
                name: ROUTE_NAME,
                component: {
                    render: () => h(MenuTemplate, { name: 'Legacy AI' }, {
                        default: () => h(AIPanel)
                    })
                },
            },
            'home-menu'
        );

        this.api.menu.add({
            key:         MENU_KEY,
            label:       'Legacy AI',
            route:       ROUTE_NAME,
            tooltip:     'Chat with Legacy — sovereign AI',
            description: 'Streaming AI situational awareness — map-aware, NATS-native',
            icon:        IconAI,
        });

        this.api.bottomBar.add({
            key:       BB_KEY,
            component: AIBottomBar,
        });
    }

    async disable(): Promise<void> {
        this.api.bottomBar.remove(BB_KEY);
        this.api.menu.remove(MENU_KEY);
        this.api.router.removeRoute(ROUTE_NAME);
    }
}
