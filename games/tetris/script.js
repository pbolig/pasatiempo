const gameBoardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const nextPieceBoardElement = document.getElementById('next-piece-board');
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const pauseScreen = document.getElementById('pause-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalScoreElement = document.getElementById('final-score');

const COLS = 10;
const ROWS = 20;
const PIECES = [
    { name: 'I', shape: [[1, 1, 1, 1]], color: 'I' },
    { name: 'O', shape: [[1, 1], [1, 1]], color: 'O' },
    { name: 'T', shape: [[0, 1, 0], [1, 1, 1]], color: 'T' },
    { name: 'L', shape: [[0, 0, 1], [1, 1, 1]], color: 'L' },
    { name: 'J', shape: [[1, 0, 0], [1, 1, 1]], color: 'J' },
    { name: 'S', shape: [[0, 1, 1], [1, 1, 0]], color: 'S' },
    { name: 'Z', shape: [[1, 1, 0], [0, 1, 1]], color: 'Z' }
];
const LEVEL_SPEEDS = [800, 720, 630, 550, 470, 380, 300, 220, 150, 100];
const SCORE_VALUES = { 1: 100, 2: 300, 3: 500, 4: 800 };

let board, score, level, totalLinesCleared, isPaused, isGameOver;
let currentPiece, nextPiece, currentPosition;
let lastTime, dropCounter, animationFrameId;

// ----- NUEVAS VARIABLES PARA CONTROL TÁCTIL -----
let touchStartX = 0;
let touchStartY = 0;
const swipeThreshold = 50; // Mínimo de píxeles para detectar un swipe
const tapThreshold = 20;   // Máximo de píxeles para considerarlo un "tap"
const hardDropThreshold = 150; // Mínimo de píxeles para un hard drop

function draw() {
    if (!board) return;
    gameBoardElement.innerHTML = '';
    
    // Redibujar los overlays para que no se borren
    gameBoardElement.appendChild(startScreen);
    gameBoardElement.appendChild(endScreen);
    gameBoardElement.appendChild(pauseScreen);

    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const block = document.createElement('div');
                block.className = `block ${PIECES[value - 1].color}`;
                block.style.gridRowStart = y + 1;
                block.style.gridColumnStart = x + 1;
                gameBoardElement.appendChild(block);
            }
        });
    });

    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const block = document.createElement('div');
                    block.className = `block ${currentPiece.color}`;
                    block.style.gridRowStart = currentPosition.y + y + 1;
                    block.style.gridColumnStart = currentPosition.x + x + 1;
                    gameBoardElement.appendChild(block);
                }
            });
        });
    }
}

// ----- FUNCIÓN drawNextPiece MODIFICADA -----
// Ya no usa pixeles fijos, usa '1fr' para llenar 
// el contenedor que definimos en el CSS.
function drawNextPiece() {
    nextPieceBoardElement.innerHTML = '';
    if (nextPiece) {
        const { shape, color } = nextPiece;
        const rows = shape.length;
        const cols = shape[0].length;

        // Configurar la grilla del 'next-piece-board' dinámicamente
        nextPieceBoardElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        nextPieceBoardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const block = document.createElement('div');
                    block.className = `block ${color}`;
                    block.style.gridRowStart = y + 1;
                    block.style.gridColumnStart = x + 1;
                    nextPieceBoardElement.appendChild(block);
                }
            });
        });
    }
}


function startGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    level = 1;
    totalLinesCleared = 0;
    isPaused = false;
    isGameOver = false;
    scoreElement.textContent = '0';
    nextPiece = getRandomPiece();
    generateNewPiece();
    lastTime = 0;
    dropCounter = 0;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    update();
}

function endGame() {
    isGameOver = true;
    cancelAnimationFrame(animationFrameId);
    finalScoreElement.textContent = score;
    endScreen.classList.remove('hidden');
}

function generateNewPiece() {
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();
    currentPosition = { x: Math.floor(COLS / 2) - 1, y: 0 };
    if (isCollision()) {
        endGame();
    }
    drawNextPiece();
}

function getRandomPiece() {
    const index = Math.floor(Math.random() * PIECES.length);
    return JSON.parse(JSON.stringify(PIECES[index]));
}

function movePiece(dx, dy) {
    if (isGameOver || isPaused) return false;
    currentPosition.x += dx;
    currentPosition.y += dy;
    if (isCollision()) {
        currentPosition.x -= dx;
        currentPosition.y -= dy;
        if (dy > 0) lockPiece();
        return false;
    }
    return true;
}

function hardDrop() {
    if (isGameOver || isPaused) return;
    while (movePiece(0, 1)) {}
}

function rotatePiece() {
    if (isGameOver || isPaused) return;
    const originalShape = currentPiece.shape;
    const newShape = originalShape[0].map((_, colIndex) => originalShape.map(row => row[colIndex]).reverse());
    currentPiece.shape = newShape;
    let offset = 1;
    while (isCollision()) {
        currentPosition.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > currentPiece.shape[0].length) {
            currentPosition.x -= (offset - (offset > 0 ? 1 : -1));
            currentPiece.shape = originalShape;
            return;
        }
    }
}

function isCollision() {
    const { shape } = currentPiece;
    const { x, y } = currentPosition;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] > 0) {
                const newX = x + c, newY = y + r;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (board[newY] && board[newY][newX] > 0)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function lockPiece() {
    const { shape, name } = currentPiece;
    const { x, y } = currentPosition;
    const pieceIndex = PIECES.findIndex(p => p.name === name);
    shape.forEach((row, r) => {
        row.forEach((value, c) => {
            if (value > 0) {
                if (y + r < 0) return; // Evita error si se bloquea por encima
                board[y + r][x + c] = pieceIndex + 1;
            }
        });
    });
    clearLines();
    generateNewPiece();
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(value => value > 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) updateScore(linesCleared);
}

function updateScore(linesCleared) {
    score += SCORE_VALUES[linesCleared] * level;
    totalLinesCleared += linesCleared;
    level = Math.floor(totalLinesCleared / 10) + 1;
    scoreElement.textContent = score;
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        cancelAnimationFrame(animationFrameId);
        pauseScreen.classList.remove('hidden');
    } else {
        pauseScreen.classList.add('hidden');
        lastTime = performance.now();
        update();
    }
}

function update(time = 0) {
    if (isPaused || isGameOver) return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    const dropInterval = LEVEL_SPEEDS[level - 1] || LEVEL_SPEEDS[LEVEL_SPEEDS.length - 1];
    if (dropCounter > dropInterval) {
        movePiece(0, 1);
        dropCounter = 0;
    }
    draw();
    animationFrameId = requestAnimationFrame(update);
}

// ----- MANEJO DE CONTROLES DE TECLADO (Sin cambios) -----
document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'p') {
        togglePause();
        return;
    }
    if (isPaused || isGameOver) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
    }
    switch (event.key) {
        case 'ArrowLeft': movePiece(-1, 0); break;
        case 'ArrowRight': movePiece(1, 0); break;
        case 'ArrowDown': movePiece(0, 1); dropCounter = 0; break;
        case 'ArrowUp': rotatePiece(); break;
        case ' ': hardDrop(); break;
    }
    draw();
});

// ----- MANEJO DE BOTONES (Conexión de controles táctiles) -----
startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    // Conectar eventos táctiles AL INICIAR
    gameBoardElement.addEventListener('touchstart', handleTouchStart);
    gameBoardElement.addEventListener('touchmove', handleTouchMove);
    gameBoardElement.addEventListener('touchend', handleTouchEnd);
    startGame();
});

restartButton.addEventListener('click', () => {
    endScreen.classList.add('hidden');
    // Conectar eventos táctiles (por si es la primera partida en móvil)
    gameBoardElement.addEventListener('touchstart', handleTouchStart);
    gameBoardElement.addEventListener('touchmove', handleTouchMove);
    gameBoardElement.addEventListener('touchend', handleTouchEnd);
    startGame();
});

// Sobrescribir endGame para desconectar eventos
const originalEndGame = endGame;
endGame = function() {
    originalEndGame();
    // Desconectar eventos táctiles AL TERMINAR
    gameBoardElement.removeEventListener('touchstart', handleTouchStart);
    gameBoardElement.removeEventListener('touchmove', handleTouchMove);
    gameBoardElement.removeEventListener('touchend', handleTouchEnd);
}

board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
draw();


// ----------------------------------
// ----- NUEVAS FUNCIONES TÁCTILES -----
// ----------------------------------

function handleTouchStart(e) {
    // Evita que la página se mueva
    e.preventDefault(); 
    if (isPaused || isGameOver) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    e.preventDefault();
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (isPaused || isGameOver) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX < tapThreshold && absDeltaY < tapThreshold) {
        // Es un TAP (Tocar)
        rotatePiece();
    } else if (absDeltaX > absDeltaY) {
        // Es un SWIPE HORIZONTAL (Deslizar a los lados)
        if (deltaX > swipeThreshold) {
            movePiece(1, 0); // Derecha
        } else if (deltaX < -swipeThreshold) {
            movePiece(-1, 0); // Izquierda
        }
    } else {
        // Es un SWIPE VERTICAL (Deslizar hacia abajo)
        if (deltaY > hardDropThreshold) {
            hardDrop(); // Swipe rápido (Hard Drop)
        } else if (deltaY > swipeThreshold) {
            movePiece(0, 1); // Swipe lento (Bajar)
            dropCounter = 0;
        }
    }
    
    // Redibujar después de la acción
    draw();
}