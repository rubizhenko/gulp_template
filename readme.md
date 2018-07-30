# Base Gulp template

---------------------------------

Навигация

- [Создание нового проекта](#Создание-нового-проекта)
- [Структура проекта](#Структура-проекта)
  - [HTML](#html)
  - [SASS](#sass)
  - [JavaScript](#javascript)
  - [Спрайты](#Спрайты)
  - [Иконочные шрифты](#Иконочные-шрифты)
  - [SVG](#svg)
  - [SVG спрайты](#svg-спрайты)
- [Build проекта](#build-проекта)
- [Production проекта](#production-проекта)


## Создание нового проекта

Для создания нового проекта, необходимо выкачать `.zip` архив репозитория. После разархивирования  запустить в терминале следующие команды:

```
npm install && gulp
```

После этого можно приступать к работе.

## Структура проекта

Проект имеет следующую структуру:

```
my-app/
  readme.md
  node_modules/
  package.json
  gulpfile.js
  src/
    index.html
    template/
    svgico/
    svg/
    style/
    spriteSVG/
    sprite/
    preview/
    libs/
    js/
    img/
    fonts/
  build/
  www/

```

### HTML

Главный `index.html` файл находится в папке `src/`. Он предназначен для включения html-темплейтов с папки `template/`:

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <link rel="stylesheet" href="css/main.css">
  <title>Terraleads</title>
</head>

<body>
  <!--=include template/header.html -->

  <!--=include template/footer.html -->

  <!--=require img/svg/symbols.svg -->
  <script src="js/main.js"></script>
</body>

</html>
```

### SASS

Главный `main.sass` файл находится в папке `src/style/`. Он предназначен для включения sass/scss/css-модулей через `import`

Пример:

```sass
@import "libs/_media"
@import "../libs/bootstrap-grid.css"
@import "partials/custom"
```


### JavaScript

Главный `main.js` файл находится в папке `src/js/`. Он предназначен для включения js-модулей

Пример:
```js
//=require partials/app-lib.js

//=include partials/app.js
```

**require подключит файл только 1 раз. include можно использовать для подключения файл несколько раз.**

### Спрайты
Для создания спрайта необходимо `.png` или `.jpg` картинки поместить в папку `sprite` после чего будет создан спрайт `sprite.png`

Пример использования в HTML:

```html
  <i class="sprite sprite-new"></i>
```

Так же в sass нужно прописать:

```sass
  +sprite($new)
```

`new` - название картинки в папке `sprite`

Если нужно несколько спрайт-файлов, картинки необходимо помещать в подпапки. Например `sprite/icons`. После этого будет создан дополнительный спрайт `icons.png`. Также нужно будет подключить `icons.sass` в файле `main.sass`

```sass
  @import "libs/sprite"
  @import "libs/icons"
```



### Иконочные шрифты

Для создания иконочного шрифта SVG картинки нужно помещать в папку `svgico/` после чего будет создан шрифт `fico.*`.

Пример использования в HTML:

```html
  <i class="fico fico-facebook"></i>
```


### SVG

SVG картинки нужно помещать в папку `svg/`, после чего они будут минифицированы и перемещены в build версию

### SVG спрайты

Для создания svg спрайта необходимо `.svg` поместить в папку `spriteSVG` после чего preview спрайта можно найти в папке `src/preview`

Пример использования в HTML:

```html
  <svg class="icon store"><use xlink:href="#store"></use></svg>
```

## Build проекта

Development версия проекта создается в папке `build/` после запуска команды `gulp` в терминале

## Production проекта

Production версия проекта создается в папке `www/` после запуска команды `gulp deploy` и содержит в себе готовую до размещения на сервере версию проекта.
