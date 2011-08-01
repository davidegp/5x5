(function() {
  var Dictionary, Game, Grid, Player, Words, root;
  Dictionary = require('./Dictionary').Dictionary;
  Grid = require('./Grid').Grid;
  Words = require('./OWL2').Words;
  Player = require('./Player').Player;
  Game = (function() {
    Game.TURN_TIME = 30000;
    function Game() {
      this.grid = new Grid;
      this.dictionary = new Dictionary(Words, this.grid);
      this.currPlayer = this.player1 = new Player(1, 'Player 1', this.dictionary);
      this.player2 = this.otherPlayer = new Player(2, 'Player 2', this.dictionary);
      this.player1.id = this.player2.id = null;
      this.players = [this.player1, this.player2];
      this.wasPlayed = false;
      this.timer = this.interval = null;
    }
    Game.prototype.reset = function() {
      var player, _i, _len, _ref;
      _ref = this.players;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        player.score = 0;
      }
      return this.dictionary.setGrid(this.grid);
    };
    Game.prototype.addPlayer = function(sessionId) {
      if (!this.player1.id) {
        return this.player1.id = sessionId;
      } else {
        return this.player2.id = sessionId;
      }
    };
    Game.prototype.removePlayer = function(sessionId) {
      return this.playerWithId(sessionId).id = null;
    };
    Game.prototype.isFull = function() {
      if (this.player1.id && this.player2.id) {
        return true;
      } else {
        return false;
      }
    };
    Game.prototype.playerWithId = function(sessionId) {
      if (sessionId === this.player1.id) {
        return this.player1;
      } else if (sessionId === this.player2.id) {
        return this.player2;
      }
    };
    Game.prototype.endTurn = function() {
      var _ref, _ref2;
      this.wasPlayed = true;
      if (this.currPlayer === this.player1) {
        return _ref = [this.player2, this.player1], this.currPlayer = _ref[0], this.otherPlayer = _ref[1], _ref;
      } else {
        return _ref2 = [this.player1, this.player2], this.currPlayer = _ref2[0], this.otherPlayer = _ref2[1], _ref2;
      }
    };
    return Game;
  })();
  root = typeof exports !== "undefined" && exports !== null ? exports : window;
  root.Game = Game;
}).call(this);
