# Ajedrez de Sami con IA en JavaScript

¡Bienvenido/a al proyecto de Ajedrez de Sami! Este es un juego de ajedrez completamente funcional desarrollado desde cero utilizando únicamente HTML, CSS y JavaScript (Vanilla JS), sin necesidad de frameworks o librerías externas. El juego cuenta con una Inteligencia Artificial (IA) integrada con niveles de dificultad ajustables.

---

## ✨ Características Principales

* **Lógica de Ajedrez Completa:** Implementación de todas las reglas del ajedrez estándar.
* **Jugador vs. Inteligencia Artificial (IA):** Enfréntate a un oponente controlado por la computadora.
* **IA con Dificultad Ajustable:** Elige entre los modos 'Novato', 'Normal' y 'Experto' para adaptar el desafío.
* **Interfaz Clara y Funcional:**
    * Resaltado de movimientos legales al seleccionar una pieza.
    * Visualización de piezas capturadas por cada jugador.
    * Registro de movimientos detallado y descriptivo, fácil de entender.
* **Implementación de Movimientos Especiales:**
    * **Enroque:** Corto (O-O) y largo (O-O-O).
    * **Captura al Paso (En Passant):** Correctamente implementado según las reglas.
    * **Promoción de Peón:** Con diálogo de selección para el jugador humano y promoción automática a Dama para la IA.
* **Botones de Control:** Opción para reiniciar la partida y deshacer el último movimiento.

---

## 💻 Tecnologías Utilizadas

* **HTML5:** Para la estructura semántica del tablero y los controles.
* **CSS3:** Para todo el diseño visual, incluyendo el layout con Flexbox y Grid, y las animaciones.
* **JavaScript (ES6+):** Para toda la lógica del juego, manipulación del DOM, reglas y la inteligencia artificial.

---

## 🚀 Instalación y Uso Local
https://github.com/pbolig/ajedrez
Este proyecto no requiere un proceso de compilación ni dependencias. Para ejecutarlo en tu máquina local, sigue estos simples pasos:

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/pbolig/ajedrez.git](https://github.com/pbolig/ajedrez.git)
    ```
2.  **Navega a la carpeta del proyecto:**
    ```bash
    cd tu-repositorio
    ```
3.  **Abre el archivo `index.html`:**
    Haz doble clic en el archivo `index.html` para abrirlo directamente en tu navegador web preferido (como Chrome, Firefox, etc.).

    *Para una mejor experiencia, se recomienda usar una extensión como **Live Server** en Visual Studio Code, que crea un pequeño servidor local y evita posibles problemas con las rutas de los archivos.*

---

## 📁 Estructura del Proyecto

El código está organizado en los siguientes archivos:

* `index.html`: Contiene la estructura principal de la página, el tablero, los botones y los diálogos.
* `style.css`: Define todos los estilos, desde los colores del tablero hasta la maquetación del panel lateral y la responsividad.
* `script.js`: Es el cerebro de la aplicación. Contiene toda la lógica del juego, que incluye:
    * Estado del tablero y variables globales.
    * Funciones de renderizado y manipulación del DOM.
    * Lógica para calcular y validar todos los movimientos de las piezas.
    * Implementación de las reglas especiales.
    * El algoritmo Minimax con poda Alfa-Beta para la IA.
    * Manejo de todos los eventos del usuario.
* `/images`: Carpeta que contiene los archivos SVG para cada una de las piezas del ajedrez.

---

## 룰 Reglas de Ajedrez Implementadas

Este proyecto respeta las reglas fundamentales de la FIDE. A continuación se detallan las implementaciones de las reglas especiales:

### Enroque (Castling)
Un jugador puede realizar el enroque si se cumplen las siguientes condiciones:
1.  Ni el rey ni la torre implicada se han movido previamente.
2.  No hay piezas entre el rey y la torre.
3.  El rey no está en jaque.
4.  El rey no pasa por ni aterriza en una casilla que esté siendo atacada por una pieza enemiga.

### Captura al Paso (En Passant)
Se puede realizar una captura al paso si el peón de un oponente avanza dos casillas desde su posición inicial y aterriza junto a tu peón. La captura debe realizarse en el turno inmediatamente posterior a ese avance.

### Promoción de Peón
Cuando un peón alcanza la última fila del tablero (fila 8 para las blancas, fila 1 para las negras), debe ser promocionado a otra pieza.
* **Jugador Humano:** Aparecerá un cuadro de diálogo para elegir entre Dama, Torre, Alfil o Caballo.
* **Inteligencia Artificial:** Para mantener la fluidez del juego, la IA promocionará automáticamente su peón a una **Dama**, ya que es la jugada óptima en la gran mayoría de los casos.

---

## 🤖 Lógica de la Inteligencia Artificial

La IA se basa en el algoritmo **Minimax**, optimizado con una técnica llamada **poda Alfa-Beta**.

1.  **Minimax:** El algoritmo explora un árbol de posibles movimientos futuros, asumiendo que cada jugador siempre elegirá el movimiento que sea mejor para él.
2.  **Función de Evaluación:** Para decidir qué movimiento es "mejor", la IA evalúa la posición del tablero basándose en:
    * **Material:** El valor de las piezas en el tablero (Dama=9, Torre=5, etc.).
    * **Posición:** Se utilizan "Tablas de Valor de Posición de Piezas" (Piece-Square Tables) que le dan a cada pieza un valor adicional dependiendo de en qué casilla se encuentre. Por ejemplo, un caballo en el centro es más valioso que uno en una esquina.
3.  **Poda Alfa-Beta:** Es una optimización que permite al algoritmo descartar ramas enteras del árbol de búsqueda que sabe que no conducirán a un mejor resultado, permitiendo a la IA "pensar" más rápido y a mayor profundidad.
4.  **Nivel de Dificultad:** La dificultad se controla ajustando la **profundidad** de búsqueda del algoritmo Minimax. A mayor profundidad, más jugadas futuras analizará la IA, y más fuertes serán sus decisiones.

---

## 🔮 Futuras Mejoras

Este proyecto tiene un gran potencial para seguir creciendo. Algunas ideas para futuras versiones son:

* **Modo Multijugador Online:** Implementar un backend (con Node.js y WebSockets) para permitir que dos personas jueguen entre sí a través de internet.
* **Mejoras en la IA:** Añadir un libro de aperturas y una lógica de finales para un juego más sofisticado.
* **Jugar como Negras:** Permitir al jugador elegir con qué color jugar.
* **Temas Personalizables:** Opción para cambiar los colores del tablero y el estilo de las piezas.

---

Desarrollado con ❤️ por Sami.