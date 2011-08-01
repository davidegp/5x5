(function() {
  var Game, GameManager, root;
  Game = require("./Game").Game;
  GameManager = (function() {
    function GameManager() {
      this.games = [];
      this.words = null;
    }
    GameManager.prototype.getNextAvailableGame = function() {
      if (this.games.length === 0) {
        this.games.push(new Game);
        this.words = this.games[0].dictionary.originalWordList;
      } else if (this.games[this.games.length - 1].isFull()) {
        this.games.push(new Game);
      } else if (this.games[this.games.length - 1].wasPlayed === true) {
        this.games[this.games.length - 1].reset();
      }
      return this.games[this.games.length - 1];
    };
    GameManager.prototype.getGameWithPlayer = function(client) {
      var game, player, _i, _j, _len, _len2, _ref, _ref2, _results;
      _ref = this.games;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        game = _ref[_i];
        _ref2 = game.players;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          player = _ref2[_j];
          if (player.id === client.id) {
            return game;
          }
        }
      }
      return _results;
    };
    GameManager.prototype.numberOfPlayers = function(game) {
      var count, player, _i, _len, _ref;
      count = 0;
      _ref = game.players;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        if (player.id !== null) {
          count++;
        }
      }
      return count++;
    };
    GameManager.prototype.pruneEmptyGames = function() {
      var game, _i, _len, _ref, _results;
      _ref = this.games;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        game = _ref[_i];
        _results.push(this.numberOfPlayers(game) === 0 ? this.games.pop(game) : void 0);
      }
      return _results;
    };
    GameManager.prototype.connectOrphanedPlayers = function(callback) {
      var game, i, orphanedGames, player, playerToMove, _i, _j, _len, _len2, _len3, _ref, _ref2, _ref3, _ref4;
      this.pruneEmptyGames();
      orphanedGames = [];
      _ref = this.games;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        game = _ref[_i];
        if (this.numberOfPlayers(game) === 1) {
          orphanedGames.push(game);
        }
      }
      if (orphanedGames.length === 2) {
        _ref2 = orphanedGames[1].players;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          player = _ref2[_j];
          if (player.id !== null) {
            playerToMove = player;
          }
        }
        orphanedGames[0].addPlayer(playerToMove.id);
        _ref3 = orphanedGames[0];
        for (i = 0, _len3 = _ref3.length; i < _len3; i++) {
          player = _ref3[i];
          _ref4 = ["Player" + i, "" + i], player.name = _ref4[0], player.num = _ref4[1];
        }
        this.games.pop(orphanedGames[1]);
        orphanedGames[0].reset();
        return callback(orphanedGames[0]);
      }
    };
    return GameManager;
  })();
  root = typeof exports !== "undefined" && exports !== null ? exports : window;
  root.GameManager = GameManager;
}).call(this);
