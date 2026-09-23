---
name: 017-diagnostico-rendimiento-en-dispositivo
status: accepted
date: 2026-09-22
domain: portfolio
---

# ADR-017: Diagnostico de rendimiento como script suelto y solo con `?perf=1`

## Contexto

Hay que diagnosticar por que el portafolio es inutilizable en un iPhone 6s (iOS 15.8) mientras en escritorio va bien. Las vias habituales estan cerradas:

- La depuracion remota de Safari exige macOS; el equipo es Windows y no hay Safari para escritorio.
- Emular un A9 con 2 GB de RAM no se puede: el fallo esta en el hardware, no en el codigo.
- Un panel dentro de la aplicacion no sirve para el caso mas importante: si el bundle no llega a montar (por ejemplo por falta de soporte de una capacidad), no habria panel.

Ademas, antes de tocar visuales como los shaders o el blur hay que saber cual de ellos se come el presupuesto; sin esa medida, cualquier optimizacion es una apuesta.

## Decision

El diagnostico vive en `public/diag.js`: **JS nativo fuera del bundle**, que se carga **solo cuando la URL trae `?perf=1`** mediante un script inline minimo en `index.html`. Incluye:

- Captura de `error` y `unhandledrejection` desde el primer instante, antes de la aplicacion.
- Informe de entorno, de capacidades del navegador, y de si Vue llego a montar.
- Medidor de FPS sobre `requestAnimationFrame` con muestreo de 5 s.
- Interruptores A/B por capa: lleva un canvas a 1x1 (el relleno de ese shader deja de costar) e inyecta CSS para desactivar `backdrop-filter`, animaciones, `mix-blend-mode` y sombras.

El panel es de solo diagnostico: **no altera el comportamiento del sitio sin `?perf=1`** y no forma parte del bundle ni del peso de produccion.

## Consecuencias

- Se puede medir en el dispositivo real sin Mac, sin instalar nada y sin publicar una version distinta: es la produccion tal cual con un parametro.
- Funciona aunque la aplicacion no monte, que es justo el caso que hay que distinguir de "va lento".
- El A/B por capa convierte una discusion en un numero: se mide, se cambia una capa y se vuelve a medir.
- Al ser JS nativo queda fuera del lint/tsc del proyecto y **no se actualiza con el codigo de la aplicacion**: hay que mantenerlo a mano.
- Lleva `?perf=1` en produccion: cualquiera puede abrir el panel. No expone credenciales ni datos, solo metricas del propio navegador, pero es superficie publica y hay que tenerlo presente.
- El instrumento puede mentir si esta mal escrito: ya paso en la primera version (`CSS.supports` con una sola cadena, y un canvas por contexto WebGL). Cualquier lectura rara del panel hay que verificarla contra el propio codigo del panel antes de sacar conclusiones.

## Alternativas Consideradas

- **Depuracion remota de Safari:** requiere macOS. Descartada por entorno.
- **Playwright WebKit en Windows:** es WebKit de escritorio y no reproduce el hardware objetivo. Descartada como fuente de verdad (sirve, si acaso, para comparar).
- **Panel dentro de la aplicacion (Vue):** no existe si la aplicacion no monta. Descartada.
- **Instrumentacion temporal que se retira despues:** obliga a un despliegue por cada ronda de medidas y no deja la herramienta al lado del codigo. Descartada: es mas util que quede, con carga condicional.
- **Corregir directamente los sospechosos (shader tapado, pila de `backdrop-filter`, `dpr`) sin medir:** riesgo de optimizar lo que no pesa y de cambiar visuales sin necesidad. Descartada.

## Estado

`accepted`
