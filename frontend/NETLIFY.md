# Checklist Deployment Netlify

Dokumen ini berisi setting yang **wajib diisi manual di Netlify UI**. Semuanya tidak bisa
di-commit ke repository, jadi harus diisi satu per satu.

Status saat ini: repo sudah siap build (build + typecheck lolos), tapi **belum pernah
dideploy** dan **belum ada route yang memanggil backend Flask**.

---

## 1. Prasyarat — perlu 1 klik dari pemilik repo

Continuous deployment Netlify bekerja dengan cara Netlify meng-*install* **Netlify GitHub App**
ke repository. Ini hanya bisa dilakukan oleh pemilik repo.

| Fakta | Nilai |
|---|---|
| Repository | `iniarvinn/Shale-Shaker` |
| Visibility | public, **personal** (bukan organisasi) |
| Izin kita | `push: true`, **`admin: false`** |

Karena repo ini personal, GitHub hanya mengizinkan **pemilik repo** (`iniarvinn`) yang
menginstal GitHub App — collaborator lain tidak bisa, admin pun tidak cukup untuk repo personal.

**Yang perlu diminta ke `iniarvinn`:** saat kita mulai membuat site di Netlify, GitHub akan
mengirim *installation request*. Dia cukup klik **approve** untuk satu repo itu. Setelah itu
selesai — tidak perlu gave admin, tidak perlu dia buat akun Netlify.

> Jangan minta akses `admin`. Satu klik approve sudah cukup.

---

## 2. Build settings

| Field | Nilai | Kenapa |
|---|---|---|
| **Base directory** | `frontend` | **Paling kritis. Lihat catatan di bawah.** |
| Build command | `vite build` | Sudah diisi otomatis oleh `frontend/netlify.toml` |
| Publish directory | `dist/client` | Sudah diisi otomatis oleh `frontend/netlify.toml` |

`frontend/netlify.toml` sudah ikut ter-*commit*, jadi build command dan publish directory
terisi sendiri. **Base directory hanya bisa diisi lewat UI.**

### Kenapa base directory harus `frontend`

Dokumentasi Netlify untuk monorepo menyarankan相反: set *package directory* ke `frontend`
lalu biarkan base directory di root. **Rekomendasi itu tidak berlaku untuk repo kita.**

Saran itu mengasumsikan ada `package.json` di root repo, karena Netlify mencari dependency
dari base directory. Repo ini tidak punya `package.json` di root — hanya ada di `frontend/`.

Kalau base directory diisi root, build akan:

1. Mencari `package.json` di root → tidak ada
2. Tidak menginstall dependency apa pun
3. Menjalankan `vite build` dari root → **gagal**

Karena base directory = `frontend`, Netlify akan menemukan `frontend/netlify.toml`
(urutan pencarian: package directory → base directory → root).

---

## 3. Environment variables

Isi di Netlify → Site configuration → Environment variables.

| Nama | Nilai | Catatan |
|---|---|---|
| `API_BASE_URL` | URL publik backend | Dipakai saat render di server (SSR) |
| `VITE_API_BASE_URL` | URL publik backend | Dipakai browser; **di-*bake* saat build** |

### ⚠️ Jangan pakai `127.0.0.1` di production

Nilai development ada di `frontend/.env.example` (`http://127.0.0.1:5000`). Kalau nilai itu
ter-copied ke Netlify, production akan **gagal tanpa error build** — server-side render akan
menabolic request ke localhost server Netlify, hasilnya `ECONNREFUSED`. Tidak ketahuan sampai
runtime, jadi wajibDicek dua kali sebelum production.

`VITE_API_BASE_URL` di-*inline* ke dalam JavaScript bundle **saat build**. Kalau diubah di
Netlify, build harus dijalankan ulang.

### Status saat ini: belum dipakai

Kedua variabel di atas **belum dibaca aplikasi** — belum ada route yang memanggil backend.
Proxy-nya sudah dikonfigurasi di `vite.config.ts` dan sudah terverifikasi mengembalikan
`200`, tapi belum ada kode yang memakainya. Set variabel ini saat route pertama memang butuh
backend.

Sebagai catatan keamanan yang sudah terverifikasi: `process.env` **tidak pernah muncul** di
bundle client, jadi nilai khusus server tidak bisa bocor ke browser.

---

## 4. Production branch

Default Netlify adalah `main`. Repo kita default branch-nya juga `main`.

Selama kita masih di branch `feature/frontend`, push ke branch tersebut hanya menghasilkan
**branch deploy** (`feature-frontend--<nama-site>.netlify.app`), bukan production URL utama.

Production URL hanya berubah setelah di-merge ke `main`, atau kalau production branch diubah
ke `feature/frontend` sementara selama pengerjaan.

---x

## 5. Deploy

```bash
npx netlify deploy --prod
```

Butuh **netlify-cli 17.31+** (versi terbaru sekarang 27.x) karena dipakai bersama
`@netlify/vite-plugin-tanstack-start`.

### ⚠️ Jangan drag-and-drop `dist/client`

Kalau upload manual folder `dist/client` lewat Netlify UI, folder
`.netlify/functions-internal` ikut terbuang. Folder itu yang menjalankan server-side render —
akibatnya site hanya menampilkan shell HTML kosong tanpa data, tanpa error yang mencolok.

Selalu deploy lewat CLI.

---

## 6. Known limitation — Flask tidak bisa di-host di Netlify

Netlify Functions dan Edge Functions hanya menjalankan JavaScript/TypeScript. Backend Flask
tidak bisa di-deploy ke sana, dan Netlify juga tidak menjalankan Python sebagai backend.

Konsekuensinya: aplikasi akan ter-deploy dan berjalan, tapi **tidak bisa menghubungi Flask**
sampai backend di-host di tempat lain (VPS, Railway, Render, atau layanan Python alike).

`API_BASE_URL` production harus menunjuk ke URL publik backend tersebut. Penempatan backend
itu keputusan tim backend, di luar cakupan frontend.

---

## Verifikasi lokal

Semua yang ada di repo ini sudah lolos):

```bash
pnpm install       # dependency
pnpm dev           # dev server di http://localhost:3000
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint
pnpm build         # client + SSR
```

Proxy ke backend saat dev: Flask harus jalan di `127.0.0.1:5000`, lalu
`http://localhost:3000/api/health` akan meneruskan ke Flask.

Butuh Node versi yang sesuai `frontend/.nvmrc` (24).