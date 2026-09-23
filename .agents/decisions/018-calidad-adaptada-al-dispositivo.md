---
name: 018-calidad-adaptada-al-dispositivo
status: accepted
date: 2026-09-23
domain: portfolio
---

# ADR-018: Calidad de dibujo adaptada al dispositivo con un interruptor maestro

## Contexto

Medido en un iPhone 6s (iOS 15.8, 4 nucleos, dpr 2): **26,9 fps con picos de 109 ms** y 943 frames lentos. La pagina funciona (Vue monta en 2,6 s), simplemente no llega. El diseno apila dos shaders WebGL de pantalla completa, cinco capas de `backdrop-filter` fijas sobre un canvas que cambia en cada frame, y efectos de glitch por todas partes. En escritorio con GPU dedicada eso se sostiene; en un telefono de 2015, no.

Ademas, una de las dos capas de shader (`TvStaticBackground`, en `-z-30`) queda **tapada** por la otra (`FaultyTerminalBackground`, en `-z-20`), porque los dos canvas son opacos: estaba dibujando un shader de pantalla completa sin que se viera, y su prop `pause` no lo detiene.

## Decision

1. **La calidad es un estado reactivo con un solo interruptor maestro** (`lite`) del que se derivan las demas capas (montar o no el ruido de TV, `dpr` del terminal, limite de fps, pila de `backdrop-filter`). Una sola decision, un solo sitio que la cambia.
2. **Deteccion honesta:** puntero grueso (tactil) o hardware modesto segun lo que declara el navegador (`hardwareConcurrency <= 4` **y** `deviceMemory <= 4`; se exigen los dos para no rebajar un portatil de 4 nucleos con GPU real). Nada de listas de modelos.
3. **Se puede forzar y se recuerda:** `?q=lite` / `?q=full` para una prueba puntual, `localStorage` para que la eleccion sobreviva a la recarga, y un evento (`vc-quality`) para que el panel de diagnostico, que vive fuera del bundle, pueda cambiarla en vivo.
4. **La capa invisible no se dibuja:** el fondo de TV pasa a dibujar solo cuando se ve (flash de hover/navegacion o el truco), con la capa montada y el programa compilado para que el flash no tenga coste de arranque.
5. **El recorte en modo ligero no quita ninguna capa visible:** donde el diseno usa `backdrop-filter` se usa el degradado al color del tema, que da el mismo efecto de "el contenido se va" sin leer el fondo.

## Consecuencias

- El portafolio deja de depender de que el visitante tenga una GPU de escritorio, y el diseno se mantiene intacto en los equipos que si la tienen.
- El modo ligero ahorra ademas bateria (dpr 1 es un cuarto de pixeles y el limite de 30 fps es la mitad de trabajo), que en un telefono es parte del problema.
- Hay **dos caminos visuales** que mantener: cualquier capa nueva que cueste pintar tiene que decir que hace en modo ligero.
- La deteccion puede equivocarse en los dos sentidos (un equipo modesto que aguanta, o uno potente con puntero tactil). Por eso existe el forzado por URL y por panel: la decision final no es del codigo.
- El estado se guarda en el visitante: quien entre una vez con `?q=full` o pulse "modo ligero" en el panel se quedara asi hasta que lo cambie.

## Alternativas Consideradas

- **Corregir solo el canvas tapado y el blur, sin modo adaptado:** mejora el suelo pero no el techo; un telefono de 2015 seguiria sin llegar a 60 fps con el shader del terminal a dpr 2.
- **Detectar por modelo de telefono o por user agent:** fragil y mentiroso (los UA se falsean y los modelos cambian). Se prefiere preguntar al navegador por capacidades.
- **Reducir la calidad siempre, para todos:** castiga al 95 % de las visitas en escritorio por el 5 % movil. Descartada.
- **Una version "ligera" del sitio en otra ruta:** duplica el mantenimiento de dos disenos y el visitante acaba en el que no queria. Descartada.
- **Preguntar al visitante si quiere modo ligero:** una decision tecnica puesta en manos de quien no tiene datos; el propio panel de diagnostico ya sirve para forzarlo si hace falta.

## Estado

`accepted`
