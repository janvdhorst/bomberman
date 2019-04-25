var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);

function Player(socket,name){
    this.socket = socket;
    this.name = name;
    this.top = 0;
    this.left = 0;
    this.direction = 0;
    this.cur_sprite = 0;
    this.bomb_range = 2;
}

function Bomb(b,r){
    this.timer = 2500;
    this.range = r;
    this.block = b;
}

function Explosion(b,r){
    this.timer = 1500;
    this.block = b;
    this.range = r;
}

function Powerup(block,type){
    this.block = block;
    this.type = type;
}

function Lobby(){
    this.players = new Array();
}

var lobby = new Lobby();

//GAME VARIABLES
function Game(){
    this.players = new Array();
    this.spawned = false;
    this.bombs = new Array();
    this.explosions = new Array();
    this.canSpawnPowerUp = new Array();
    this.powerups = new Array();
}
var games = new Array();
//--------------


//MAP
var fill = [1,1,3,3,3,1,3,1,1,3,3,3,3,3,1,1,1,
    1,2,3,2,3,2,3,2,1,2,1,2,3,2,1,2,1,
    3,1,3,3,3,3,3,3,1,3,1,3,3,3,1,3,3,
    3,2,3,2,3,2,3,2,1,2,3,2,3,2,3,2,3,
    3,3,3,3,1,1,3,3,3,1,3,3,1,3,3,1,3,
    1,2,3,2,3,2,3,2,3,2,3,2,1,2,3,2,1,
    3,1,1,3,1,3,1,3,1,3,3,3,3,3,3,3,3,
    3,2,3,2,3,2,1,2,3,2,3,2,3,2,3,2,3,
    1,3,1,1,1,3,3,1,3,3,3,3,1,1,3,3,3,
    1,2,3,2,3,2,3,2,3,2,1,2,3,2,1,2,1,
    1,1,1,3,3,1,3,3,1,3,3,3,1,1,3,1,1
];
//-------------

function playerJoin(socket,name){
    var found = false;
    for(i=0;i<lobby.players.length;i++){
        if(lobby.players[i].name == name){
            found = true;
            socket.send("nameinuse");
            break;
        }
        if(lobby.players[i].socket == socket){
            found = true;
            console.log("a Player tried to join twice");
            break;
        }
    }
    if(!found){
        var newPlayer = new Player(socket,name);
        for(i=0;i<lobby.players.length;i++){
            newPlayer.socket.send("newplayer#" + lobby.players[i].name);
        }
        lobby.players.push(newPlayer);
        console.log("someone joined. new Players: " + lobby.players.length);
        for(i=0;i<lobby.players.length;i++){
            lobby.players[i].socket.send("newplayer#" + name);
        }
    }
    
}

function runGame(gameP){
  var game;
  for(i=0;i<games.length;i++){
    if(games[i] == gameP){
      game = games[i];
    }
  }
  if(!game.spawned){
    for(i=0;i<game.players.length;i++){
      if(i==0){
        game.players[i].top = 0;
        game.players[i].left = 0;
      }
      if(i==1){
        game.players[i].top = 0;
        game.players[i].left = 1020;
      }
      if(i==2){
          game.players[i].top = 640;
          game.players[i].left = 0;
      }
    }
    game.spawned=true;
  }else{
    for(i=0;i<game.players.length;i++){
      for(j=0;j<game.players.length;j++){
        game.players[i].socket.send("position#" + game.players[j].name + "#" + game.players[j].left + "#" + game.players[j].top + "#" + game.players[j].direction + "#" + game.players[j].cur_sprite);
      }
    }
  }
  setTimeout(function(){runGame(game);},10);
}

function playerQuit(socket){
    for(i=0;i<lobby.players.length;i++){
        if(lobby.players[i].socket == socket){
            var name = lobby.players[i].name;
            lobby.players.splice(i,1);
            console.log("someone left. new Players: " + lobby.players.length);
            for(i=0;i<lobby.players.length;i++){
                lobby.players[i].socket.send("playerleft#" + name);
            }
            break;
        }
    }
}

function bombTimer(){
    for(g=0;g<games.length;g++){
        for(b=0;b<games[g].bombs.length;b++){
            if(games[g].bombs[b].timer == 0){
                //explode bomb
                var e = new Explosion(games[g].bombs[b].block, games[g].bombs[b].range);
                console.log("new explosion range " + games[g].bombs[b].range);
                games[g].explosions.push(e);
                games[g].bombs.splice(b,1);
            }else{
                games[g].bombs[b].timer -= 10;
            }
        }
    }
}

function explosionTimer(){
    for(g=0;g<games.length;g++){
        for(e=0;e<games[g].explosions.length;e++){
            var e_sprite;
            var ends = false;
            switch(true){
                //This is not done in a loop because it's still experimental.
                case (games[g].explosions[e].timer > 1450): e_sprite = 0; break;
                case (games[g].explosions[e].timer > 1410): e_sprite = 1; break;
                case (games[g].explosions[e].timer > 1370): e_sprite = 2; break;
                case (games[g].explosions[e].timer > 1330): e_sprite = 3; break;
                case (games[g].explosions[e].timer > 1290): e_sprite = 4; break;
                case (games[g].explosions[e].timer > 1250): e_sprite = 5; break;
                case (games[g].explosions[e].timer > 1210): e_sprite = 6; break;
                case (games[g].explosions[e].timer > 1170): e_sprite = 7; break;
                case (games[g].explosions[e].timer > 1130): e_sprite = 8; break;
                case (games[g].explosions[e].timer > 1090): e_sprite = 9; break;
                case (games[g].explosions[e].timer > 1050): e_sprite = 10; break;
                case (games[g].explosions[e].timer > 1010): e_sprite = 11; break;
                case (games[g].explosions[e].timer > 970): e_sprite = 12; break;
                case (games[g].explosions[e].timer > 930): e_sprite = 13; break;
                case (games[g].explosions[e].timer > 890): e_sprite = 14; break;
                case (games[g].explosions[e].timer > 850): e_sprite = 15; break;
                case (games[g].explosions[e].timer > 810): e_sprite = 16; break;
                case (games[g].explosions[e].timer > 770): e_sprite = 17; break;
                case (games[g].explosions[e].timer > 730): e_sprite = 18; break;
                case (games[g].explosions[e].timer > 690): e_sprite = 19; break;
                case (games[g].explosions[e].timer > 650): e_sprite = 20; break;
                case (games[g].explosions[e].timer > 610): e_sprite = 21; break;
                case (games[g].explosions[e].timer > 570): e_sprite = 22; break;
                case (games[g].explosions[e].timer > 530): e_sprite = 23; break;
                case (games[g].explosions[e].timer > 490): e_sprite = 24; break;
                case (games[g].explosions[e].timer > 450): e_sprite = 25; break;
                case (games[g].explosions[e].timer > 410): e_sprite = 26; break;
                case (games[g].explosions[e].timer > 370): e_sprite = 27; break;
                case (games[g].explosions[e].timer > 330): e_sprite = 28; break;
                case (games[g].explosions[e].timer > 290): e_sprite = 29; break;
                case (games[g].explosions[e].timer > 250): e_sprite = 30; break;
                case (games[g].explosions[e].timer > 210): e_sprite = 31; break;
                case (games[g].explosions[e].timer > 170): e_sprite = 32; break;
                case (games[g].explosions[e].timer > 140): e_sprite = 33; break;
                case (games[g].explosions[e].timer > 120): e_sprite = 34; break;
                case (games[g].explosions[e].timer > 100): e_sprite = 35; break;
                case (games[g].explosions[e].timer > 80): e_sprite = 36; break;
                case (games[g].explosions[e].timer > 60): e_sprite = 37; break;
                case (games[g].explosions[e].timer > 30): e_sprite = 38; break;
                case (games[g].explosions[e].timer == 0): 
                    //Explosion ends
                    ends = true;
                    for(p = 0; p<games[g].players.length;p++){
                        games[g].players[p].socket.send("good#" + games[g].explosions[e].block);
                    }
                    games[g].explosions.splice(e,1);
                break;
            }
            if(!ends){
                for(p = 0; p<games[g].players.length;p++){
                    games[g].players[p].socket.send("explosion#" + games[g].explosions[e].block + "#" + e_sprite + "#" + games[g].explosions[e].range);
                }
                games[g].explosions[e].timer -= 10;
            }
        }
    }
}

function processMessage(message,socket){
    var split = message.split("#");
    switch(split[0].toLowerCase()){
        case "join":
            playerJoin(socket, split[1]);
        break;
        case "quit":
            playerQuit(socket);
        break;
        case "updatesocket":
            for(i=0;i<games.length;i++){
              for(j=0;j<games[i].players.length;j++){
                if(games[i].players[j].name == split[1]){
                  games[i].players[j].socket = socket;
                  break;
                }
              }
            }
        break;
        case "ping":
            socket.send("pingback");
        break;
        case "spreadping":
            for(i=0;i<lobby.players.length;i++){
                if(lobby.players[i].name != split[1]){
                    lobby.players[i].socket.send("spreadping#" + split[1] + "#" + split[2]);
                }
            }
        break;
        case "start":
            if(lobby.players.length>1){
                var game = new Game();
                for(i=0;i<lobby.players.length;i++){
                    game.players.push(lobby.players[i]);
                }
                for(i=0;i<fill.length;i++){
                    if(fill[i] == 3){ game.canSpawnPowerUp[i] = 1; } else { game.canSpawnPowerUp[i] = 0; }
                }
                games.push(game);
                for(i=0;i<lobby.players.length;i++){
                    lobby.players[i].socket.send("opengame");
                }
                setTimeout(function(){runGame(game);},2000);
                setInterval(function(){bombTimer();},10);
                setInterval(function(){explosionTimer();},10);
            }else{
                socket.send("fehler#Es müssen mindestens 2 Spieler da sein");
            }
        break;
        case "gameid":
            var found = false;
            for(i=0;i<games.length;i++){
                for(j=0;j<games[i].players.length;j++){
                    if(games[i].players[j].name == split[1]){
                        socket.send("gameid#" + i);
                        found=true;
                        break;
                    }
                }
            }
            if(!found){
                socket.send("fehler#Kein Game gefunden");
            }
        break;
        case "spawn":
            for(i=0;i<games[split[1]].players.length;i++){
              if(games[split[1]].players[i].name == split[2]){
                games[split[1]].players[i].socket.send("spawn#" + games[split[1]].players[i].left + "#" + games[split[1]].players[i].top )
                break;
              }
            }
        break;
        case "addrange":
            for(p=0;p<games[split[1]].players.length;p++){
                if(games[split[1]].players[p].name == split[2]){
                    games[split[1]].players[p].bomb_range++;
                    break;
                }
            }
        break;
        case "position":
            if(games.length==0){
                socket.send("fehler#fehler");
                break;
            }
            for(i=0;i<games[split[1]].players.length;i++){
              if(games[split[1]].players[i].name == split[2]){
                games[split[1]].players[i].left = split[3];
                games[split[1]].players[i].top = split[4];
                games[split[1]].players[i].direction = split[5];
                games[split[1]].players[i].cur_sprite = split[6];
                break;
              }
            }
        break;
        case "bomb":
            //gameid, block, username
            var range = 0;
            for(p=0;p<games[split[1]].players.length;p++){
                if(games[split[1]].players[p].name == split[3]){
                    range = games[split[1]].players[p].bomb_range;
                    break;
                }
            }
            var b = new Bomb(split[2], range);
            games[split[1]].bombs.push(b);
            for(i=0;i<games[split[1]].players.length;i++){
                games[split[1]].players[i].socket.send("bomb#" + split[2]);
            }
        break;
        case "dead":
            for(p=0;p<games[split[1]].players.length;p++){
                if(games[split[1]].players[p].name == split[2]){
                    games[split[1]].players[p].socket.send("fehler#u ded");
                    games[split[1]].players.splice(p,1);
                    for(x=0;x<games[split[1]].players.length;x++){
                        games[split[1]].players[x].socket.send("dead#" + split[2]);
                    }
                    if(games[split[1]].players.length == 1){
                        games[split[1]].players[0].socket.send("fehler#you win");
                    }
                    break;
                }
            }
        break;
        case "destroyed":
                var random = Math.floor((Math.random() * 100) + 1);
                if(games[split[1]].canSpawnPowerUp[split[2]] == 1){
                    console.log("can spawn");
                    if(random <= 35){
                        console.log("spawning");
                        //powerup spawning
                        random = Math.floor((Math.random() * 100) + 1);
                        var x;
                        if(random<40){
                            x = new Powerup(split[2], "bombplus");
                        }else if(random>=40 && random <80){
                           x = new Powerup(split[2], "rangeplus");
                        }else{
                            x = new Powerup(split[2], "ghost");
                        }
                        games[split[1]].powerups.push(x);
                        games[split[1]].canSpawnPowerUp[split[2]] = 0;
                        for(p=0;p<games[split[1]].players.length;p++){
                            games[split[1]].players[p].socket.send("powerup#" + split[2] + "#" + x.type);
                        }
                    }else{
                        console.log("unlucky");
                        //nothing spawning
                        games[split[1]].canSpawnPowerUp[split[2]] = 0;
                    }
                }else{
                }
        break;
        case "pickedup":
            for(p=0;p<games[split[1]].powerups.length;p++){
                if(games[split[1]].powerups[p].block == split[2]){
                    games[split[1]].powerups.splice(p,1);
                    for(l=0;l<games[split[1]].players.length;l++){
                        games[split[1]].players[l].socket.send("pickedup#" + split[2]);
                    }
                    break;
                }
            }
        break;
    }
}
app.use(express.static('static'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/game', function(req,res){
    res.sendFile(__dirname + '/test.html');
})

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
        playerQuit(socket);
    })
    socket.on('message', function (message) {
        processMessage(message,socket);
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

