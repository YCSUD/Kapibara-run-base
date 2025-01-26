document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const highScoreElement = document.getElementById('highScore');

    // Загрузка лучшего счета из localStorage
    let highScore = localStorage.getItem('highScore') || 0;
    highScoreElement.textContent = highScore;

    // Начальные значения скорости
    let initialSpeedCapybar = 5;
    let initialGameSpeed = 3;

    let speedCapybar = initialSpeedCapybar; // Обычная скорость капибары
    let fastSpeed = 10; // Увеличенная скорость при нажатии кнопок
    let gameSpeed = initialGameSpeed; // Скорость игры

    // Capybara properties
    const capybara = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 70,
        width: 50,
        height: 50,
        speed: speedCapybar
    };

    // Obstacles and fruits arrays
    let obstacles = [];
    let fruits = [];
    let score = 0;
    let isPaused = false;
    let isGameRunning = false;

    // Track pressed keys
    let keys = {};
    let isMovingLeft = false;
    let isMovingRight = false;

    // Флаг для обратного управления
    let isReversedControls = false;

    // Флаг для режима испытаний
    let isChallengeMode = false;

    // Флаг для перемещения препятствий
    let isMovingObstacles = false;

    // Интервалы для генерации препятствий и фруктов
    let obstacleInterval;
    let fruitInterval;

    // Переменная для отслеживания последней сотни
    let lastHundred = -1;

    // Функция для запуска обычного интервала
    function startNormalObstacleGeneration() {
        if (obstacleInterval) {
            clearInterval(obstacleInterval);
        }
        obstacleInterval = setInterval(() => {
            if (!isPaused && isGameRunning) {
                generateObstacles();
            }
        }, 2000);
    }

    // Generate random obstacles
    function generateObstacles() {
        if (obstacles.length < 10) {
            const width = Math.random() * (canvas.width / 3);
            const x = Math.random() * (canvas.width - width);
            obstacles.push({ x, y: -50, width, height: 20 });
        }
    }

    // Generate random fruits
    function generateFruits() {
        const x = Math.random() * (canvas.width - 20);
        fruits.push({ x, y: -20, width: 20, height: 20 });
    }

    // Draw capybara
    function drawCapybara() {
        ctx.fillStyle = 'brown';
        ctx.fillRect(capybara.x, capybara.y, capybara.width, capybara.height);
    }

    // Draw obstacles and fruits
    function drawObstacles() {
        ctx.fillStyle = 'red';
        obstacles.forEach(obstacle => {
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
    }

    function drawFruits() {
        ctx.fillStyle = 'orange';
        fruits.forEach(fruit => {
            ctx.fillRect(fruit.x, fruit.y, fruit.width, fruit.height);
        });
    }

    // Update positions of obstacles and fruits
    function updateObstacles() {
        obstacles.forEach(obstacle => {
            obstacle.y += gameSpeed;
            if (isMovingObstacles) {
                obstacle.x += Math.sin(Date.now() / 200) * 2; // Движение влево и вправо
            }
        });
        obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);
    }

    function updateFruits() {
        fruits.forEach(fruit => {
            fruit.y += gameSpeed;
        });
        fruits = fruits.filter(fruit => fruit.y < canvas.height);
    }

    // Check for collisions
    function checkCollisions() {
        obstacles.forEach(obstacle => {
            if (capybara.x < obstacle.x + obstacle.width &&
                capybara.x + capybara.width > obstacle.x &&
                capybara.y < obstacle.y + obstacle.height &&
                capybara.height + capybara.y > obstacle.y) {
                saveScore(); // Сохраняем счет
                showGameOverMenu(); // Показываем окно при поражении
                isGameRunning = false; // Останавливаем игру
                resetGame(); // Сбрасываем игру
            }
        });
    
        fruits.forEach((fruit, index) => {
            if (capybara.x < fruit.x + fruit.width &&
                capybara.x + capybara.width > fruit.x &&
                capybara.y < fruit.y + fruit.height &&
                capybara.height + capybara.y > fruit.y) {
                score += 10;
                fruits.splice(index, 1);
            }
        });
    }

    // Display score
    function drawScore() {
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${score}`, 10, 30);
    }

    // Функция для сохранения счета
    function saveScore() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore); // Сохраняем лучший результат
            highScoreElement.textContent = highScore; // Обновляем отображение
        }
    }

    // Функция для активации обратного управления
    function activateReverseControls() {
        isReversedControls = true; // Включаем обратное управление
        setTimeout(() => {
            isReversedControls = false; // Отключаем через 15 секунд
        }, 15000); // 15 секунд
    }

    // Функция для активации перемещения препятствий
    function activateMovingObstacles() {
        isMovingObstacles = true; // Включаем перемещение препятствий
        setTimeout(() => {
            isMovingObstacles = false; // Отключаем через 20 секунд
        }, 20000); // 20 секунд
    }

    // Увеличение скорости игры и активация испытаний каждые 100 очков
    function increaseSpeed() {
        const currentHundred = Math.floor(score / 100); // Текущая сотня
        if (currentHundred > lastHundred) { // Если перешли на новую сотню
            gameSpeed += 2; // Увеличиваем скорость игры на 2
            speedCapybar += 2; // Увеличиваем скорость капибары на 2
            lastHundred = currentHundred; // Обновляем последнюю сотню
    
            if (isChallengeMode) {
                // Активируем обратное управление с шансом 50%
                if (Math.random() < 0.5) {
                    activateReverseControls();
                }
    
                // Активируем перемещение препятствий с шансом 50%
                if (Math.random() < 0.5) {
                    activateMovingObstacles();
                }
            }
        }
    }

    // Start the game in normal mode
    document.getElementById('normalModeBtn').addEventListener('click', () => {
        if (!isGameRunning) {
            isChallengeMode = false; // Обычный режим
            resetGame();
            hideMainMenu();
            isGameRunning = true;
            gameLoop();
        }
    });

    // Start the game in challenge mode
    document.getElementById('challengeModeBtn').addEventListener('click', () => {
        if (!isGameRunning) {
            isChallengeMode = true; // Режим испытаний
            resetGame();
            hideMainMenu();
            isGameRunning = true;
            gameLoop();
        }
    });

    // Reset game state
    function resetGame() {
        obstacles = [];
        fruits = [];
        score = 0;
        gameSpeed = initialGameSpeed; // Сбрасываем скорость игры
        speedCapybar = initialSpeedCapybar; // Сбрасываем скорость капибары
        capybara.x = canvas.width / 2 - 25;
        capybara.y = canvas.height - 70;
        isPaused = false;
        isReversedControls = false;
        isMovingObstacles = false;
        lastHundred = 0;
    
        if (obstacleInterval) {
            clearInterval(obstacleInterval);
        }
        if (fruitInterval) {
            clearInterval(fruitInterval);
        }
    
        startNormalObstacleGeneration();
        fruitInterval = setInterval(() => {
            if (!isPaused && isGameRunning) {
                generateFruits();
            }
        }, 3000);
    }

    // Show main menu
    function showMainMenu() {
        document.getElementById('mainMenu').style.display = 'block';
        document.getElementById('gameCanvas').style.display = 'none';
        document.getElementById('mobileControls').style.display = 'none';
        document.getElementById('gameControls').style.display = 'none';
        document.getElementById('pauseMenu').style.display = 'none';
        isPaused = true;
        isGameRunning = false;
    }

    // Hide main menu
    function hideMainMenu() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'block';
        document.getElementById('mobileControls').style.display = 'block';
        document.getElementById('gameControls').style.display = 'block';
        isPaused = false;
    }

    function showGameOverMenu() {
        // Показываем окно
        document.getElementById('gameOverMenu').style.display = 'block';
    
        // Обновляем счет в окне
        document.getElementById('finalScore').textContent = score;
    }
    
    function hideGameOverMenu() {
        // Скрываем окно
        document.getElementById('gameOverMenu').style.display = 'none';
    }

    // Show pause menu
    function showPauseMenu() {
        document.getElementById('pauseMenu').style.display = 'block';
    }

    // Hide pause menu
    function hidePauseMenu() {
        document.getElementById('pauseMenu').style.display = 'none';
    }

    // Toggle pause state
    function togglePause() {
        isPaused = !isPaused;
        if (isPaused) {
            showPauseMenu();
        } else {
            hidePauseMenu();
        }
    }

    // Update game state
    function update() {
        if (!isPaused) {
            // Логика движения с учетом обратного управления
            if (keys['ArrowLeft'] || isMovingLeft) {
                if (isReversedControls) {
                    // Обратное управление: движение вправо
                    if (capybara.x < canvas.width - capybara.width) {
                        capybara.x += fastSpeed;
                    }
                } else {
                    // Нормальное управление: движение влево
                    if (capybara.x > 0) {
                        capybara.x -= fastSpeed;
                    }
                }
            }

            if (keys['ArrowRight'] || isMovingRight) {
                if (isReversedControls) {
                    // Обратное управление: движение влево
                    if (capybara.x > 0) {
                        capybara.x -= fastSpeed;
                    }
                } else {
                    // Нормальное управление: движение вправо
                    if (capybara.x < canvas.width - capybara.width) {
                        capybara.x += fastSpeed;
                    }
                }
            }

            updateObstacles();
            updateFruits();
            checkCollisions();
            increaseSpeed();
        }
    }

    // Main game loop
    function gameLoop() {
        if (!isGameRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!isPaused) {
            drawCapybara();
            drawObstacles();
            drawFruits();
            drawScore();
            update();
        }

        requestAnimationFrame(gameLoop);
    }

    // Mobile controls
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    leftBtn.addEventListener('touchstart', () => {
        isMovingLeft = true;
    });
    leftBtn.addEventListener('touchend', () => {
        isMovingLeft = false;
    });

    rightBtn.addEventListener('touchstart', () => {
        isMovingRight = true;
    });
    rightBtn.addEventListener('touchend', () => {
        isMovingRight = false;
    });

    pauseBtn.addEventListener('click', togglePause);

    // Return to main menu and reload the game
    document.getElementById('returnToMenuBtn').addEventListener('click', () => {
        showMainMenu();
    });

    // Resume game from pause menu
    document.getElementById('resumeGameBtn').addEventListener('click', () => {
        togglePause();
    });

    document.getElementById('restartGameBtn').addEventListener('click', () => {
        hideGameOverMenu(); // Скрываем окно
        resetGame(); // Сбрасываем игру
        isGameRunning = true; // Запускаем игру
        gameLoop(); // Запускаем игровой цикл
    });

    // Event listeners for key presses (keyboard)
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'Space') {
            togglePause();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        isMovingLeft = false;
        isMovingRight = false;
    });
});