# omos-cloudtak-plugin

OneMind OS plugin for [CloudTAK](https://github.com/dfpc-coe/CloudTAK).

Adds **Legacy AI** — a sovereign streaming chat panel powered by the OneMind NATS fabric — directly into the CloudTAK tactical map UI.

## What it adds

| Feature | Description |
|---------|-------------|
| **Legacy AI panel** | Right-side chat panel. WebSocket streaming. Legacy responds word-by-word. |
| **Bottom bar status** | Live connection indicator — green dot when Legacy is reachable |
| **Map tools** | `place_marker`, `center_on`, `draw_shape`, `list_visible`, `mission_subscribe` — Legacy can read and write the map |

## Architecture

```
CloudTAK AIPanel.vue
  └── WebSocket wss://<host>/api/omos/ai/ws
        └── nginx ingress rewrite → onemind-ai-bridge (hermes ns)
              └── NATS pub/sub → agents.prompt.hermes.zeus.legacy
                    └── Legacy (Hermes AI on DOKS)
```

## Install (CloudTAK Dockerfile build arg)

```bash
docker build \
  --build-arg WEB_PLUGINS=https://github.com/onemindos/omos-cloudtak-plugin.git \
  -f api/Dockerfile \
  -t ghcr.io/onemindos/cloudtak-api:latest \
  ./api
```

## Requirements (K8s infra)

The plugin connects to `wss://<your-cloudtak-host>/api/omos/ai/ws`.
That path must route to `onemind-ai-bridge` in the `hermes` namespace.

See `omos-infra/platform/cloudtak/onemind-ai-bridge-ingress.yaml` for the nginx ingress config.

## Development

Plugin code lives here. CloudTAK source is **not forked** — this repo is cloned into CloudTAK at build time via `bin/plugin.ts`.

To iterate:
1. Push changes to `main` here
2. Trigger a CloudTAK image rebuild (or build locally with `WEB_PLUGINS` set)
3. `kubectl rollout restart deployment/cloudtak-api -n cloudtak`
