(function() {
  var Game, GameManager, app, assignToGame, connect, extend, gameManager, getWords, handleMessage, idClientMap, io, port, removeFromGame, resetTimer, socket, startTimer, typeAndContent, welcomePlayers;
  var __slice = Array.prototype.slice;
  Game = require('./Game').Game;
  GameManager = require('./GameManager').GameManager;
  connect = require('connect');
  gameManager = new GameManager;
  idClientMap = {};
  app = connect.createServer(connect.compiler({
    src: __dirname + '/client',
    enable: ['coffeescript']
  }), connect.static(__dirname + '/client'), connect.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  port = process.env.PORT || 3000;
  app.listen(port);
  console.log("Browse to http://localhost:" + port + " to play");
  io = require('socket.io');
  socket = io.listen(app);
  socket.configure(function() {
    return socket.set("transports", ["xhr-polling", "flashsocket", "json-polling"]);
  });
  socket.sockets.on('connection', function(client) {
    assignToGame(client);
    client.on('message', function(message) {
      return handleMessage(client, message);
    });
    return client.on('disconnect', function() {
      return removeFromGame(client);
    });
  });
  assignToGame = function(client) {
    var game;
    idClientMap[client.id] = client;
    game = gameManager.getNextAvailableGame();
    game.addPlayer(client.id);
    if (game.isFull()) {
      return welcomePlayers(game);
    }
  };
  removeFromGame = function(client) {
    var game, player, _i, _len, _ref;
    delete idClientMap[client.id];
    game = gameManager.getGameWithPlayer(client);
    game.removePlayer(client.id);
    clearTimeout(game.timer);
    clearInterval(game.interval);
    _ref = game.players;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      player = _ref[_i];
      if (player.id) {
        idClientMap[player.id].send("opponentQuit: blank");
      }
    }
    return gameManager.connectOrphanedPlayers(welcomePlayers);
  };
  startTimer = function(currPlayer, otherPlayer) {
    var game;
    game = gameManager.getGameWithPlayer(currPlayer);
    game.interval = setInterval(function() {
      return idClientMap[currPlayer.id].send("tick:" + (JSON.stringify('tock')));
    }, 1000);
    idClientMap[currPlayer.id].send("tick:" + (JSON.stringify('tick')));
    return game.timer = setTimeout(function() {
      idClientMap[currPlayer.id].send("timeIsUp: blank");
      idClientMap[otherPlayer.id].send("yourTurnNow: blank");
      game.endTurn();
      return resetTimer(otherPlayer, currPlayer);
    }, Game.TURN_TIME);
  };
  resetTimer = function(currPlayer, otherPlayer) {
    var game;
    game = gameManager.getGameWithPlayer(currPlayer);
    clearTimeout(game.timer);
    clearInterval(game.interval);
    return startTimer(currPlayer, otherPlayer);
  };
  welcomePlayers = function(game) {
    var info, player, playerInfo, _i, _len, _ref;
    info = {
      players: game.players,
      tiles: game.grid.tiles,
      currPlayerNum: game.currPlayer.num,
      newWords: getWords(game.dictionary.usedWords),
      turnTime: Game.TURN_TIME / 1000
    };
    _ref = game.players;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      player = _ref[_i];
      playerInfo = extend({}, info, {
        yourNum: player.num
      });
      idClientMap[player.id].send("welcome:" + (JSON.stringify(playerInfo)));
    }
    return resetTimer(game.currPlayer, game.otherPlayer);
  };
  handleMessage = function(client, message) {
    var content, game, moveScore, newWords, player, result, swapCoordinates, type, _i, _len, _ref, _ref2, _ref3;
    _ref = typeAndContent(message), type = _ref.type, content = _ref.content;
    game = gameManager.getGameWithPlayer(client);
    if (type === 'move') {
      if (client.id !== game.currPlayer.id) {
        return;
      }
      swapCoordinates = JSON.parse(content);
      _ref2 = game.currPlayer.makeMove(swapCoordinates), moveScore = _ref2.moveScore, newWords = _ref2.newWords;
      result = {
        swapCoordinates: swapCoordinates,
        moveScore: moveScore,
        player: game.currPlayer,
        newWords: getWords(newWords)
      };
      _ref3 = game.players;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        player = _ref3[_i];
        idClientMap[player.id].send("moveResult:" + (JSON.stringify(result)));
      }
      game.endTurn();
      return resetTimer(game.currPlayer, game.otherPlayer);
    }
  };
  getWords = function(newWords) {
    var defs, word, wordsHtml, _i, _len;
    wordsHtml = [];
    defs = {};
    for (_i = 0, _len = newWords.length; _i < _len; _i++) {
      word = newWords[_i];
      wordsHtml.push("<a href='#' class='uword'>" + word + "</a>");
      defs[word] = gameManager.words[word];
    }
    return {
      wordsHtml: wordsHtml.join(", "),
      defs: defs
    };
  };
  typeAndContent = function(message) {
    var content, ignore, type, _ref;
    _ref = message.match(/(.*?):(.*)/), ignore = _ref[0], type = _ref[1], content = _ref[2];
    return {
      type: type,
      content: content
    };
  };
  extend = function() {
    var a, key, o, others, val, _i, _len;
    a = arguments[0], others = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = others.length; _i < _len; _i++) {
      o = others[_i];
      for (key in o) {
        val = o[key];
        a[key] = val;
      }
    }
    return a;
  };
}).call(this);
