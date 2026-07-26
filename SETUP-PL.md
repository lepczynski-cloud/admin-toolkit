# Admin Toolkit — uruchomienie na GitHubie i Cloudflare Pages

Ten projekt jest statyczną witryną napisaną w HTML, CSS i JavaScript. Nie wymaga serwera aplikacyjnego, bazy danych ani procesu budowania.

Docelowy adres:

```text
https://admintoolkit.lepczynski.it
```

## 1. Utworzenie repozytorium GitHub

Utwórz publiczne repozytorium o nazwie:

```text
admin-toolkit
```

Zalecany opis:

```text
Free, privacy-friendly browser tools for CIDR, chmod, cron expressions and Unix timestamps — built with vanilla HTML, CSS and JavaScript.
```

Podczas tworzenia repozytorium pozostaw wyłączone opcje dodania README, `.gitignore` i licencji, ponieważ wszystkie te pliki są już w tym projekcie.

Po utworzeniu repozytorium wybierz **Add file → Upload files** i prześlij całą zawartość tego katalogu. Plik `index.html` musi znaleźć się w głównym katalogu repozytorium, a nie wewnątrz dodatkowego folderu.

## 2. Konfiguracja linków

Publiczne adresy są zapisane w pliku:

```text
assets/js/config.js
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

Gdy artykuł i film będą gotowe, wpisz ich pełne adresy w `projectArticleUrl` i `projectVideoUrl`. Przyciski są ukryte, dopóki pola pozostają puste.

## 3. Wdrożenie w Cloudflare Pages

W Cloudflare otwórz **Workers & Pages**, utwórz projekt Pages i połącz go z repozytorium GitHub `admin-toolkit`.

Ustawienia wdrożenia:

```text
Production branch: main
Framework preset: None
Build command: exit 0
Build output directory: .
Root directory: pozostaw puste
Environment variables: brak
```

Po pierwszym wdrożeniu przetestuj otrzymany adres w domenie `pages.dev`.

## 4. Podłączenie subdomeny

W projekcie Cloudflare Pages wybierz **Custom domains → Set up a domain** i wpisz:

```text
admintoolkit.lepczynski.it
```

Jeżeli `lepczynski.it` korzysta z serwerów nazw Cloudflare, rekord CNAME zostanie utworzony automatycznie w strefie Cloudflare.

Jeżeli autorytatywny DNS nadal działa w OVHcloud, po rozpoczęciu konfiguracji domeny w Pages dodaj w strefie DNS OVHcloud:

```text
Type: CNAME
Subdomain: admintoolkit
Target: <nazwa-projektu>.pages.dev.
TTL: Default
```

Nie twórz rekordów A ani AAAA dla tej samej nazwy. Nie dodawaj tego samego rekordu jednocześnie w OVHcloud i Cloudflare — rekord umieszcza się wyłącznie u aktualnego autorytatywnego dostawcy DNS.

## 5. Aktualizowanie witryny

Każdy commit wysłany do gałęzi `main` uruchomi automatyczne wdrożenie Cloudflare Pages.

Najprostsza późniejsza zmiana linku do filmu:

1. Otwórz `assets/js/config.js` na GitHubie.
2. Kliknij ikonę edycji.
3. Uzupełnij `projectVideoUrl`.
4. Zapisz commit bezpośrednio do `main`.
5. Cloudflare opublikuje zmianę automatycznie.

## 6. Lokalne uruchomienie

Ze względu na Service Worker najlepiej testować projekt przez lokalny serwer HTTP, a nie przez podwójne kliknięcie `index.html`.

Przykład z Pythonem:

```bash
python -m http.server 8080
```

Następnie otwórz:

```text
http://localhost:8080
```
