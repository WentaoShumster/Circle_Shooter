const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
//Defining canvas size
canvas.width = innerWidth;
canvas.height = innerHeight;

//shows the score in the top left of the screen
const scoreEl = document.querySelector("#scoreEl");

//button in order to start the game
const startGameBtn = document.querySelector("#startGameBtn");

//div for the modal that was created
const modalEl = document.querySelector("#modalEl");

//<p> tag used to show the score within the modal above
const bigScoreEl = document.querySelector("#bigScoreEl");

//enemy spawn timing (in seconds)
const enemySpawntime = 1000 * 3

//defining the Player x and the y
let x = canvas.width / 2;
let y = canvas.height / 2;

//defining when the player moves the newX and newY
let newX;
let newY;

//friction of the particle explosion
const friction = 0.99;


//projectiles, enemies, particles arrays used for these
let projectiles = [];
let enemies = [];
let particles = [];
let animationId;
let score = 0;
let LEFT = false;
let RIGHT = false;
//list of classes
//player class how it is drawn within the canvas
class Player {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.lastKey
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
    }
    update() {
        this.draw();
        this.x = newX;
        this.y = newY;
    }
}

//player has to be defined here due to the class needing to be created
let player = new Player(x, y, 10, "white");

//projectile class which is what shoots from the player within the canvas
class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

//enemy class is the enemies flying towards you off the screen (same as projectiles)
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}
//particle class is when the enemies explode
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }
    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }
    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

//this function is used to restart the game and display the score
function init() {
    projectiles = [];
    enemies = [];
    particles = [];
    player = new Player(x, y, 10, "white");
    score = 0;
    scoreEl.innerHTML = score;
    bigScoreEl.innerHTML = score;
    let newX = canvas.width / 2
    let newY = canvas.height / 2
}

//this function is used to spawn the enemies in a 1 second interval and makes them random
function spawnEnemies() {
    setInterval(() => {
        //randomises the size
        const radius = Math.random() * (30 - 12) + 12;
        let x;
        let y;
        //this where the enemies from the edges of the screen
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
        //randomisation of colors
        const color = `hsl(${Math.random() * 360},50%, 50%)`;
        const angle = Math.atan2(newY - y, newX - x);
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle),
        };
        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, enemySpawntime)
}

//this is used to draw in the animations
function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = "rgba(0,0,0,0.1)";
    c.fillRect(0, 0, canvas.width, canvas.height);
    const playerSpeed = 0;
    player.draw()
    player.update()
        //this is how to 
    particles.forEach((particle, particleIndex) => {
        if (particle.alpha <= 0) {
            delete particles[particleIndex];
        } else particle.update();
    });

    projectiles.forEach((projectile, projectileIndex) => {
        projectile.update();

        //remove projectile from edges of the screen
        if (
            projectile.x - projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                delete projectiles[projectileIndex];
            }, 0);
        }

        //For when the game ends and the the enemy hits the player
        enemies.forEach((enemy, enemyIndex) => {
            enemy.update();
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist - enemy.radius - player.radius < 1) {
                cancelAnimationFrame(animationId);
                modalEl.style.display = "flex";
                bigScoreEl.innerHTML = score;
                x = canvas.width / 2
                y = canvas.height / 2;
            }

            projectiles.forEach((projectile, projectileIndex) => {
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
                //when projectiles enemy touch
                if (dist - enemy.radius - projectile.radius < 1) {
                    //creating explosions
                    for (let i = 0; i < enemy.radius * 2; i++) {
                        particles.push(
                            new Particle(
                                projectile.x,
                                projectile.y,
                                Math.random() * 2,
                                enemy.color, {
                                    x: (Math.random() - 0.5) * (Math.random() * 6),
                                    y: (Math.random() - 0.5) * (Math.random() * 6),
                                }
                            )
                        );
                    }

                    if (enemy.radius - 10 > 7) {
                        //increase score
                        scoreEl.innerHTML = score;
                        score += 100;
                        gsap.to(enemy, {
                            radius: (enemy.radius -= 10),
                        });
                        setTimeout(() => {
                            delete projectiles[projectileIndex];
                        }, 0);
                    } else {
                        //increase score
                        scoreEl.innerHTML = score;
                        score += 250;
                        setTimeout(() => {
                            delete enemies[enemyIndex];
                            enemy.update();
                            delete projectiles[projectileIndex];
                        }, 0);
                    }
                }
            });
        });
    });
    if (keys.ArrowUp.pressed && player.lastKey === 'ArrowUp') {
        newY = y += playerSpeed - 4
        player.update();
    }
    if (keys.ArrowDown.pressed && player.lastKey === 'ArrowDown') {
        newY = y += playerSpeed + 4
        player.update();
    }
    if (keys.ArrowRight.pressed && player.lastKey === 'ArrowRight') {
        newX = x += playerSpeed + 4
        player.update();
    }
    if (keys.ArrowLeft.pressed && player.lastKey === 'ArrowLeft') {
        newX = x += playerSpeed - 4
        player.update();
    }
}

// document.addEventListener("visibilitychange", function() {
//     if (document.visibilityState === 'visible') {
//         setInterval(() => { spawnEnemies(); }, 3000);
//         console.log("yes")
//     } else {
//         console.log("stopped")
//         return
//     }
// });
addEventListener("click", (event) => {
    const angle = Math.atan2(
        event.clientY - newY,
        event.clientX - newX
    );
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5,
    };
    projectiles.push(
        new Projectile(newX, newY, 5, "white", velocity)
    );

});

// addEventListener("keydown", keysPressed, false);
// addEventListener("keyup", keysReleased, false);



// var keys = [];

const keys = {
    ArrowLeft: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowUp: {
        pressed: false
    },
    ArrowDown: {
        pressed: false
    }
}

window.addEventListener('keydown', () => {
    switch (event.key) {
        case 'ArrowRight':
            keys.ArrowRight.pressed = true
            player.lastKey = 'ArrowRight'
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true
            player.lastKey = 'ArrowLeft'
            break
        case 'ArrowUp':
            keys.ArrowUp.pressed = true
            player.lastKey = 'ArrowUp'
            break
        case 'ArrowDown':
            keys.ArrowDown.pressed = true
            player.lastKey = 'ArrowDown'
            break
    }
})

window.addEventListener('keyup', () => {
    switch (event.key) {

        case 'ArrowRight':
            keys.ArrowRight.pressed = false
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false
            break
        case 'ArrowUp':
            keys.ArrowUp.pressed = false
            break
        case 'ArrowDown':
            keys.ArrowDown.pressed = false
            break
    }
})

//Old movement code
// function keysPressed(e) {
//     // store an entry for every key pressed
//     keys[e.keyCode] = true;

//     // left
//     if (keys[37]) {
//         newX = x -= playerSpeed;
//         player.update()
//     }

//     // right
//     if (keys[39]) {
//         newX = x += playerSpeed;
//         player.update()
//     }

//     // down
//     if (keys[38]) {
//         newY = y -= playerSpeed;
//         player.update()
//     }

//     // up
//     if (keys[40]) {
//         newY = y += playerSpeed;
//         player.update()
//     }

//     e.preventDefault();
// }

// function keysReleased(e) {
//     // mark keys that were released
//     keys[e.keyCode] = false;
// }


startGameBtn.addEventListener("click", () => {
    init();
    spawnEnemies();
    animate();
    modalEl.style.display = "none";
});