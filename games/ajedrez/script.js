// script.js

// -----------------------------------------------------------------------------------------------------------------
// 1. Obtención de Elementos del DOM (Se obtienen al inicio, antes de cualquier manipulación del DOM)
// -----------------------------------------------------------------------------------------------------------------
const chessboardElement = document.getElementById('chessboard');
const statusMessageElement = document.getElementById('status-message');
const resetButton = document.getElementById('reset-button');
const promotionDialog = document.getElementById('promotion-dialog');
const promotionOptionsDiv = document.getElementById('promotion-options');
const gameContainer = document.getElementById('game-container');
const undoButton = document.getElementById('undo-button');
const difficultyLevelSelect = document.getElementById('difficulty-level');

// Elementos del DOM creados en JS (no existen en HTML inicialmente)
const blackCapturedPiecesElement = document.createElement('div');
blackCapturedPiecesElement.id = 'black-captured';
blackCapturedPiecesElement.classList.add('captured-pieces-list');

const whiteCapturedPiecesElement = document.createElement('div');
whiteCapturedPiecesElement.id = 'white-captured';
whiteCapturedPiecesElement.classList.add('captured-pieces-list');

const movesListContainer = document.createElement('div');
movesListContainer.id = 'moves-list-container';
movesListContainer.innerHTML = '<h3>Registro de Movimientos</h3><ul id="moves-list"></ul>';
const movesListElement = movesListContainer.querySelector('#moves-list');


// -----------------------------------------------------------------------------------------------------------------
// 2. Variables de Estado Globales del Juego
// -----------------------------------------------------------------------------------------------------------------
let board = [];
let selectedSquare = null;
let currentPlayer = 'white';
let capturedPieces = { 'white': [], 'black': [] };
let promotingPawnIndex = -1;
let enPassantTargetSquare = -1;
let currentMoveNumber = 1;
let pendingPromotionMoveDetails = null;
let gameEnded = false;
let history = []; // Historial para UNDO
let gameMode = 'vsAI';

// Variables para el Enroque (rastrean si rey o torres se han movido de su posición inicial)
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookH1Moved = false;
let whiteRookA1Moved = false;
let blackRookH8Moved = false;
let blackRookA8Moved = false;


// -----------------------------------------------------------------------------------------------------------------
// 3. Definición de Constantes (Valores de Piezas, FEN inicial, IA, etc.)
// -----------------------------------------------------------------------------------------------------------------
const PIECES_MAP = {
    'p': 'images/bp.svg', 'r': 'images/br.svg', 'n': 'images/bn.svg', 'b': 'images/bb.svg', 'q': 'images/bq.svg', 'k': 'images/bk.svg',
    'P': 'images/wp.svg', 'R': 'images/wr.svg', 'N': 'images/wn.svg', 'B': 'images/wb.svg', 'Q': 'images/wq.svg', 'K': 'images/wk.svg'
};
const PIECE_VALUES = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 0 };

// Tablas de Valor de Posición de Piezas (Piece-Square Tables)
const PAWN_TABLE = [
    [0, 0, 0, 0, 0, 0, 0, 0], [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10], [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0], [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5], [0, 0, 0, 0, 0, 0, 0, 0]
];
const KNIGHT_TABLE = [
    [-50, -40, -30, -30, -30, -30, -40, -50], [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30], [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30], [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40], [-50, -40, -30, -30, -30, -30, -40, -50]
];
const BISHOP_TABLE = [
    [-20, -10, -10, -10, -10, -10, -10, -20], [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10], [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10], [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10], [-20, -10, -10, -10, -10, -10, -10, -20]
];
const ROOK_TABLE = [
    [0, 0, 0, 0, 0, 0, 0, 0], [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5], [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5], [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5], [0, 0, 0, 5, 5, 0, 0, 0]
];
const QUEEN_TABLE = [
    [-20, -10, -10, -5, -5, -10, -10, -20], [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10], [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5], [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10], [-20, -10, -10, -5, -5, -10, -10, -20]
];
const KING_MIDDLE_GAME_TABLE = [
    [-30, -40, -40, -50, -50, -40, -40, -30], [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30], [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20], [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20], [20, 30, 10, 0, 0, 10, 30, 20]
];
const KING_END_GAME_TABLE = [
    [-50, -40, -30, -20, -20, -30, -40, -50], [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30], [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30], [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30], [-50, -30, -30, -30, -30, -30, -30, -50]
];

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
let AI_DEPTH = 3;

const COLS_ALGEBRAIC = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ROWS_ALGEBRAIC = ['8', '7', '6', '5', '4', '3', '2', '1'];


// -----------------------------------------------------------------------------------------------------------------
// 4. Funciones de Utilidad Básicas (Para coordenadas, color de piezas, etc.)
// Estas funciones deben estar al principio porque son usadas por casi todas las demás.
// -----------------------------------------------------------------------------------------------------------------
function indexToCoords(index) { return { row: Math.floor(index / 8), col: index % 8 }; }
function coordsToIndex(row, col) { return (row < 0 || row >= 8 || col < 0 || col >= 8) ? -1 : row * 8 + col; }
function getPieceColor(pieceChar) { return (!pieceChar) ? null : (pieceChar === pieceChar.toUpperCase()) ? 'white' : 'black'; }

function findKingIndex(currentBoard, kingColor) {
    const kingChar = (kingColor === 'white') ? 'K' : 'k';
    for (let i = 0; i < 64; i++) {
        if (currentBoard[i] === kingChar) { return i; }
    }
    return -1;
}

function getPieceSquareValue(pieceChar, row, col) {
    const pieceType = pieceChar.toLowerCase();
    const pieceColor = getPieceColor(pieceChar);
    let table;
    switch (pieceType) {
        case 'p': table = PAWN_TABLE; break; case 'n': table = KNIGHT_TABLE; break;
        case 'b': table = BISHOP_TABLE; break; case 'r': table = ROOK_TABLE; break;
        case 'q': table = QUEEN_TABLE; break; case 'k': table = KING_MIDDLE_GAME_TABLE; break;
        default: return 0;
    }
    const effectiveRow = (pieceColor === 'white') ? row : 7 - row;
    return table[effectiveRow][col];
}


// -----------------------------------------------------------------------------------------------------------------
// 5. Funciones de Verificación de Estado (Jaque, Jaque Mate, Ahogado)
//    isKingInCheck DEBE ir antes de isKingInCheckAfterMoveForBoard
// -----------------------------------------------------------------------------------------------------------------
function isKingInCheck(currentBoard, kingColor) {
    const kingIndex = findKingIndex(currentBoard, kingColor);
    if (kingIndex === -1) { return false; } // Rey no encontrado, no puede estar en jaque

    const opponentColor = (kingColor === 'white') ? 'black' : 'white';
    for (let i = 0; i < 64; i++) {
        const piece = currentBoard[i];
        if (piece && getPieceColor(piece) === opponentColor) {
            const { row: attackerRow, col: attackerCol } = indexToCoords(i);
            const pieceType = piece.toLowerCase();

            if (pieceType === 'p') {
                const pawnAttackDirection = (getPieceColor(piece) === 'white') ? -1 : 1;
                if (coordsToIndex(attackerRow + pawnAttackDirection, attackerCol - 1) === kingIndex ||
                    coordsToIndex(attackerRow + pawnAttackDirection, attackerCol + 1) === kingIndex) {
                    return true;
                }
            } else if (['r', 'b', 'q'].includes(pieceType)) {
                let directions;
                if (pieceType === 'r') directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                else if (pieceType === 'b') directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
                else directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [1, 1]];
                
                for (const [dr, dc] of directions) {
                    let newRow = attackerRow + dr;
                    let newCol = attackerCol + dc;
                    while (coordsToIndex(newRow, newCol) !== -1) {
                        const targetIndex = coordsToIndex(newRow, newCol);
                        const targetPiece = currentBoard[targetIndex];
                        if (targetIndex === kingIndex) { return true; }
                        if (targetPiece !== null) { break; }
                        newRow += dr;
                        newCol += dc;
                    }
                }
            } else if (['n', 'k'].includes(pieceType)) {
                let offsets;
                if (pieceType === 'n') offsets = [
                    [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]
                ];
                else offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
                
                for (const [dr, dc] of offsets) {
                    if (coordsToIndex(attackerRow + dr, attackerCol + dc) === kingIndex) { return true; }
                }
            }
        }
    }
    return false;
}

/**
 * isKingInCheckAfterMoveForBoard DEBE ir después de isKingInCheck
 */
function isKingInCheckAfterMoveForBoard(boardState, fromIndex, toIndex, playerColor) {
    const tempBoard = [...boardState];
    const pieceToMove = tempBoard[fromIndex];

    tempBoard[toIndex] = pieceToMove;
    tempBoard[fromIndex] = null;

    const isEnPassant = (pieceToMove.toLowerCase() === 'p' && boardState[toIndex] === null && Math.abs(indexToCoords(fromIndex).col - indexToCoords(toIndex).col) === 1);
    if (isEnPassant) {
        const pawnDir = (playerColor === 'white') ? 1 : -1;
        const capturedPawnIndex = coordsToIndex(indexToCoords(toIndex).row + pawnDir, indexToCoords(toIndex).col);
        if (capturedPawnIndex !== -1 && tempBoard[capturedPawnIndex] && getPieceColor(tempBoard[capturedPawnIndex]) !== playerColor && tempBoard[capturedPawnIndex].toLowerCase() === 'p') {
            tempBoard[capturedPawnIndex] = null;
        }
    }

    const kingMovedDistance = Math.abs(indexToCoords(fromIndex).col - indexToCoords(toIndex).col);
    if (pieceToMove.toLowerCase() === 'k' && kingMovedDistance === 2) {
        const kingRow = indexToCoords(fromIndex).row;
        if (coordsToIndex(toIndex).col === 6) {
            tempBoard[coordsToIndex(kingRow, 5)] = tempBoard[coordsToIndex(kingRow, 7)];
            tempBoard[coordsToIndex(kingRow, 7)] = null;
        } else if (coordsToIndex(toIndex).col === 2) {
            tempBoard[coordsToIndex(kingRow, 3)] = tempBoard[coordsToIndex(kingRow, 0)];
            tempBoard[coordsToIndex(kingRow, 0)] = null;
        }
    }
    
    const { row: targetRow } = indexToCoords(toIndex);
    if (pieceToMove.toLowerCase() === 'p' &&
        ((playerColor === 'white' && targetRow === 0) || (playerColor === 'black' && targetRow === 7))) {
        tempBoard[toIndex] = (playerColor === 'white') ? 'Q' : 'q';
    }

    return isKingInCheck(tempBoard, playerColor);
}

// checkGameEndConditions DEBE ir después de isKingInCheck y isKingInCheckAfterMoveForBoard
function checkGameEndConditions() {
    const kingInCheck = isKingInCheck(board, currentPlayer);
    let hasLegalMoves = false;
    for (let i = 0; i < 64; i++) {
        const piece = board[i];
        if (piece && getPieceColor(piece) === currentPlayer) {
            if (getLegalMovesForBoard(board, i, currentPlayer).length > 0) {
                hasLegalMoves = true;
                break;
            }
        }
    }

    document.querySelectorAll('.in-check').forEach(sq => sq.classList.remove('in-check'));

    if (kingInCheck) {
        const kingIndex = findKingIndex(board, currentPlayer);
        if (kingIndex !== -1) {
            const kingSquareElement = chessboardElement.querySelector(`[data-index="${kingIndex}"]`);
            if (kingSquareElement) { kingSquareElement.classList.add('in-check'); }
        }

        if (hasLegalMoves) {
            updateStatusMessage(`¡JAQUE! Es el turno de las ${currentPlayer === 'white' ? 'Blancas' : 'Negras'}.`);
        } else {
            const winner = (currentPlayer === 'white') ? 'Negras' : 'Blancas';
            updateStatusMessage(`¡JAQUE MATE! Las ${winner} ganan.`);
            gameEnded = true;
            chessboardElement.style.pointerEvents = 'none';
            resetButton.style.pointerEvents = 'auto';
            undoButton.style.pointerEvents = 'none';
        }
    } else {
        if (!hasLegalMoves) {
            updateStatusMessage("¡AHOGADO! Es tablas.");
            gameEnded = true;
            chessboardElement.style.pointerEvents = 'none';
            resetButton.style.pointerEvents = 'auto';
            undoButton.style.pointerEvents = 'none';
        } else {
            updateStatusMessage(`Es el turno de las ${currentPlayer === 'white' ? 'Blancas' : 'Negras'}.`);
        }
    }

    if (!gameEnded) {
    // PREGUNTA: ¿Es el turno de las negras y estamos en modo vs. IA?
    if (currentPlayer === 'black' && gameMode === 'vsAI') {
        // --- RUTA DE LA IA ---
        chessboardElement.style.pointerEvents = 'none'; // Bloqueamos el tablero
        undoButton.style.pointerEvents = 'none';
        updateStatusMessage('La IA (Negras) está pensando...');
        
        setTimeout(() => {
            const aiMoveData = findBestMove(board, AI_DEPTH, 'black', -Infinity, Infinity);
            if (aiMoveData && aiMoveData.move) {
                performMove(aiMoveData.move.from, aiMoveData.move.to);
            } else {
                console.error("La IA no pudo encontrar un movimiento...");
                updateStatusMessage("Error de la IA o tablas. Tablero habilitado.");
                chessboardElement.style.pointerEvents = 'auto';
                undoButton.style.pointerEvents = 'auto';
            }
        }, 100);
    } else {
        // --- RUTA DEL JUGADOR HUMANO (BLANCO O NEGRO EN MODO vsPlayer) ---
        // Si no es la IA, simplemente habilitamos el tablero para el siguiente jugador humano.
        chessboardElement.style.pointerEvents = 'auto';
        undoButton.style.pointerEvents = 'auto';
    }}
}

// -----------------------------------------------------------------------------------------------------------------
// 6. Funciones de Renderizado y UI (Añade esta sección o la función dentro de una existente)
// -----------------------------------------------------------------------------------------------------------------

/**
 * Actualiza la visualización de las piezas capturadas en la interfaz de usuario.
 * Esta es la función que faltaba y que causaba el error.
 */
/**
 * Actualiza la visualización de las piezas capturadas en la interfaz de usuario.
 * VERSIÓN DEFINITIVA: Crea una estructura HTML robusta para evitar desbordamientos.
 */
function updateCapturedPiecesDisplay() {
    // Lista de los dos contenedores principales y sus títulos
    const captureAreas = [
        { element: whiteCapturedPiecesElement, pieces: capturedPieces.white, title: "Capturadas por Blancas:" },
        { element: blackCapturedPiecesElement, pieces: capturedPieces.black, title: "Capturadas por Negras:" }
    ];

    captureAreas.forEach(area => {
        // 1. Limpiamos completamente el contenedor principal
        area.element.innerHTML = '';

        // 2. Creamos y añadimos el título
        const titleElement = document.createElement('h4');
        titleElement.textContent = area.title;
        area.element.appendChild(titleElement);

        // 3. Creamos un NUEVO DIV que contendrá SOLO las imágenes de las piezas
        const piecesContainer = document.createElement('div');
        piecesContainer.classList.add('captured-pieces-inner-list'); // Nueva clase para el estilo
        
        // 4. Añadimos las imágenes de las piezas a este nuevo div interno
        area.pieces.forEach(pieceChar => {
            const pieceImg = document.createElement('img');
            pieceImg.src = PIECES_MAP[pieceChar];
            pieceImg.classList.add('captured-piece-img');
            piecesContainer.appendChild(pieceImg);
        });

        // 5. Finalmente, añadimos el div con las piezas al contenedor principal
        area.element.appendChild(piecesContainer);
    });
}

/**
 * Dibuja el tablero de ajedrez completo en el DOM basado en el estado actual del array `board`.
 * Crea las casillas, coloca las imágenes de las piezas y asigna los manejadores de eventos.
 * Esta es la función que faltaba y que causaba el segundo error.
 */
function renderBoard() {
    // Vacía el tablero actual para redibujarlo desde cero.
    chessboardElement.innerHTML = ''; 

    // Itera sobre cada una de las 64 casillas del tablero.
    for (let i = 0; i < 64; i++) {
        const square = document.createElement('div');
        square.classList.add('square');

        // Calcula la fila y la columna para determinar el color de la casilla.
        const row = Math.floor(i / 8);
        const col = i % 8;

        // Asigna el color 'light-square' o 'dark-square'.
        const isLightSquare = (row + col) % 2 === 0;
        square.classList.add(isLightSquare ? 'light-square' : 'dark-square');

        // Guarda el índice de la casilla para saber cuál fue clickeada.
        square.dataset.index = i;

        // Revisa si hay una pieza en esta casilla según el array `board`.
        const pieceChar = board[i];
        if (pieceChar) {
            const pieceImg = document.createElement('img');
            pieceImg.src = PIECES_MAP[pieceChar]; // Usa el mapa de piezas para obtener la imagen.
            pieceImg.classList.add('piece-img');
            pieceImg.draggable = false; // Evita que el navegador intente arrastrar la imagen.
            square.appendChild(pieceImg);
        }

        // Añade el evento de click a cada casilla.
        square.addEventListener('click', handleSquareClick);

        // Finalmente, añade la casilla al elemento principal del tablero.
        chessboardElement.appendChild(square);
    }
}

/**
 * Actualiza el texto en el elemento de estado del juego.
 * @param {string} message - El mensaje que se mostrará al jugador.
 */
function updateStatusMessage(message) {
    if (statusMessageElement) {
        statusMessageElement.textContent = message;
    } else {
        console.error("El elemento del DOM para los mensajes de estado no fue encontrado.");
    }
}

/**
 * Convierte un movimiento a la notación algebraica de ajedrez (ej: "Nf3", "e4", "Bxc6+").
 * @param {number} fromIndex - Índice de la casilla de origen.
 * @param {number} toIndex - Índice de la casilla de destino.
 * @param {string} pieceToMove - Carácter de la pieza que se mueve.
 * @param {string|null} capturedPieceChar - Carácter de la pieza capturada, si la hay.
 * @param {Array} boardAfterMove - El estado del tablero DESPUÉS del movimiento.
 * @param {boolean} isPromotion - Si el movimiento es una promoción de peón.
 * @param {string} promotedPiece - La pieza a la que se promociona.
 * @param {string} moveType - Información extra como 'O-O' para enroque.
 * @returns {string} El movimiento en notación algebraica.
 * @returns {string} El movimiento en formato de frase descriptiva.
 */
function getAlgebraicNotation(fromIndex, toIndex, pieceToMove, capturedPieceChar, boardAfterMove, isPromotion, promotedPiece, moveType) {
    // --- MAPA DE NOMBRES EN ESPAÑOL ---
    const PIECE_NAMES_ES = {
        'p': 'Peón', 'r': 'Torre', 'n': 'Caballo', 'b': 'Alfil', 'q': 'Dama', 'k': 'Rey',
        'P': 'Peón', 'R': 'Torre', 'N': 'Caballo', 'B': 'Alfil', 'Q': 'Dama', 'K': 'Rey'
    };

    // --- 1. MANEJAR CASOS ESPECIALES (ENROQUE) ---
    if (moveType === 'O-O') return "Enroque corto (0-0)";
    if (moveType === 'O-O-O') return "Enroque largo (0-0-0)";

    // --- 2. OBTENER DATOS BÁSICOS DEL MOVIMIENTO ---
    const pieceName = PIECE_NAMES_ES[pieceToMove] || 'Pieza';
    const fromCoord = COLS_ALGEBRAIC[indexToCoords(fromIndex).col] + ROWS_ALGEBRAIC[indexToCoords(fromIndex).row];
    const toCoord = COLS_ALGEBRAIC[indexToCoords(toIndex).col] + ROWS_ALGEBRAIC[indexToCoords(toIndex).row];
    
    let notation = '';

    // --- 3. CONSTRUIR LA FRASE DESCRIPTIVA ---
    if (isPromotion) {
        const promotedPieceName = PIECE_NAMES_ES[promotedPiece] || 'Dama';
        notation = `Peón promociona a ${promotedPieceName} en ${toCoord}`;
    } else if (capturedPieceChar) {
        notation = `${pieceName} captura en ${toCoord}`;
    } else {
        notation = `${pieceName} de ${fromCoord} a ${toCoord}`;
    }

    // --- 4. AÑADIR INFORMACIÓN DE JAQUE O JAQUE MATE ---
    const opponentColor = getPieceColor(pieceToMove) === 'white' ? 'black' : 'white';
    if (isKingInCheck(boardAfterMove, opponentColor)) {
        // Verificar si es jaque mate para ser más precisos
        let hasLegalMoves = false;
        for (let i = 0; i < 64; i++) {
            if (boardAfterMove[i] && getPieceColor(boardAfterMove[i]) === opponentColor) {
                if (getLegalMovesForBoard(boardAfterMove, i, opponentColor).length > 0) {
                    hasLegalMoves = true;
                    break;
                }
            }
        }
        if (hasLegalMoves) {
            notation += ' ¡Jaque!'; // Añadimos la palabra completa
        } else {
            notation += ' ¡Jaque Mate!'; // Y para el mate también
        }
    }

    return notation;
}


/**
 * Añade una jugada en notación algebraica al registro de movimientos en la pantalla.
 * VERSIÓN FINAL: Optimizado para funcionar con CSS Grid.
 * @param {string} notation - La notación del movimiento (ej: "e4", "Nf3").
 * @param {string} playerWhoMoved - El color del jugador que hizo el movimiento ('white' o 'black').
 */
function addMoveToLog(notation, playerWhoMoved) {
    if (!movesListElement) {
        console.error("El elemento de la lista de movimientos no existe.");
        return;
    }

    if (playerWhoMoved === 'white') {
        // Al mover las blancas, crea la fila completa con un espacio para las negras.
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="move-number">${currentMoveNumber}.</span>
            <span class="move-white">${notation}</span>
            <span class="move-black"></span> 
        `; // El span de las negras se crea vacío
        movesListElement.appendChild(listItem);
    } else {
        // Al mover las negras, encuentra la última fila y rellena el espacio vacío.
        const lastItem = movesListElement.lastElementChild;
        if (lastItem) {
            const blackMoveSpan = lastItem.querySelector('.move-black');
            if (blackMoveSpan) {
                blackMoveSpan.textContent = notation;
            }
        }
        // Incrementa el número de jugada después del movimiento de las negras
        currentMoveNumber++;
    }

    // Hacer que el contenedor se desplace hacia abajo para mostrar siempre el último movimiento
    const movesContainer = document.getElementById('moves-list-container');
    if (movesContainer) {
        movesContainer.scrollTop = movesContainer.scrollHeight;
    }
}


// -----------------------------------------------------------------------------------------------------------------
// 7. Funciones para Guardar y Deshacer el Estado del Juego (Historial)
// -----------------------------------------------------------------------------------------------------------------
function saveGameState() {
    history.push({
        board: [...board],
        currentPlayer: currentPlayer,
        capturedPieces: {
            white: [...capturedPieces.white],
            black: [...capturedPieces.black]
        },
        enPassantTargetSquare: enPassantTargetSquare,
        whiteKingMoved: whiteKingMoved,
        blackKingMoved: blackKingMoved,
        whiteRookH1Moved: whiteRookH1Moved,
        whiteRookA1Moved: whiteRookA1Moved,
        blackRookH8Moved: blackRookH8Moved,
        blackRookA8Moved: blackRookA8Moved,
        currentMoveNumber: currentMoveNumber,
        gameEnded: gameEnded,
    });
    console.log("DEBUG: Estado del juego guardado. Historial:", history.length);
}

function undoLastMove() {
    if (history.length > 1) {
        history.pop();
        const prevState = history[history.length - 1];

        board = [...prevState.board];
        currentPlayer = prevState.currentPlayer;
        capturedPieces.white = [...prevState.capturedPieces.white];
        capturedPieces.black = [...prevState.capturedPieces.black];
        enPassantTargetSquare = prevState.enPassantTargetSquare;
        whiteKingMoved = prevState.whiteKingMoved;
        blackKingMoved = prevState.blackKingMoved;
        whiteRookH1Moved = prevState.whiteRookH1Moved;
        whiteRookA1Moved = prevState.whiteRookA1Moved;
        blackRookH8Moved = prevState.blackRookH8Moved;
        blackRookA8Moved = prevState.blackRookA8Moved;
        currentMoveNumber = prevState.currentMoveNumber;
        gameEnded = prevState.gameEnded;

        renderBoard();
        updateCapturedPiecesDisplay();
        updateStatusMessage(`Movimiento deshecho. Es el turno de las ${currentPlayer === 'white' ? 'Blancas' : 'Negras'}.`);

        chessboardElement.style.pointerEvents = 'auto';
        resetButton.style.pointerEvents = 'auto';
        undoButton.style.pointerEvents = 'auto';
        
        console.log("DEBUG: Movimiento deshecho. Historial:", history.length);
    } else {
        updateStatusMessage("No hay más movimientos para deshacer.");
        console.log("DEBUG: No hay movimientos para deshacer.");
    }
}


// -----------------------------------------------------------------------------------------------------------------
// 8. Funciones de Movimiento (Adaptadas para usar 'boardState' como argumento para la IA y simulaciones)
// Estas funciones DEBEN ir antes de getLegalMovesForBoard y getLegalMoves.
// -----------------------------------------------------------------------------------------------------------------
function getSlidingMovesForBoard(boardState, fromIndex, pieceChar, pieceColor) {
    const moves = [];
    const { row: startRow, col: startCol } = indexToCoords(fromIndex);
    
    let directions;
    const pieceType = pieceChar.toLowerCase();
    if (pieceType === 'r') directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    else if (pieceType === 'b') directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    else if (pieceType === 'q') directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [1, 1]];
    else return moves;

    for (const [dr, dc] of directions) {
        let newRow = startRow + dr;
        let newCol = startCol + dc;
        
        while (coordsToIndex(newRow, newCol) !== -1) {
            const targetIndex = coordsToIndex(newRow, newCol);
            const targetPiece = boardState[targetIndex];
            const targetPieceColor = getPieceColor(targetPiece);

            if (targetPiece === null) { moves.push(targetIndex); }
            else if (targetPieceColor === pieceColor) { break; }
            else { moves.push(targetIndex); break; }
            newRow += dr;
            newCol += dc;
        }
    }
    return moves;
}

function getPawnMovesForBoard(boardState, fromIndex, pieceChar, pieceColor) {
    const moves = [];
    const { row, col } = indexToCoords(fromIndex);
    const direction = (pieceColor === 'white') ? -1 : 1;

    const oneStepForwardRow = row + direction;
    const oneStepForwardIndex = coordsToIndex(oneStepForwardRow, col);
    if (oneStepForwardIndex !== -1 && boardState[oneStepForwardIndex] === null) {
        moves.push(oneStepForwardIndex);
        const initialRow = (pieceColor === 'white') ? 6 : 1;
        if (row === initialRow) {
            const twoStepsForwardRow = row + 2 * direction;
            const twoStepsForwardIndex = coordsToIndex(twoStepsForwardRow, col);
            if (twoStepsForwardIndex !== -1 && boardState[twoStepsForwardIndex] === null) { moves.push(twoStepsForwardIndex); }
        }
    }

    const captureCols = [col - 1, col + 1];
    for (const c of captureCols) {
        const captureIndex = coordsToIndex(row + direction, c);
        if (captureIndex !== -1) {
            const targetPiece = boardState[captureIndex];
            if (targetPiece && getPieceColor(targetPiece) !== pieceColor) { moves.push(captureIndex); }
        }
    }

    const pawnEnPassantRow = (pieceColor === 'white') ? 3 : 4;
    if (row === pawnEnPassantRow && enPassantTargetSquare !== -1) {
        const { row: targetRow, col: targetCol } = indexToCoords(enPassantTargetSquare);
        if (targetRow === (row + direction) && Math.abs(targetCol - col) === 1) {
            const capturedPawnIndex = coordsToIndex(row, targetCol);
            const capturedPawnChar = boardState[capturedPawnIndex];
            if (capturedPawnChar && capturedPawnChar.toLowerCase() === 'p' && getPieceColor(capturedPawnChar) !== pieceColor) { moves.push(enPassantTargetSquare); }
        }
    }
    return moves;
}

function getRookMovesForBoard(boardState, fromIndex, pieceChar, pieceColor) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    return getSlidingMovesForBoard(boardState, fromIndex, pieceChar, pieceColor, directions);
}

function getKnightMovesForBoard(boardState, fromIndex, pieceChar, pieceColor) {
    const moves = [];
    const { row, col } = indexToCoords(fromIndex);
    const knightOffsets = [ [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1] ];
    for (const [dr, dc] of knightOffsets) {
        const newRow = row + dr;
        const newCol = col + dc;
        const targetIndex = coordsToIndex(newRow, newCol);
        if (targetIndex !== -1) {
            const targetPiece = boardState[targetIndex];
            const targetPieceColor = getPieceColor(targetPiece);
            if (targetPiece === null || targetPieceColor !== pieceColor) { moves.push(targetIndex); }
        }
    }
    return moves;
}

function getBishopMovesForBoard(boardState, fromIndex, pieceChar, pieceColor) {
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    return getSlidingMovesForBoard(boardState, fromIndex, pieceChar, pieceColor, directions);
}

function getQueenMovesForBoard(boardState, fromIndex, pieceChar, pieceColor) {
    const directions = [ [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [1, 1] ];
    return getSlidingMovesForBoard(boardState, fromIndex, pieceChar, pieceColor, directions);
}

function getKingMovesForBoard(boardState, fromIndex, pieceChar, pieceColor) {
    const moves = [];
    const { row, col } = indexToCoords(fromIndex);
    const kingOffsets = [ [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1] ];
    for (const [dr, dc] of kingOffsets) {
        const newRow = row + dr;
        const newCol = col + dc;
        const targetIndex = coordsToIndex(newRow, newCol);
        if (targetIndex !== -1) {
            const targetPiece = boardState[targetIndex];
            const targetPieceColor = getPieceColor(targetPiece);
            if (targetPiece === null || targetPieceColor !== pieceColor) { moves.push(targetIndex); }
        }
    }

    if (!isKingInCheck(boardState, pieceColor)) {
        const kingRow = (pieceColor === 'white') ? 7 : 0;
        const kingCol = 4;

        if (!((pieceColor === 'white' && whiteKingMoved) || (pieceColor === 'black' && blackKingMoved)) &&
            !((pieceColor === 'white' && whiteRookH1Moved) || (pieceColor === 'black' && blackRookH8Moved))) {
            const f_square = coordsToIndex(kingRow, kingCol + 1);
            const g_square = coordsToIndex(kingRow, kingCol + 2);
            
            if (boardState[f_square] === null && boardState[g_square] === null) {
                if (!isKingInCheckAfterMoveForBoard(boardState, fromIndex, f_square, pieceColor) &&
                    !isKingInCheckAfterMoveForBoard(boardState, fromIndex, g_square, pieceColor)) {
                    moves.push(g_square);
                }
            }
        }

        if (!((pieceColor === 'white' && whiteKingMoved) || (pieceColor === 'black' && blackKingMoved)) &&
            !((pieceColor === 'white' && whiteRookA1Moved) || (pieceColor === 'black' && blackRookA8Moved))) {
            const b_square = coordsToIndex(kingRow, kingCol - 3);
            const c_square = coordsToIndex(kingRow, kingCol - 2);
            const d_square = coordsToIndex(kingRow, kingCol - 1);
            
            if (boardState[b_square] === null && boardState[c_square] === null && boardState[d_square] === null) {
                if (!isKingInCheckAfterMoveForBoard(boardState, fromIndex, c_square, pieceColor) &&
                    !isKingInCheckAfterMoveForBoard(boardState, fromIndex, d_square, pieceColor)) {
                    moves.push(c_square);
                }
            }
        }
    }
    return moves;
}

/**
 * Obtiene todos los movimientos legales para una pieza en una casilla dada, en un tablero específico y para un jugador específico.
 */
function getLegalMovesForBoard(boardState, fromIndex, playerColor) {
    const pieceChar = boardState[fromIndex];
    if (!pieceChar || getPieceColor(pieceChar) !== playerColor) return [];

    let possibleMoves = [];
    switch (pieceChar.toLowerCase()) {
        case 'p': possibleMoves = getPawnMovesForBoard(boardState, fromIndex, pieceChar, playerColor); break;
        case 'r': possibleMoves = getRookMovesForBoard(boardState, fromIndex, pieceChar, playerColor); break;
        case 'n': possibleMoves = getKnightMovesForBoard(boardState, fromIndex, pieceChar, playerColor); break;
        case 'b': possibleMoves = getBishopMovesForBoard(boardState, fromIndex, pieceChar, playerColor); break;
        case 'q': possibleMoves = getQueenMovesForBoard(boardState, fromIndex, pieceChar, playerColor); break;
        case 'k': possibleMoves = getKingMovesForBoard(boardState, fromIndex, pieceChar, playerColor); break;
        default: break;
    }
    
    const filteredMoves = possibleMoves.filter(toIndex => !isKingInCheckAfterMoveForBoard(boardState, fromIndex, toIndex, playerColor));
    
    return filteredMoves;
}

// Función principal para obtener movimientos legales para el tablero REAL (`board` global)
function getLegalMoves(fromIndex) {
    return getLegalMovesForBoard(board, fromIndex, currentPlayer);
}


// -----------------------------------------------------------------------------------------------------------------
// 9. Lógica de la IA (Minimax y Evaluación)
// -----------------------------------------------------------------------------------------------------------------
function evaluateBoard(currentBoard) {
    let score = 0;
    for (let i = 0; i < 64; i++) {
        const piece = currentBoard[i];
        if (piece) {
            const pieceType = piece.toLowerCase();
            const pieceValue = PIECE_VALUES[pieceType];
            const { row, col } = indexToCoords(i);
            const pieceSquareValue = getPieceSquareValue(piece, row, col);

            if (pieceValue !== undefined) {
                if (getPieceColor(piece) === 'white') {
                    score += pieceValue;
                    score += pieceSquareValue;
                } else {
                    score -= pieceValue;
                    score -= pieceSquareValue;
                }
            }
        }
    }
    return score;
}

function findBestMove(currentBoard, depth, playerColor, alpha, beta) {
    if (depth === 0) {
        return { score: (playerColor === 'white') ? evaluateBoard(currentBoard) : -evaluateBoard(currentBoard), move: null };
    }

    let bestMove = null;
    let bestScore = (playerColor === 'white') ? -Infinity : Infinity;

    let allLegalMoves = [];
    for (let i = 0; i < 64; i++) {
        const piece = currentBoard[i];
        if (piece && getPieceColor(piece) === playerColor) {
            const movesForPiece = getLegalMovesForBoard(currentBoard, i, playerColor);
            movesForPiece.forEach(move => allLegalMoves.push({ from: i, to: move }));
        }
    }

    if (allLegalMoves.length === 0) {
        if (isKingInCheck(currentBoard, playerColor)) {
            return { score: (playerColor === 'white' ? -Infinity : Infinity), move: null };
        } else {
            return { score: 0, move: null };
        }
    }

    for (const move of allLegalMoves) {
        const newBoard = [...currentBoard];
        const pieceToMove = newBoard[move.from];
        
        newBoard[move.to] = pieceToMove;
        newBoard[move.from] = null;

        const kingMovedDistance = Math.abs(indexToCoords(move.from).col - indexToCoords(move.to).col);
        if (pieceToMove.toLowerCase() === 'k' && kingMovedDistance === 2) {
            const kingRow = indexToCoords(move.from).row;
            if (coordsToIndex(move.to).col === 6) {
                newBoard[coordsToIndex(kingRow, 5)] = newBoard[coordsToIndex(kingRow, 7)];
                newBoard[coordsToIndex(kingRow, 7)] = null;
            } else if (coordsToIndex(move.to).col === 2) {
                newBoard[coordsToIndex(kingRow, 3)] = newBoard[coordsToIndex(kingRow, 0)];
                newBoard[coordsToIndex(kingRow, 0)] = null;
            }
        }
        
        const isEnPassant = (pieceToMove.toLowerCase() === 'p' && currentBoard[move.to] === null && Math.abs(indexToCoords(move.from).col - indexToCoords(move.to).col) === 1);
        if (isEnPassant) {
            const pawnDirection = (playerColor === 'white') ? 1 : -1;
            const capturedPawnIndex = coordsToIndex(indexToCoords(move.to).row + pawnDirection, indexToCoords(move.to).col);
            if (capturedPawnIndex !== -1 && newBoard[capturedPawnIndex] && getPieceColor(newBoard[capturedPawnIndex]) !== playerColor && newBoard[capturedPawnIndex].toLowerCase() === 'p') {
                newBoard[capturedPawnIndex] = null;
            }
        }

        const { row: toRow } = indexToCoords(move.to);
        if (pieceToMove.toLowerCase() === 'p' &&
            ((playerColor === 'white' && toRow === 0) || (playerColor === 'black' && toRow === 7))) {
            newBoard[move.to] = (playerColor === 'white') ? 'Q' : 'q';
        }

        const nextPlayerColor = (playerColor === 'white') ? 'black' : 'white';
        const result = findBestMove(newBoard, depth - 1, nextPlayerColor, alpha, beta);

        if (playerColor === 'white') {
            if (result.score > bestScore) {
                bestScore = result.score;
                bestMove = move;
            }
            alpha = Math.max(alpha, bestScore);
        } else {
            if (result.score < bestScore) {
                bestScore = result.score;
                bestMove = move;
            }
            beta = Math.min(beta, bestScore);
        }

        if (beta <= alpha) { break; }
    }
    return { score: bestScore, move: bestMove };
}


// -----------------------------------------------------------------------------------------------------------------
// 10. Lógica de Manejo de Eventos del Juego (Clics en casillas, etc.)
// -----------------------------------------------------------------------------------------------------------------
function handleSquareClick(event) {
    if (promotingPawnIndex !== -1 || gameEnded) {
        return;
    }
    
    const clickedSquare = event.currentTarget;
    const index = parseInt(clickedSquare.dataset.index);
    const pieceOnClickedSquare = board[index];

    document.querySelectorAll('.highlight').forEach(sq => sq.classList.remove('highlight'));
    document.querySelectorAll('.en-passant-target').forEach(sq => sq.classList.remove('en-passant-target'));

    if (selectedSquare === null) {
        if (pieceOnClickedSquare) {
            const pieceColor = getPieceColor(pieceOnClickedSquare);
            if (pieceColor === currentPlayer) {
                selectedSquare = clickedSquare;
                selectedSquare.classList.add('selected');
                updateStatusMessage(`Pieza seleccionada: ${PIECES_MAP[pieceOnClickedSquare]}.`);

                const legalMoves = getLegalMoves(index);
                legalMoves.forEach(moveIndex => {
                    const targetSquareElement = chessboardElement.querySelector(`[data-index="${moveIndex}"]`);
                    if (targetSquareElement) {
                        targetSquareElement.classList.add('highlight');
                        if (moveIndex === enPassantTargetSquare) {
                            targetSquareElement.classList.add('en-passant-target');
                        }
                    }
                });
            } else {
                updateStatusMessage(`Es el turno de las ${currentPlayer === 'white' ? 'Blancas' : 'Negras'}. Por favor, selecciona una pieza de tu color.`);
            }
        }
    } else {
        const fromIndex = parseInt(selectedSquare.dataset.index);
        const toIndex = index;

        selectedSquare.classList.remove('selected');

        if (fromIndex === toIndex) {
            selectedSquare = null;
            updateStatusMessage('Deseleccionado.');
            return;
        } 
        
        if (pieceOnClickedSquare && getPieceColor(pieceOnClickedSquare) === currentPlayer) {
            selectedSquare = clickedSquare;
            selectedSquare.classList.add('selected');
            updateStatusMessage(`Nueva pieza seleccionada: ${PIECES_MAP[pieceOnClickedSquare]}.`);
            
            const newLegalMoves = getLegalMoves(index);
            newLegalMoves.forEach(moveIndex => {
                const targetSquareElement = chessboardElement.querySelector(`[data-index="${moveIndex}"]`);
                if (targetSquareElement) {
                    targetSquareElement.classList.add('highlight');
                    if (moveIndex === enPassantTargetSquare) {
                        targetSquareElement.classList.add('en-passant-target');
                    }
                }
            });
            return;
        }

        const legalMoves = getLegalMoves(fromIndex);

        console.log("Movimiento intentado de", fromIndex, "a", toIndex);
        console.log("Movimientos legales para la pieza seleccionada:", legalMoves);

        if (legalMoves.includes(toIndex)) {
            performMove(fromIndex, toIndex);
        } else {
            updateStatusMessage('Movimiento ilegal. Intenta de nuevo.');
        }
        selectedSquare = null;
    }
}

function performMove(fromIndex, toIndex) {
    const pieceToMove = board[fromIndex];
    const targetPiece = board[toIndex];

    let capturedPieceChar = null;
    let moveType = 'normal';

    if (pieceToMove === 'K') whiteKingMoved = true;
    if (pieceToMove.toLowerCase() === 'k') blackKingMoved = true;
    if (pieceToMove === 'R' && fromIndex === coordsToIndex(7, 7)) whiteRookH1Moved = true;
    if (pieceToMove === 'R' && fromIndex === coordsToIndex(7, 0)) whiteRookA1Moved = true;
    if (pieceToMove === 'r' && fromIndex === coordsToIndex(0, 7)) blackRookH8Moved = true;
    if (pieceToMove === 'r' && fromIndex === coordsToIndex(0, 0)) blackRookA8Moved = true;

    const isEnPassantMove = (pieceToMove.toLowerCase() === 'p' && targetPiece === null && Math.abs(indexToCoords(fromIndex).col - indexToCoords(toIndex).col) === 1);
    
    if (isEnPassantMove) {
        const pawnDirection = (getPieceColor(pieceToMove) === 'white') ? 1 : -1;
        const capturedPawnIndex = coordsToIndex(indexToCoords(toIndex).row + pawnDirection, indexToCoords(toIndex).col);
        capturedPieceChar = board[capturedPawnIndex];

        if (capturedPawnIndex !== -1 && capturedPieceChar && getPieceColor(capturedPieceChar) !== getPieceColor(pieceToMove) && capturedPieceChar.toLowerCase() === 'p') {
            capturedPieces[getPieceColor(pieceToMove)].push(capturedPieceChar);
            updateCapturedPiecesDisplay();
            updateStatusMessage(`¡${(getPieceColor(pieceToMove) === 'white' ? 'Blancas' : 'Negras')} capturó al paso!`);
            board[capturedPawnIndex] = null;
            moveType = 'en-passant';
        }
    } else if (targetPiece && getPieceColor(targetPiece) !== getPieceColor(pieceToMove)) {
        capturedPieceChar = targetPiece;
        const capturerColor = getPieceColor(pieceToMove);
        capturedPieces[capturerColor].push(targetPiece);
        updateStatusMessage(`¡${(getPieceColor(pieceToMove) === 'white' ? 'Blancas' : 'Negras')} capturó una pieza!`);
        updateCapturedPiecesDisplay();
    }

    board[toIndex] = pieceToMove;
    board[fromIndex] = null;

    enPassantTargetSquare = -1;

    if (pieceToMove.toLowerCase() === 'p') {
        const fromRow = indexToCoords(fromIndex).row;
        const toRow = indexToCoords(toIndex).row;
        if (Math.abs(fromRow - toRow) === 2) {
            const direction = (getPieceColor(pieceToMove) === 'white') ? 1 : -1;
            enPassantTargetSquare = coordsToIndex(toRow + direction, indexToCoords(toIndex).col);
        }
    }

    renderBoard();

    const kingMovedDistance = Math.abs(indexToCoords(fromIndex).col - indexToCoords(toIndex).col);
    if (pieceToMove.toLowerCase() === 'k' && kingMovedDistance === 2) {
        const kingRow = indexToCoords(fromIndex).row;
        if (coordsToIndex(toIndex).col === 6) {
            const rookOldIndex = coordsToIndex(kingRow, 7);
            const rookNewIndex = coordsToIndex(kingRow, 5);
            board[rookNewIndex] = board[rookOldIndex];
            board[rookOldIndex] = null;
            moveType = 'O-O';
        } else if (coordsToIndex(toIndex).col === 2) {
            const rookOldIndex = coordsToIndex(kingRow, 0);
            const rookNewIndex = coordsToIndex(kingRow, 3);
            board[rookNewIndex] = board[rookOldIndex];
            board[rookOldIndex] = null;
            moveType = 'O-O-O';
        }
        renderBoard();
    }

    const pieceColor = getPieceColor(pieceToMove);
    const { row: toRow } = indexToCoords(toIndex);

    if (pieceToMove.toLowerCase() === 'p' &&
        ((pieceColor === 'white' && toRow === 0) || (pieceColor === 'black' && toRow === 7))) {
        
        pendingPromotionMoveDetails = {
            from: fromIndex,
            to: toIndex,
            piece: pieceToMove,
            captured: capturedPieceChar,
            moveType: moveType
        };
        promotingPawnIndex = toIndex;
        showPromotionDialog(pieceColor);
        return;
    }

    saveGameState();
    
    const playerWhoMoved = currentPlayer;
    currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
    
    const algebraicNotation = getAlgebraicNotation(fromIndex, toIndex, pieceToMove, capturedPieceChar, board, false, '', moveType);
    addMoveToLog(algebraicNotation, playerWhoMoved);

    checkGameEndConditions();
}

/**
 * Muestra el cuadro de diálogo para que el jugador elija una pieza de promoción.
 * @param {string} playerColor - El color del jugador que promociona ('white' o 'black').
 */
function showPromotionDialog(playerColor) {
    // 1. Limpia cualquier opción anterior para evitar duplicados.
    promotionOptionsDiv.innerHTML = '';

    // 2. Define las piezas a las que se puede promocionar según el color.
    const promotionPieces = (playerColor === 'white')
        ? ['Q', 'R', 'B', 'N'] // Dama, Torre, Alfil, Caballo blancos
        : ['q', 'r', 'b', 'n']; // Dama, Torre, Alfil, Caballo negros

    // 3. Crea un botón para cada opción de pieza.
    promotionPieces.forEach(pieceChar => {
        const optionButton = document.createElement('div');
        optionButton.classList.add('promotion-piece-option');

        const pieceImg = document.createElement('img');
        pieceImg.src = PIECES_MAP[pieceChar]; // Obtiene la ruta de la imagen
        optionButton.appendChild(pieceImg);

        // 4. Añade un evento de clic a cada botón.
        // Al hacer clic, se llamará a la función que ya tienes: handlePromotionSelection.
        optionButton.addEventListener('click', () => {
            handlePromotionSelection(pieceChar);
        });

        promotionOptionsDiv.appendChild(optionButton);
    });

    // 5. Muestra el cuadro de diálogo y bloquea el tablero temporalmente.
    promotionDialog.classList.remove('hidden');
    chessboardElement.style.pointerEvents = 'none'; // Evita clics en el tablero mientras se elige
}

function handlePromotionSelection(selectedPieceChar) {
    board[promotingPawnIndex] = selectedPieceChar;
    
    promotionDialog.classList.add('hidden');
    chessboardElement.style.pointerEvents = 'auto';
    resetButton.style.pointerEvents = 'auto';

    renderBoard();

    const promotionDetails = pendingPromotionMoveDetails;
    let moveNotation = getAlgebraicNotation(promotionDetails.from, promotionDetails.to, promotionDetails.piece, promotionDetails.captured, board, true, selectedPieceChar, promotionDetails.moveType);
    
    promotingPawnIndex = -1;
    pendingPromotionMoveDetails = null;

    saveGameState();

    const playerWhoMoved = currentPlayer;
    currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
    
    updateStatusMessage(`¡Peón promocionado! Es el turno de las ${currentPlayer === 'white' ? 'Blancas' : 'Negras'}.`);

    addMoveToLog(moveNotation, playerWhoMoved);
    checkGameEndConditions();
}


// -----------------------------------------------------------------------------------------------------------------
// 12. Funciones de Inicialización y Reseteo
// -----------------------------------------------------------------------------------------------------------------
function initializeBoard() {
    whiteKingMoved = false;
    blackKingMoved = false;
    whiteRookH1Moved = false;
    whiteRookA1Moved = false;
    blackRookH8Moved = false;
    blackRookA8Moved = false;
    enPassantTargetSquare = -1;
    currentMoveNumber = 1;
    gameEnded = false;
    movesListElement.innerHTML = '';
    history = [];

    // Carga la posición inicial del ajedrez estándar
    const fen = STARTING_FEN;
    const parts = fen.split(' ');
    const boardFen = parts[0];
    const turn = parts[1];

    board = [];
    chessboardElement.innerHTML = '';

    const ranks = boardFen.split('/');
    for (let i = 0; i < 8; i++) {
        const rank = ranks[i];
        let fileIndex = 0;
        for (let j = 0; j < rank.length; j++) {
            const char = rank[j];
            if (/\d/.test(char)) {
                const emptySquares = parseInt(char);
                for (let k = 0; k < emptySquares; k++) {
                    board[i * 8 + fileIndex] = null;
                    fileIndex++;
                }
            } else {
                board[i * 8 + fileIndex] = char;
                fileIndex++;
            }
        }
    }

    currentPlayer = (turn === 'w') ? 'white' : 'black';
    capturedPieces = { 'white': [], 'black': [] };
    updateCapturedPiecesDisplay();

    enPassantTargetSquare = -1;

    selectedSquare = null;
    document.querySelectorAll('.selected').forEach(sq => sq.classList.remove('selected'));
    document.querySelectorAll('.highlight').forEach(sq => sq.classList.remove('highlight'));
    document.querySelectorAll('.en-passant-target').forEach(sq => sq.classList.remove('en-passant-target'));

    renderBoard();

    updateStatusMessage(`Posición cargada. Es el turno de las ${currentPlayer === 'white' ? 'Blancas' : 'Negras'}.`);
    chessboardElement.style.pointerEvents = 'auto';
    resetButton.style.pointerEvents = 'auto';
    undoButton.style.pointerEvents = 'auto';
    gameEnded = false;

    history = [];
    saveGameState();
}


// -----------------------------------------------------------------------------------------------------------------
// 13. Manejadores de Eventos (Botones y Selector de Dificultad)
// -----------------------------------------------------------------------------------------------------------------
resetButton.addEventListener('click', () => {
    // Leemos el valor del modo de juego seleccionado antes de reiniciar
    const selectedMode = document.querySelector('input[name="gameMode"]:checked').value;
    gameMode = selectedMode;

    // Ocultamos o mostramos el selector de dificultad según el modo
    const difficultySelector = document.getElementById('difficulty-selector');
    if (gameMode === 'vsAI') {
        difficultySelector.style.display = 'flex'; // O 'block'
    } else {
        difficultySelector.style.display = 'none';
    }

    selectedSquare = null;
    currentPlayer = 'white';
    initializeBoard(); // Reinicia el juego con la configuración correcta
});


// -----------------------------------------------------------------------------------------------------------------
// 14. Inicialización del Juego (Se ejecuta cuando el DOM está completamente cargado)
// -----------------------------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Reubicar elementos del HTML original a la nueva estructura generada por JS
    const originalChessboardElement = document.getElementById('chessboard');
    const originalStatusMessageElement = document.getElementById('status-message');
    const originalResetButton = document.getElementById('reset-button');
    const originalUndoButton = document.getElementById('undo-button');
    const originalDifficultySelector = document.getElementById('difficulty-selector');
    const originalPromotionDialog = document.getElementById('promotion-dialog');
    const originalGameModeSelector = document.getElementById('game-mode-selector');

    // Construir la nueva estructura del layout del juego
    const gameLayoutContainer = document.createElement('div');
    gameLayoutContainer.id = 'game-layout-container';
    gameLayoutContainer.style.display = 'flex';
    gameLayoutContainer.style.alignItems = 'flex-start';
    gameLayoutContainer.style.marginTop = '20px';

    const chessboardContainer = document.createElement('div');
    chessboardContainer.id = 'chessboard-container';
    chessboardContainer.appendChild(originalChessboardElement);

    const sidePanel = document.createElement('div');
    sidePanel.id = 'side-panel';
    sidePanel.style.display = 'flex';
    sidePanel.style.flexDirection = 'column';
    sidePanel.style.marginLeft = '20px';
    sidePanel.style.padding = '10px';
    sidePanel.style.minWidth = '250px';
    sidePanel.style.maxHeight = '560px';
    sidePanel.style.overflowY = 'auto';

    // Añadir elementos al panel lateral en el orden deseado
    sidePanel.appendChild(originalStatusMessageElement);
    sidePanel.appendChild(blackCapturedPiecesElement); // Creado en JS
    sidePanel.appendChild(whiteCapturedPiecesElement); // Creado en JS
    sidePanel.appendChild(originalGameModeSelector);  
    sidePanel.appendChild(originalResetButton);
    sidePanel.appendChild(originalUndoButton);
    sidePanel.appendChild(originalDifficultySelector);
    sidePanel.appendChild(movesListContainer); // Creado en JS

    gameLayoutContainer.appendChild(chessboardContainer);
    gameLayoutContainer.appendChild(sidePanel);

    // Limpia gameContainer para eliminar los elementos originales de su lugar.
    gameContainer.innerHTML = ''; 
    
    // Luego añade los elementos en el orden deseado dentro de gameContainer
    gameContainer.appendChild(originalPromotionDialog);
    gameContainer.appendChild(gameLayoutContainer);

    // --- LÓGICA DE INICIALIZACIÓN CORREGIDA (LA PARTE NUEVA) ---

    // 1. Leemos el modo de juego seleccionado EN CUANTO CARGA LA PÁGINA
    const selectedMode = document.querySelector('input[name="gameMode"]:checked').value;
    gameMode = selectedMode;

    // 2. Ocultamos o mostramos el selector de dificultad según el modo inicial
    if (gameMode === 'vsAI') {
        originalDifficultySelector.style.display = 'flex';
    } else {
        originalDifficultySelector.style.display = 'none';
    }
    
    // 3. Ahora sí, inicializamos el tablero con la configuración correcta
    initializeBoard();
});