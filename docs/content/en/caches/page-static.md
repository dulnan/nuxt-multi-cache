---
title: Page (static HTML)
position: 103
category: 'Caches'
---

<p className="lead">
The static mode provides an even more robust page cache: The markup of every
cacheable page is written to disk as an HTML file, which can then be served
directly by a web server like Apache or nginx.
</p>

That way the page can still be served even if the Nuxt app is not running, for
example during a deployment.

<alert>
Be aware that this might create a significant amount of disk writes, depending
on how many unique pages your app has.
</alert>

## How it works

The path of the page is mapped to a matching path on disk. Given the following
pages that are cached:

- `/en/shop/category/lorem-ipsum-dolor`
- `/en/shop/another-category/sit-amet`
- `/en/shop/another-category/constetur`
- `/en/user/1234`

The following directory and file structure is created:

```
- en
  - shop
    - category
      - lorem-ipsum-dolor.html
    - another-category
      - sit-amet.html
  - user
    - 1234.html
```

## Webserver configuration

You need to configure your webserver so that it first tries to serve the
request from disk. If that fails, you pass the request to Nuxt, which will
render the page and write it to disk. The next request will be then served from
disk.

### Apache

Here's a sample configuration for Apache as a starting point.

```apache
SetEnvIf X-Forwarded-Proto https HTTPS=on
ServerName example.com

<VirtualHost *:80>
  DocumentRoot "/app/frontend/cache/pages"
  ServerName www.example.com

  <Location />
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    DirectoryIndex index.html
  </Location>

  RewriteEngine on

  # [L] = Last rewrite rule.
  # [NC] = case insensitive.
  # [R] = Redirect.
  # [P] = Proxy Pass.

  # Redirect 301 /foobar.html to /foobar.
  RewriteCond %{DOCUMENT_ROOT}/$1 !-f
  RewriteRule ^(.+)\.html$ $1 [L,NC,R=301]

  # Serve cached files (appends .html to look for file)
  RewriteCond %{DOCUMENT_ROOT}/$1\.html -f
  RewriteRule ^(.*)$ $1.html [L]

  # Else: Proxy Pass request to Nuxt.
  RewriteRule ^/(.*)$ http://localhost:3000/$1 [P]

  ErrorDocument 503 /503.html
</VirtualHost>
```

## Caveats

### Query parameters

Keep in mind that this only works for pages that don't use any query parameter.
E.g. if you have a search page at /search that also takes a `?term=foobar`
query parameter, then only the first request (with or without query parameter)
is cached and will then be served for any other variation of the query parameters.

You probably also don't want to cache any query variation to disk, as this
could lead to a DDoS attack, where someone could create a huge amount of pages.

### Non 200 HTTP codes
It's not advised to cache a page that has a status code other than 200, because
again, that would make it possible to create tons of 404 pages.
