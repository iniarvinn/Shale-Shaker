# Deploy Frontend (Docker + GitHub Actions)

Frontend: TanStack Start (Vite + Nitro `node-server`), dijalankan sebagai container Node.
Workflow: `.github/workflows/frontend-deploy.yml` (di root repo).

## Build & jalankan lokal

```bash
cd frontend
cp .env.example .env        # opsional
docker compose up --build   # http://127.0.0.1:3010
curl http://127.0.0.1:3010/healthz   # -> ok
```

`VITE_API_BASE_URL` bersifat **build-time**. Ubah lewat env saat build:

```bash
VITE_API_BASE_URL=https://api.example.com docker compose up --build
```

Build Netlify tetap bisa: `DEPLOY_TARGET=netlify` (sudah diset di `netlify.toml`).
Tanpa variabel itu, `vite build` menghasilkan server Node (`.output/`).

## GitHub Secrets & Variables

Secrets (Settings → Secrets and variables → Actions):

| Nama | Wajib | Keterangan |
|---|---|---|
| `VPS_HOST` | ya | Host/IP VPS |
| `VPS_USER` | ya | User SSH |
| `VPS_SSH_KEY` | ya | Private key SSH |
| `VPS_PORT` | tidak | Default 22 |

Variables:

| Nama | Wajib | Keterangan |
|---|---|---|
| `VPS_DEPLOY_PATH` | ya | Folder deploy di VPS, mis. `/home/<user>/shale-shaker/frontend` |
| `VITE_API_BASE_URL` | tidak | Default `/api` (build-time) |
| `CONTAINER_RUNTIME` | tidak | `docker` (default) atau `podman` |

Job `deploy` memakai GitHub Environment `production`. Buat environment itu
(opsional: tambahkan required reviewers).

Tidak perlu secret registry: login ke ghcr.io memakai `GITHUB_TOKEN`.
Package ghcr.io perlu dibuat **public** (Package settings → Change visibility)
setelah push pertama, agar VPS bisa pull tanpa login.

## Setup pertama di VPS

```bash
# 1. Network external (sekali saja)
docker network create jsa_net            # atau: podman network create jsa_net

# 2. Folder deploy (sama dengan VPS_DEPLOY_PATH)
mkdir -p /home/<user>/shale-shaker/frontend && cd $_

# 3. File .env runtime (rahasia, tidak ada di repo/image)
cp .env.example .env   # atau buat manual; lihat frontend/.env.example

# 4. Hanya jika package private
echo <PAT read:packages> | docker login ghcr.io -u <github-user> --password-stdin
```

`compose.prod.yml` dikirim otomatis oleh workflow di setiap deploy.
Port host: `127.0.0.1:3010` (ubah di `compose.prod.yml` bila bentrok).

## Rollback

Setiap build diberi tag `latest` dan `<sha-commit>`. Di VPS, edit `compose.prod.yml`:

```yaml
image: ghcr.io/iniarvinn/shale-shaker-frontend:<sha-sebelumnya>
```

lalu `docker compose -f compose.prod.yml up -d`. Catatan: deploy berikutnya menimpa
`compose.prod.yml` kembali ke `latest`.

## Reverse proxy

Container hanya bind ke `127.0.0.1:3010`. Contoh Nginx:

```nginx
server {
    server_name app.example.com;

    # Backend Flask (sesuai VITE_API_BASE_URL=/api)
    location /api/ {
        proxy_pass http://127.0.0.1:5000;   # sesuaikan dengan port backend
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500m;          # upload video
    }

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
