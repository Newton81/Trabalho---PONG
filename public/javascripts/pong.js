// Variaveis e Canvas
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const socket = io('/pong');
let isReferee = false;
let paddleIndex = 0;
var victory = false; // Verifica se alguém ganhou o jogo
var roundOver = false; // Verifica se alguém ganhou o round
let width = 500;
let height = 700;

// Paddle
let paddleHeight = 10;
let paddleWidth = 50;
let paddleDiff = 25;
let paddleX = [225, 225];
let trajectoryX = [0, 0];
let playerMoved = false;

// Bola
let ballX = 250;
let ballY = 350;
let ballRadius = 5;
let ballDirection = 1;

// Velocidade
let speedY = 2;
let speedX = 0;

// Ponto para os dois jogadores
let score1 = 0;
let score2 = 0;

// Criando elemento do Canvas
function createCanvas() {
  canvas.id = 'canvas';
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  renderCanvas();
}

// Esperando por oponentes
function renderIntro() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Texto da intro
  context.fillStyle = 'white';
  context.font = '32px Courier New';
  context.fillText('Esperando por oponente...', 20, canvas.height / 2 - 30);
}

// Renderiza tudo no Canvas
function renderCanvas() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Paddle Cor
  context.fillStyle = 'white';

  // Paddle de baixo
  context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

  // Paddle do topo
  context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

  // Linha do centro
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, 350);
  context.lineTo(500, 350);
  context.strokeStyle = 'grey';
  context.stroke();

  // Bola
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();

  // Ponto
  context.font = '32px Courier New';
  context.fillText(score1, 20, canvas.height / 2 + 50);
  context.fillText(score2, 20, canvas.height / 2 - 30);
}

// Reseta a bola para o centro
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedY = 3;
  socket.emit('ballMove', {
    ballX,
    ballY,
    score1,
    score2,
  });
}

// Ajusta o movimento da bola
function ballMove() {
  // Velocidade vertical
  ballY += speedY * ballDirection;
  // Velocidade horizontal
  if (playerMoved) {
    ballX += speedX;
  }
  socket.emit('ballMove', {
    ballX,
    ballY,
    score1,
    score2,
  });
}

// Determina quando a bola reabte, marca pontos, reseta a bola
function ballBoundaries() {
  // Rebate parade da esquerda
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Rebate parade da direita
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  // Rebate paddle (baixo)
  if (ballY > height - paddleDiff) {
    if (ballX >= paddleX[0] && ballX <= paddleX[0] + paddleWidth) {
      // Adiciona velocidade quando bate
      if (playerMoved) {
        speedY += 3;
        // Velocidade maxima
        if (speedY > 3) {
          speedY = 3;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[0] = ballX - (paddleX[0] + paddleDiff);
      speedX = trajectoryX[0] * 0.1;
    } else {
      // Reseta a Bola, adiciona o ponto
      ballReset();
      score2++;
    }
  }
  // Rebate paddle (topo)
  if (ballY < paddleDiff) {
    if (ballX >= paddleX[1] && ballX <= paddleX[1] + paddleWidth) {
      // Adiciona velocidade quando bate
      if (playerMoved) {
        speedY += 3;
        // Velocidade maxima
        if (speedY > 3) {
          speedY = 3;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[1] = ballX - (paddleX[1] + paddleDiff);
      speedX = trajectoryX[1] * 0.1;
    } else {
      ballReset();
      score1++;
    }
  }
  if (score1 >= 5 || score2 >= 5) {
    victory = true;
  }
}

// Chamado a cada quadro
function animate() {
  if (isReferee) {
    ballMove();
    ballBoundaries();
  }
  renderCanvas();
  if (victory == false && roundOver == false) {
    requestAnimationFrame(renderCanvas);
  } else if (victory == true) {
    ballReset();
    if (score1 > score2) {
      context.fillText('Voce venceu!', 20, canvas.height / 2 + 80);
      console.log(
        'O de baixo ganhou, parabéns agora volte para sua vida miserável =)'
      );
    } else {
      context.fillText('Voce venceu!', 20, canvas.height / 2 - 60);
      console.log(
        'O de cima ganhou, parabéns agora volte para sua vida miserável =)'
      );
    }
    roundOver = false;
  }

  window.requestAnimationFrame(animate);
}

// Carrega o jogo, Reseta Tudo
function loadGame() {
  createCanvas();
  renderIntro();
  socket.emit('ready');
}

function startGame() {
  paddleIndex = isReferee ? 0 : 1;
  window.requestAnimationFrame(animate);
  canvas.addEventListener('mousemove', (e) => {
    playerMoved = true;
    paddleX[paddleIndex] = e.offsetX;
    if (paddleX[paddleIndex] < 0) {
      paddleX[paddleIndex] = 0;
    }
    if (paddleX[paddleIndex] > width - paddleWidth) {
      paddleX[paddleIndex] = width - paddleWidth;
    }
    socket.emit('paddleMove', {
      xPosition: paddleX[paddleIndex],
    });
    // Esconde o Cursor
    canvas.style.cursor = 'none';
  });
}

// Carregando
loadGame();

socket.on('connect', () => {
  console.log('Connected as...', socket.id);
});

socket.on('startGame', (refereeId) => {
  console.log('Referee is', refereeId);

  isReferee = socket.id === refereeId;
  startGame();
});

socket.on('paddleMove', (paddleData) => {
  // Alterna 1 para 0, e 0 para 1
  const opponentPaddleIndex = 1 - paddleIndex;
  paddleX[opponentPaddleIndex] = paddleData.xPosition;
});

socket.on('ballMove', (ballData) => {
  ({ ballX, ballY, score1, score2 } = ballData);
});
