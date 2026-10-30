# useComponentCache

Доступен только в **Nuxt**.

Этот composable доступен если [Component Cache](/ru/features/component-cache) включен.

Устанавливает кешируемость компонентов, отрендеренных внутри `<RenderCacheable>`. Кешируемость объединяется с той, что установлена на `<RenderCacheable>`, например, можно установить более низкий max age изнутри компонента или сделать компонент некешируемым.

Composable также может использоваться во вложенных компонентах, пока у них есть `<RenderCacheable>` где-то в родителях.

```typescript
useComponentCache((helper) => {
  helper.setMaxAge(900).addPayloadKeys(['users'])
})
```

## Полный пример

```vue
<script lang="ts" setup>
const { data } = await useAsyncData('users', () => {
  return $fetch('/api/get-users')
})

useComponentCache((helper) => {
  helper.setMaxAge(900).addPayloadKeys(['users']).addTags(data.value.cacheTags)
})
</script>
```

## Методы

### setMaxAge(age: number)

Установить max age для кешированного компонента. Max age устанавливается только если он меньше текущего значения.

### addTags(tags: string|string[])

Добавить один или несколько cache tags.

### setCacheable()

Сделать компонент кешируемым. Обратите внимание, что по умолчанию компонент всегда кешируемый для обратной совместимости, поэтому вызов этого метода практически не имеет эффекта.

### setUncacheable()

Сделать компонент некешируемым. После вызова этого метода его нельзя отменить, и компонент будет некешируемым.

### addPayloadKeys(keys: string|string[])

Добавить один или несколько ключей payload, значения которых должны быть кешированы вместе с разметкой компонента.

Это может быть ключ, определенный в `useAsyncData()`, или любой ключ, который передается как payload во время SSR.

Если используется, компонент `<RenderCacheable>` также будет кешировать значение payload вместе с компонентом. При последующих запросах, при возврате кешированного компонента, кешированный payload также будет добавлен в SSR ответ.
