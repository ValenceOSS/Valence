# Deploying Valence

For a server that pulls the image rather than building it, with TLS terminated
by a reverse proxy somewhere else. Written against Dockge, and true of anything
that takes a compose file.

## What you need

- A machine running Docker, with the library on a path it can read
- A reverse proxy in front of it holding the certificate — nginx, Caddy, a
  tunnel, whatever you already run
- A domain pointed at that proxy

Nothing needs writing to disk on the Docker host. There is no certificate, no
Caddyfile, no configuration file of any kind: everything is settings.

## Settings

`compose.yaml` reads these. Set them in Dockge's environment editor, or replace
each `${...}` in the file itself.

| Setting              | Required | What it is                                                                                                                                         |
| -------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD`  | yes      | Any long random string. Only Valence ever uses it.                                                                                                 |
| `BETTER_AUTH_SECRET` | yes      | At least 32 characters. Sign-in cookies are sealed with it, so changing it later signs everybody out.                                              |
| `PUBLIC_URL`         | yes      | Where a browser reaches Valence — the proxy's address, not the NAS's. `https://valence.example.com`                                                |
| `MEDIA_PATH`         | yes      | The library on the host. `/mnt/tank/media`                                                                                                         |
| `VALENCE_PORT`       | no       | The port on the host, 8420 by default. This is what the proxy points at.                                                                           |
| `TZ`                 | no       | UTC by default. Scheduled jobs keep this clock, so "daily at 03:00" means 3am here rather than 3am UTC.                                            |
| `MEDIA_JOBS`         | no       | Files probed at once during a scan, 4 by default.                                                                                                  |
| `CATALOGUE_API_KEY`  | no       | A TMDB key. Without one, titles come from filenames and nothing fetches posters, descriptions or cast.                                             |
| `COOKIE_SECURE`      | no       | True by default, which is right behind HTTPS. Set it false only when testing over plain HTTP, or sign-in will appear to succeed and then not hold. |
| `RENDER_GROUP_ID`    | no       | The group owning `/dev/dri/renderD128`, 44 by default. `ls -n /dev/dri` says which.                                                                |
| `PROFILE_IMAGE_DIR`  | no       | Where profile pictures are kept, `/config/profiles` by default. Wherever you point it, a volume must be mapped there — see below.                  |
| `MEDIA_ACCESS`       | no       | `:ro` by default, which is how a media server should run. Set it to an empty string to mount media read and write, which only re-encoding needs.   |

Two good ways to make a secret:

```sh
openssl rand -base64 48
head -c 48 /dev/urandom | base64
```

## Generating the secrets without a shell

If you cannot reach a terminal on the host, any long random string will do for
both — they are never typed by a person and never shown anywhere. A password
manager's generator set to 48 characters is fine.

## Re-encoding, and why media is read only

Valence mounts your library read only, and nothing it does needs more than that
— with one exception. Re-encoding media, either to reclaim disk by replacing a
file or to keep a smaller copy beside it, writes into a `.valence` folder at the
top of each library — one per library, not one per film — holding the new file
while it is made and the original once it has been swapped aside. That cannot
happen under `:ro`.

It sits under the library root rather than somewhere else on purpose. Swapping
an encode into place is a rename, and a rename is only instant and atomic within
one filesystem; across a volume boundary it would become a copy of the whole
file, needing the disk twice over and able to half-finish.

If you want it, set `MEDIA_ACCESS` to an empty string so the mount becomes read
and write. Leave it alone otherwise; Valence checks before it starts an encode
and says plainly that the folder is read only, rather than failing part way
through two hours of work.

Two things worth knowing before you turn it on:

- **Replacing a file is the only thing in Valence that destroys your own media.**
  Everything else that looks destructive — resetting a library, clearing its
  artwork — deletes rows and derived files that a rescan brings back. A
  re-encoded remux does not come back: what a lossy encoder discards is gone.
- **Nothing is discarded until you have looked at it.** A replacement is
  verified, swapped into place, and then waits. Both files sit on disk until you
  have watched the result and either confirmed it, which disposes of the
  original, or rejected it, which puts the original back in one action. There is
  no timer and no way to skip that step.

The permission is its own: `media.reencode`, separate from deleting media. No
default role but Administrator grants it.

Two more things the compose file sets for you, worth knowing if you run Valence
from source rather than from the image:

- `VALENCE_WRITE_ROOTS` tells the media service which directories it may write
  finished encodes into, as a colon-separated list — the image sets it to
  `/media`. It is deliberately separate from the directories it may *read*, and
  deliberately empty-means-nowhere: reading a file somebody asked to watch and
  writing over the top of it are not the same permission, and a service with no
  authentication of its own should not treat them as though they were. Without
  it every encode is refused.
- **How many encodes may wait for judgement at once** is a server setting,
  five by default. Each one holds both the original and its replacement until
  you look at it, so the queue pauses at that number rather than going on
  consuming disk. Raise it if you have the room.

## Hardware transcoding

`devices` and `group_add` at the bottom of `compose.yaml` pass the GPU through.
**Delete both if the machine has no GPU**, because a device that is not there
stops the container from starting at all, and the failure does not say why.

Without a GPU everything still works; anything that cannot be direct played is
converted on the processor instead, which is slower and costs more of it.

## Requesting (optional)

Valence can take requests for films, series and music, find them on your
indexers, and hand them to a download client of your own. It is a second
service, `requests`, and nothing about it shows in Valence until it is set up:
no sidebar group, no permissions, no webhook events.

It is arriving in stages. For now the service runs, reports whether its VPN is
up, is watched by Valence, and searches your indexers; download clients and
requests themselves follow.

To switch it on:

1. Start the stack with the `requests` profile: `COMPOSE_PROFILES=requests`
   in Dockge, or `docker compose --profile requests up -d`.
2. Set these, and restart Valence:

| Setting            | Required | What it is                                                                                                 |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| `REQUESTS_URL`     | yes      | Where Valence reaches the service. `http://requests:8421` with the compose file as it is.                  |
| `REQUESTS_SECRET`  | yes      | At least 32 characters, the same for both. Valence presents it on every call; the service refuses without. |
| `DOWNLOADS_PATH`   | no       | Where your download client writes, on the host, `./downloads` by default.                                  |
| `VPN_URL`          | no       | gluetun's control server, `http://gluetun:8000`, so Valence can say whether the VPN is up.                 |
| `VPN_API_KEY`      | no       | The key gluetun's control server was given. `docker run --rm qmcgaw/gluetun genkey` makes one.             |
| `FLARESOLVERR_URL` | no       | FlareSolverr, `http://flaresolverr:8191`, for indexers whose sites sit behind Cloudflare's browser check.  |

Setting only one of `REQUESTS_URL` and `REQUESTS_SECRET` leaves requesting off,
and the log says which is missing.

Unlike Valence, the requests service mounts `MEDIA_PATH` writable, because
filing what it downloads into the library is its whole job. Valence itself still
never writes there.

### Indexers

The admin area's Indexers page adds them. Any Torznab or Newznab feed works —
Jackett, Prowlarr, NZBHydra or a usenet indexer's own API — and so does any site
in the catalogue: several hundred public and private trackers, each described by
a [Cardigann definition](https://github.com/Jackett/Jackett/wiki/Definition-format).
Valence runs the definitions itself; it does not need Jackett or Prowlarr.

The catalogue is fetched from GitHub once a day and kept in the database, so a
site the definitions stop describing keeps working until you remove it. It comes
from Prowlarr's definitions by default; to use another copy — your own fork, say —
set these on the requests service:

| Setting                  | Default             |
| ------------------------ | ------------------- |
| `DEFINITIONS_REPOSITORY` | `Prowlarr/Indexers` |
| `DEFINITIONS_BRANCH`     | `master`            |
| `DEFINITIONS_PATH`       | `definitions/v11`   |

Some sites answer with Cloudflare's browser check rather than their pages. The
`flaresolverr` profile starts [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr),
which gets past it; set `FLARESOLVERR_URL` to `http://flaresolverr:8191` to use
it. Without it, those indexers say that Cloudflare stopped them.

Valence raises a warning, and sends the `requests.indexerFailing` webhook, when
an enabled indexer fails three times in a row; five turn it off.
`requests.indexerWorking` follows when it answers again.

### A VPN for the download client

The `vpn` profile starts [gluetun](https://github.com/qdm12/gluetun). Fill in its
provider settings from gluetun's wiki, put your download client on its network
with `network_mode: service:gluetun`, and publish the client's web port on
gluetun rather than on the client. With `VPN_URL` and `VPN_API_KEY` set, the
admin area's Requests page shows whether the tunnel is up and where traffic
leaves from, and Valence raises a warning and a webhook when it drops.

## The proxy

Valence speaks plain HTTP on `VALENCE_PORT` and expects something in front of
it to hold the certificate. Three things matter, and the first two are the ones
people miss:

**The WebSocket has to be allowed through.** Valence keeps one, at
`/api/realtime`. Without the upgrade headers everything loads and nothing
updates by itself — no scan progress, no notifications, nobody appearing in a
watch party.

**Buffering has to be off.** Video is delivered as a playlist and a stream of
segments. A proxy that buffers responses holds each segment until it is whole,
which turns steady playback into stalling.

**`X-Forwarded-For` has to be set.** It is what the sign-in rate limiter counts
against. Without it every household member looks like one address — the proxy's.

### nginx

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 443 ssl;
    http2 on;
    server_name valence.example.com;

    ssl_certificate     /etc/letsencrypt/live/valence.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/valence.example.com/privkey.pem;

    # Photos and avatars are uploaded whole. The default of 1m rejects most of them.
    client_max_body_size 0;

    location / {
        proxy_pass http://192.168.1.40:8420;

        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Segments are served as they are made.
        proxy_buffering off;
        proxy_request_buffering off;

        # A film is longer than a minute, and so is the socket.
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}

server {
    listen 80;
    server_name valence.example.com;
    return 301 https://$host$request_uri;
}
```

Replace `192.168.1.40:8420` with the Docker host and `VALENCE_PORT`, and the
server name and certificate paths with yours.

## First run

1. Create the stack and start it. The server migrates its own database on the
   way up, so the first start takes a little longer than the rest.
2. Open `PUBLIC_URL`. The first account created is the administrator — make it
   before anyone else can.
3. Add a library pointing at `/media`, which is where `MEDIA_PATH` appears
   inside the container. Not the host path: the container cannot see that.
4. Scan. The API answers as soon as the scan is queued rather than when it
   finishes, so a large library reports progress rather than appearing to hang.

## Upgrading

The tag is `latest`, so pull and recreate. In Dockge that is the update button.
Pin a version tag instead if you would rather choose when that happens.

Migrations run on start and are not reversed automatically. Take a copy of the
`db-data` volume before a major upgrade.

### Moving to Postgres 18

`compose.yaml` now asks for `postgres:18-alpine`, where it used to ask for
`postgres:17-alpine`. A major Postgres version cannot read the data directory the
previous one wrote, so pulling the new image over an existing `db-data` volume
upgrades nothing: the container starts, finds a directory it does not recognise,
and stops again. The data has to be carried across by hand.

Dump it while the old version is still the one running, then bring it back:

```bash
docker compose exec db pg_dumpall -U valence > valence-backup.sql
docker compose stop db
docker volume ls | grep db-data
docker volume rm <the volume that names>
docker compose up -d db
docker compose exec -T db psql -U valence -d postgres < valence-backup.sql
docker compose up -d
```

Remove the database volume alone. `config`, `cache` and `transcodes` carry
settings and generated files that the upgrade leaves perfectly good, and
`docker compose down -v` would take all four rather than the one.

`config` is the one that cannot be rebuilt. Alongside the settings it holds
`/config/profiles`, the household's uploaded profile pictures — the only copy
of each. `cache` and `transcodes` hold nothing that cannot be made again, so
losing either costs a re-render and nothing else.

A fresh install needs none of this.

## When something is wrong

**The container starts and stops again.** Usually `devices` on a machine with
no GPU. Delete `devices` and `group_add` and try again.

**Sign-in succeeds and immediately forgets you.** `PUBLIC_URL` does not match
what the browser is actually using, or `COOKIE_SECURE` is true over plain HTTP.

**Everybody's profile picture is a broken image.** The directory holding them
has no volume mapped behind it, so they went when the container was last
recreated. `docker inspect <container> --format '{{json .Mounts}}'` says what is
actually mapped; `PROFILE_IMAGE_DIR` says where Valence is writing them. Map a
volume there and upload them again. A picture Valence cannot find now draws the
profile's initial rather than a broken image, so this shows up as faces turning
back into letters.

**The library scans to nothing.** `MEDIA_PATH` points somewhere the container
cannot read, or the library was added with the host path rather than `/media`.

**Everything loads but nothing updates on its own.** The WebSocket is not
getting through the proxy.
