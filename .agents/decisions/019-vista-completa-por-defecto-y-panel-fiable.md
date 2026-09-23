---
name: 019-vista-completa-por-defecto-y-panel-fiable
status: accepted
date: 2026-09-23
domain: portfolio
---

# ADR-019: Vista completa por defecto en todos los dispositivos y panel de diagnóstico con DOM estático

## Contexto

Tras el ADR-018 (calidad adaptada con detección automática), la medida limpia en el iPhone 6s (batería cargada, sin ahorro de energía) dio **56 fps estables en modo ligero**. El usuario decide perseguir los **60 fps conservando la vista completa**: "tiene el hardware para hacerlo". Además, el panel de diagnóstico resultó tener un fallo propio: **sus botones no hacían nada en iOS**.

**Causa del fallo de los botones (confirmada):** el panel repintaba su DOM con `innerHTML` cada 400 ms. En iOS, el `tap` llega a menudo cuando el nodo acaba de ser sustituido y el evento de click no llega a ningún elemento vivo. El panel de diagnóstico mentía sobre la aplicación porque él mismo estaba roto.

**Causa estructural del escalado:** `createRenderer({ dpr })` de khatarsis captura el `dpr` al crear el canvas y su `setSize` lo multiplica internamente: no existe cambio en vivo. El "dpr 1" del modo ligero ni siquiera se aplicaba sin recargar.

## Decision

1. **La vista completa es el defecto en todos los dispositivos.** La detección automática de modo ligero (puntero grueso, hardware modesto) se elimina. El modo ligero queda como **elección manual** (`?q=lite`, botones del panel, persistida en `localStorage`) para medir o ahorrar batería. `prefers-reduced-motion` no pasa por el estado de calidad: cada componente ya congela sus animaciones con esa consulta, que es lo único automático que queda.
2. **Panel de diagnóstico con DOM estático.** `public/diag.js` construye su DOM **una sola vez**; los refrescos periódicos solo tocan `textContent` de los valores vivos. Los botones nacen y mueren con el panel, nunca con un `setInterval`.
3. **La escala fina del terminal va por `drawScale`**, no por `dpr`: el canvas recibe un backing store menor (`offsetWidth × drawScale`) y el CSS lo estira. Aplicado en `resize()` + `watch` del prop, es **cambiable en caliente** sin recrear el contexto WebGL. El `dpr` de creación pasa a ser `min(devicePixelRatio, 2)` del dispositivo (antes se pasaba 2 fijo: en pantallas dpr 1 se dibujaba a 2× de gratis).
4. **Botones A/B nuevos en el panel** para perseguir los 60 fps con vista completa: escala del terminal en caliente (1 / 0.75 / 0.5 / 0.25) y límite de fps (libre / 30).

## Consecuencias

- La aplicación nunca rebaja calidad por su cuenta: cualquier recorte es decisión visible del visitante.
- El panel es fiable en iOS y sirvió de instrumento para la causa: un panel que se repinta con `innerHTML` no puede tener botones en iOS.
- El terminal puede cambiar de resolución de dibujo en vivo, lo que permite A/B real en el dispositivo sin recargar.
- Queda pendiente decidir el soporte de color de iOS 15 (`oklch()` / `@property`, Tailwind v4): fidelidad, no rendimiento.
- Si algún día khatarsis expone `dpr` vivo, `drawScale` puede migrar a ello; mientras, la escala por backing store es equivalente para shaders de pantalla completa.

## Alternativas Consideradas

- **Mantener la detección automática y solo mejorar el panel:** contradice la decisión del usuario de perseguir 60 fps con vista completa en móvil.
- **Cambiar `dpr` en vivo recreando el renderer:** cuesta recompilar el programa y un salto a negro; innecesario cuando el backing store ya da el mismo efecto.
- **Repintar el panel con innerHTML solo cuando cambia algo (diff):** más código y mismo riesgo residual; el DOM estático con `textContent` es simpler y demostradamente suficiente.

## Estado

`accepted`
