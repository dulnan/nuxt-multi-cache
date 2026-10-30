# Runtime конфигурация

Некоторые параметры модуля также могут быть изменены во время выполнения с помощью [runtime config](https://nuxt.com/docs/guide/going-further/runtime-config).

::: info

Обратите внимание, что через runtime config можно включить только те функции, которые **также включены в конфигурации модуля**. Например, вы можете _в целом_ включить route cache в параметрах модуля, а затем отключить его во время выполнения, но вы не можете иметь route cache отключенным в конфигурации модуля, а затем включить его с помощью runtime config.

:::

## Включение отладки

```dotenv
NUXT_MULTI_CACHE_DEBUG=true
```

Если `true`, модуль будет выводить отладочные сообщения в консоль.

## Переключение CDN заголовков

```dotenv
NUXT_MULTI_CACHE_CDN=true
```

`true` или `false` для включения или отключения CDN заголовков.

## Переключение кеширования компонентов

```dotenv
NUXT_MULTI_CACHE_COMPONENT=true
```

Установите `true` для включения кеширования компонентов или `false` для отключения.

## Переключение Data Cache

```dotenv
NUXT_MULTI_CACHE_DATA=true
```

Установите `true` для включения data cache или `false` для отключения.

## Переключение кеширования маршрутов

```dotenv
NUXT_MULTI_CACHE_ROUTE=true
```

Установите `true` для включения кеширования маршрутов или `false` для отключения.

## Переключение API

```dotenv
NUXT_MULTI_CACHE_API_ENABLED=true
```

Установите `true` для включения API endpoints очистки/статистики, `false` для отключения.

## Токен авторизации API

```dotenv
NUXT_MULTI_CACHE_API_AUTHORIZATION_TOKEN=PtSR0mDATQpNlvNgqRf
```

Токен для предоставления доступа к API очистки/статистики.

## Отключение авторизации API

```dotenv
NUXT_MULTI_CACHE_API_AUTHORIZATION_DISABLED=true
```

Установите `true` для отключения проверок авторизации для API очистки/статистики.
