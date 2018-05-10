App = function()
{
    var ship;
    var lastFireTime = 0;
    var fireRate = 5;
    var nextEnemy;
    var enemyDelay;
    var activeBullets = [];
    var scoreCounter;
    var score;

    this.load = function()
    {
        wade.loadImage('images/spaceship.png');
        wade.loadImage('images/bullet.png');
        wade.loadImage('images/enemyBullet.png');
        wade.loadImage('images/alien.png');
        wade.loadImage('images/boom.png');
        wade.loadImage('images/asteroid.png');
    };

    this.init  = function()
    {
        wade.setMinScreenSize(708, 398);
        wade.setMaxScreenSize(708, 398);

        var backSprite = new Sprite(0, 11);
        backSprite.setSize(wade.getScreenWidth(), wade.getScreenHeight());
        backSprite.setDrawFunction(wade.drawFunctions.solidFill_('black'));
        var backObject = new SceneObject(backSprite);
        wade.addSceneObject(backObject);

        for (var i=0; i<15; i++)
        {
            var size = Math.random() * 8 + 8;
            var rotation = Math.random() * 6.28;
            var posX = (Math.random() - 0.5) * wade.getScreenWidth();
            var posY = (Math.random() - 0.5) * wade.getScreenHeight();
            var asteroidSprite = new Sprite('images/asteroid.png', 10);
            asteroidSprite.setSize(size, size);
            var asteroid = new SceneObject(asteroidSprite, 0, posX, posY);
            asteroid.setRotation(rotation);
            wade.addSceneObject(asteroid);
            asteroid.moveTo(posX, wade.getScreenHeight() / 2 + size / 2, 20);
            asteroid.onMoveComplete = function()
            {
                var size = this.getSprite().getSize().y;
                var posX = (Math.random() - 0.5) * wade.getScreenWidth();
                this.setPosition(posX, -wade.getScreenHeight() / 2 - size / 2);
                this.moveTo(posX, wade.getScreenHeight() / 2 + size / 2, 20);
            };
        }

        var shooterData = wade.retrieveLocalObject('shooterData');
        var highScore = (shooterData && shooterData.highScore) || 0;

        var clickText = new TextSprite('Click or tap to start', '32px Verdana', 'white', 'center');
        clickText.setDrawFunction(wade.drawFunctions.blink_(0.5, 0.5, clickText.draw));
        var clickToStart = new SceneObject(clickText);
        clickToStart.addSprite(new TextSprite('Your best score is ' + highScore, '18px Verdana', 'yellow', 'center'), {y: 30});
        wade.addSceneObject(clickToStart);
        wade.app.onMouseDown = function()
        {
            wade.removeSceneObject(clickToStart);
            wade.app.startGame();
            wade.app.onMouseDown = 0;
        };
    };

    this.startGame = function()
    {
        var sprite = new Sprite('images/spaceship.png');
        var mousePosition = wade.getMousePosition();
        ship = new SceneObject(sprite, 0, mousePosition.x, mousePosition.y);
        wade.addSceneObject(ship);

        wade.setMainLoopCallback(function()
        {
            var nextFireTime = lastFireTime + 1 / fireRate;
            var time = wade.getAppTime();
            if (wade.isMouseDown() && time >= nextFireTime)
            {
                lastFireTime = time;
                var shipPosition = ship.getPosition();
                var shipSize = ship.getSprite().getSize();
                var sprite = new Sprite('images/bullet.png');
                var bullet = new SceneObject(sprite, 0, shipPosition.x, shipPosition.y - shipSize.y / 2);
                wade.addSceneObject(bullet);
                activeBullets.push(bullet);
                bullet.moveTo(shipPosition.x, -500, 600);
                bullet.onMoveComplete = function()
                {
                    wade.removeSceneObject(this);
                    wade.removeObjectFromArray(this, activeBullets);
                };
            }

            for (var i=activeBullets.length-1; i>=0; i--)
            {
                var colliders = activeBullets[i].getOverlappingObjects();
                for (var j=0; j<colliders.length; j++)
                {
                    if (colliders[j].isEnemy)
                    {
                        var position = colliders[j].getPosition();
                        wade.app.explosion(position);

                        score += 10;
                        scoreCounter.getSprite().setText(score);

                        wade.removeSceneObject(colliders[j]);
                        wade.removeSceneObject(activeBullets[i]);
                        wade.removeObjectFromArrayByIndex(i, activeBullets);
                        break;
                    }
                }
            }
        }, 'fire');

        wade.setMainLoopCallback(function()
        {
            var overlapping = ship.getOverlappingObjects();
            for (var i=0; i<overlapping.length; i++)
            {
                if (overlapping[i].isEnemy || overlapping[i].isEnemyBullet)
                {
                    wade.app.explosion(ship.getPosition());
                    wade.removeSceneObject(ship);
                    wade.setMainLoopCallback(null, 'fire');
                    wade.setMainLoopCallback(null, 'die');

                    var shooterData = wade.retrieveLocalObject('shooterData');
                    var highScore = (shooterData && shooterData.highScore) || 0;
                    if (score > highScore)
                    {
                        shooterData = {highScore: score};
                        wade.storeLocalObject('shooterData', shooterData);
                    }

                    setTimeout(function()
                    {
                        wade.clearScene();
                        wade.app.init();
                        clearTimeout(nextEnemy);
                    }, 2000);
                }
            }
        }, 'die');

        score = 0;
        var scoreSprite = new TextSprite(score.toString(), '32px Verdana', '#f88', 'right');
        scoreCounter = new SceneObject(scoreSprite, 0, wade.getScreenWidth() / 2 - 10, -wade.getScreenHeight() / 2 + 30);
        wade.addSceneObject(scoreCounter);

        enemyDelay = 2000;
        nextEnemy = setTimeout(wade.app.spawnEnemy, enemyDelay);
    };

    this.onMouseMove = function(eventData)
    {
        ship && ship.setPosition(eventData.screenPosition.x, eventData.screenPosition.y);
    };

    this.explosion = function(position)
    {
        var animation = new Animation('images/boom.png', 6, 4, 30);
        var explosionSprite = new Sprite();
        explosionSprite.setSize(100, 100);
        explosionSprite.addAnimation('boom', animation);
        var explosion = new SceneObject(explosionSprite, 0, position.x, position.y);
        wade.addSceneObject(explosion);
        explosion.playAnimation('boom');
        explosion.onAnimationEnd = function()
        {
            wade.removeSceneObject(this);
        };
    };

    this.spawnEnemy = function()
    {
        var sprite = new Sprite('images/alien.png');

        var startX = (Math.random() - 0.5) * wade.getScreenWidth();
        var endX = (Math.random() - 0.5) * wade.getScreenWidth();
        var startY = -wade.getScreenHeight() / 2 - sprite.getSize().y / 2;
        var endY = -startY;

        var enemy = new SceneObject(sprite, 0, startX, startY);
        wade.addSceneObject(enemy);
        enemy.moveTo(endX, endY, 200);
        enemy.isEnemy = true;

        enemy.onMoveComplete = function()
        {
            wade.removeSceneObject(this);
        };

        enemy.originalStep = enemy.step;
        enemy.step = function()
        {
            this.originalStep();
            var enemyPosition = this.getPosition();
            var playerPosition = ship.getPosition();
            var angle = Math.atan2(playerPosition.y - enemyPosition.y, playerPosition.x - enemyPosition.x) - 3.14 / 2;
            this.setRotation(angle);
        };

        enemy.fire = function()
        {
            var enemySize = this.getSprite().getSize();
            var enemyPosition = this.getPosition();
            var playerPosition = ship.getPosition();

            var dx = playerPosition.x - enemyPosition.x;
            var dy = playerPosition.y - enemyPosition.y;
            var length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            var startX = enemyPosition.x + dx * enemySize.x / 2;
            var startY = enemyPosition.y + dy * enemySize.y / 2;
            var endX = startX + dx * 3000;
            var endY = startY + dy * 3000;

            var sprite = new Sprite('images/enemyBullet.png');
            var bullet = new SceneObject(sprite, 0, startX, startY);
            bullet.isEnemyBullet = true;
            wade.addSceneObject(bullet);
            bullet.moveTo(endX, endY, 200);

            bullet.onMoveComplete = function()
            {
                wade.removeSceneObject(this);
            };

            this.schedule(1000, 'fire');
        };
        enemy.schedule(500, 'fire');

        nextEnemy = setTimeout(wade.app.spawnEnemy, enemyDelay);
        enemyDelay = Math.max(enemyDelay - 30, 200);
    };
};
