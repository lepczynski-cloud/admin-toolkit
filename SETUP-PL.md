# Admin Toolkit — GitHub i Cloudflare Workers Builds

Admin Toolkit jest statyczną stroną napisaną w HTML, CSS i JavaScript. Nie wymaga backendu, bazy danych ani procesu kompilowania.

Docelowy adres:

```text
https://admintoolkit.lepczynski.it/
```

## 1. Struktura repozytorium

Pliki przeznaczone do publikacji znajdują się w katalogu:

```text
public/
```

Plik:

```text
wrangler.jsonc
```

pozostaje w głównym katalogu repozytorium i wskazuje Cloudflare katalog statycznych zasobów:

```json
"assets": {
  "directory": "./public"
}
```

W repozytorium powinien być widoczny następujący układ:

```text
admin-toolkit/
├── public/
│   ├── index.html
│   ├── 404.html
│   ├── assets/
│   ├── cidr/
│   ├── chmod/
│   ├── cron/
│   ├── timestamp/
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── site.webmanifest
│   └── sw.js
├── wrangler.jsonc
├── README.md
├── CLOUDFLARE-GITHUB.md
├── SETUP-PL.md
├── LICENSE
└── .gitignore
```

## 2. Ważna zasada dotycząca ścieżek

W repozytorium plik obrazu ma ścieżkę:

```text
public/assets/og/admin-toolkit.png
```

Po wdrożeniu katalog `public/` staje się katalogiem głównym witryny, dlatego publiczny adres tego samego pliku to:

```text
https://admintoolkit.lepczynski.it/assets/og/admin-toolkit.png
```

W kodzie strony należy więc używać:

```html
/assets/og/admin-toolkit.png
```

a nie:

```html
/public/assets/og/admin-toolkit.png
```

Prefiks `public/` jest potrzebny tylko w ścieżkach repozytorium i dokumentacji dotyczącej plików.

## 3. Konfiguracja linków

Adresy bloga, YouTube, GitHuba oraz przyszłego filmu i artykułu znajdują się w:

```text
public/assets/js/config.js
```

Domyślna konfiguracja:

```js
window.ADMIN_TOOLKIT_CONFIG = Object.freeze({
  siteUrl: "https://admintoolkit.lepczynski.it",
  blogUrl: "https://lepczynski.it",
  youtubeUrl: "https://www.youtube.com/@WojciechLepczynski",
  githubUrl: "https://github.com/lepczynski-cloud/admin-toolkit",
  projectArticleUrl: "",
  projectVideoUrl: ""
});
```

Po opublikowaniu materiałów wpisz pełne adresy do `projectArticleUrl` i `projectVideoUrl`. Przyciski pozostają ukryte, dopóki wartości są puste.

## 4. Połączenie repozytorium z Cloudflare

W panelu Cloudflare otwórz istniejącego Workera `admin-toolkit` i połącz repozytorium GitHub.

Ustawienia:

```text
Repository: admin-toolkit
Production branch: main
Build command: pozostaw puste
Deploy command: npx wrangler deploy
Non-production branch deploy command: npx wrangler versions upload
Root directory: / lub główny katalog repozytorium
API token: Create new token
Build variables: brak
Build caching: domyślne
```

Nie ustawiaj Root directory na `/public`. Cloudflare musi uruchomić Wranglera w katalogu, w którym znajduje się `wrangler.jsonc`.

## 5. Nazwa Workera

W `wrangler.jsonc` znajduje się:

```json
"name": "admin-toolkit"
```

Ta wartość musi być identyczna z nazwą istniejącego Workera w Cloudflare. Dzięki temu wdrożenie z GitHuba zaktualizuje ten sam Worker i zachowa przypisaną domenę.

## 6. Automatyczne wdrażanie

Po połączeniu repozytorium każdy commit wysłany do `main` uruchomi:

```text
npx wrangler deploy
```

Wrangler odczyta `wrangler.jsonc` i prześle pliki z `public/`.

Schemat:

```text
zmiana kodu
→ commit
→ push do main
→ Cloudflare Workers Build
→ automatyczne wdrożenie
→ aktualizacja admintoolkit.lepczynski.it
```

## 7. Lokalne uruchomienie

Uruchom polecenie w głównym katalogu repozytorium:

```bash
python -m http.server 8080 --directory public
```

Na Windowsie możesz użyć:

```powershell
py -m http.server 8080 --directory public
```

Następnie otwórz:

```text
http://localhost:8080/
```

Nie uruchamiaj serwera bez `--directory public`, ponieważ ścieżki `/assets/...` nie będą wtedy prowadziły do właściwych plików.

## 8. Test po wdrożeniu

Sprawdź:

```text
https://admintoolkit.lepczynski.it/
https://admintoolkit.lepczynski.it/cidr/
https://admintoolkit.lepczynski.it/chmod/
https://admintoolkit.lepczynski.it/cron/
https://admintoolkit.lepczynski.it/timestamp/
https://admintoolkit.lepczynski.it/robots.txt
https://admintoolkit.lepczynski.it/sitemap.xml
```

Domena jest już przypisana do Workera, więc nie trzeba ponownie tworzyć rekordów DNS, o ile wdrażasz do tego samego Workera `admin-toolkit`.

## 9. Aktualizacja cache offline

Lista plików dostępnych offline znajduje się w:

```text
public/sw.js
```

Po dodaniu lub usunięciu narzędzia zaktualizuj tablicę `PRECACHE_URLS`. Przy większej zmianie zwiększ numer w nazwie cache, na przykład z `admin-toolkit-v2` na `admin-toolkit-v3`.
