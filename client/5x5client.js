(function() {
  var drawTiles, endTurn, getPlayerName, handleMessage, myNum, myTurn, selectedCoordinates, showMessage, showMoveResult, showNotice, showThenFade, socket, startGame, startTurn, swapTiles, tileClick, tiles, toArray, turnTime, typeAndContent, updateUsedWords, usedWords;
  socket = tiles = selectedCoordinates = myNum = myTurn = usedWords = turnTime = null;
  startTurn = function(forced) {
    if (forced == null) {
      forced = false;
    }
    myTurn = true;
    if (forced === false) {
      return showMessage('firstTile');
    } else {
      return showMessage('yourTurnNow');
    }
  };
  endTurn = function(forced) {
    if (forced == null) {
      forced = false;
    }
    selectedCoordinates = null;
    myTurn = false;
    if (forced === false) {
      return showMessage('waitForMove');
    } else {
      return showMessage('timeIsUp');
    }
  };
  drawTiles = function(x1, y1, x2, y2) {
    var gridHtml, x, y, _ref, _ref2;
    gridHtml = '';
    for (x = 0, _ref = tiles.length; 0 <= _ref ? x < _ref : x > _ref; 0 <= _ref ? x++ : x--) {
      gridHtml += '<ul>';
      for (y = 0, _ref2 = tiles.length; 0 <= _ref2 ? y < _ref2 : y > _ref2; 0 <= _ref2 ? y++ : y--) {
        gridHtml += "<li id='tile" + x + "_" + y + "'>" + tiles[x][y] + "</li>";
      }
      gridHtml += '</ul>';
    }
    return $('#grid').html(gridHtml).find("li#tile" + x1 + "_" + y1).add("li#tile" + x2 + "_" + y2).effect("highlight", {
      color: "#eb4"
    }, 5500);
  };
  showMessage = function(messageType) {
    var messageHtml;
    switch (messageType) {
      case 'waitForConnection':
        messageHtml = "Waiting for another player to connect to the server...";
        $('#usedwords, #grid, #scores').hide();
        break;
      case 'waitForMove':
        messageHtml = "Waiting for the other player to make a move...";
        break;
      case 'firstTile':
        messageHtml = "Please select your first tile.";
        break;
      case 'secondTile':
        messageHtml = "Please select a second tile.";
        break;
      case 'timeIsUp':
        messageHtml = "You lost your turn because you took too long.";
        break;
      case 'yourTurnNow':
        messageHtml = "Your turn because your opponent took too long.";
        break;
      case 'opponentQuit':
        messageHtml = "Opponent quit. Waiting for another play to connect...";
        $('#usedwords, #grid, #scores').hide();
    }
    return $('#message').html(messageHtml);
  };
  tileClick = function() {
    var $this, x, y, _ref;
    if (!myTurn) {
      return;
    }
    $this = $(this);
    if ($this.hasClass('selected')) {
      selectedCoordinates = null;
      $this.removeClass('selected');
      return showMessage('firstTile');
    } else {
      _ref = this.id.match(/(\d+)_(\d+)/).slice(1), x = _ref[0], y = _ref[1];
      if (selectedCoordinates === null) {
        selectedCoordinates = {
          x1: x,
          y1: y
        };
        $this.addClass('selected');
        return showMessage('secondTile');
      } else {
        selectedCoordinates.x2 = x;
        selectedCoordinates.y2 = y;
        socket.send("move:" + (JSON.stringify(selectedCoordinates)));
        return endTurn();
      }
    }
  };
  swapTiles = function(_arg) {
    var x1, x2, y1, y2, _ref;
    x1 = _arg.x1, y1 = _arg.y1, x2 = _arg.x2, y2 = _arg.y2;
    _ref = [tiles[x2][y2], tiles[x1][y1]], tiles[x1][y1] = _ref[0], tiles[x2][y2] = _ref[1];
    return drawTiles(x1, y1, x2, y2);
  };
  updateUsedWords = function(newWords) {
    var _ref;
    if (Object.keys(usedWords).length === 0) {
      _ref = [newWords.wordsHtml, newWords.defs], usedWords.wordsHtml = _ref[0], usedWords.defs = _ref[1];
    } else if (newWords.wordsHtml.length > 0) {
      usedWords.wordsHtml = usedWords.wordsHtml.concat(", " + newWords.wordsHtml);
      usedWords.defs = $.extend(usedWords.defs, newWords.defs);
    }
    $('#uwords').html(usedWords.wordsHtml);
    return $('a').hover(function() {
      return $('#udefinition').html(usedWords.defs[$(this).html()]);
    });
  };
  handleMessage = function(message) {
    var content, currPlayerNum, moveScore, newWords, player, players, swapCoordinates, tick, type, _ref, _ref2, _ref3;
    _ref = typeAndContent(message), type = _ref.type, content = _ref.content;
    switch (type) {
      case 'welcome':
        _ref2 = JSON.parse(content), players = _ref2.players, currPlayerNum = _ref2.currPlayerNum, tiles = _ref2.tiles, myNum = _ref2.yourNum, newWords = _ref2.newWords, turnTime = _ref2.turnTime;
        startGame(players, currPlayerNum);
        $('#usedwords, #grid, #scores').show();
        $('#uwords').html("");
        usedWords = {};
        return updateUsedWords(newWords);
      case 'moveResult':
        _ref3 = JSON.parse(content), player = _ref3.player, swapCoordinates = _ref3.swapCoordinates, moveScore = _ref3.moveScore, newWords = _ref3.newWords;
        showMoveResult(player, swapCoordinates, moveScore, newWords);
        return updateUsedWords(newWords);
      case 'opponentQuit':
        return showMessage('opponentQuit');
      case 'timeIsUp':
        return endTurn(true);
      case 'yourTurnNow':
        return startTurn(true);
      case 'tick':
        tick = JSON.parse(content);
        if (tick === "tick") {
          return $('#timer').html(turnTime);
        } else {
          return $('#timer').html(parseInt($('#timer').html()) - 1);
        }
    }
  };
  typeAndContent = function(message) {
    var content, ignore, type, _ref;
    _ref = message.match(/(.*?):(.*)/), ignore = _ref[0], type = _ref[1], content = _ref[2];
    return {
      type: type,
      content: content
    };
  };
  getPlayerName = function(player) {
    var name;
    name = null;
    if (player.num === myNum) {
      return name = "You";
    } else {
      return name = "Opponent";
    }
  };
  toArray = function(newWords) {
    var key, value, words, _ref;
    words = [];
    _ref = newWords.defs;
    for (key in _ref) {
      value = _ref[key];
      words.push(key);
    }
    return words;
  };
  showNotice = function(moveScore, newWords, player) {
    var $notice, words;
    words = toArray(newWords);
    $notice = $("<p class='notice'></p>");
    if (moveScore === 0) {
      $notice.html("" + (getPlayerName(player)) + " formed no words this turn.");
    } else {
      $notice.html(" \n" + (getPlayerName(player)) + " formed the following " + words.length + " word(s):<br /> \n<b>" + (words.join(', ')) + "</b><br /> \nearning <b>" + (moveScore / words.length) + "x" + words.length + "\n= " + moveScore + "</b> points!");
    }
    return showThenFade($notice);
  };
  showThenFade = function($elem) {
    $elem.insertAfter($('#grid'));
    return $elem.effect("highlight", {
      color: "#eb4"
    }, 5500, function() {
      return $elem.remove();
    });
  };
  startGame = function(players, currPlayerNum) {
    var player, _i, _len;
    for (_i = 0, _len = players.length; _i < _len; _i++) {
      player = players[_i];
      $("#p" + player.num + "name").html(getPlayerName(player));
      $("#p" + player.num + "score").html(player.score);
    }
    drawTiles();
    if (myNum === currPlayerNum) {
      return startTurn();
    } else {
      return endTurn();
    }
  };
  showMoveResult = function(player, swapCoordinates, moveScore, newWords) {
    $("#p" + player.num + "score").html(player.score);
    showNotice(moveScore, newWords, player);
    swapTiles(swapCoordinates);
    if (player.num !== myNum) {
      return startTurn();
    }
  };
  $(document).ready(function() {
    $('#grid li').live('click', tileClick);
    socket = io.connect();
    socket.on('connect', function() {
      return showMessage('waitForConnection');
    });
    return socket.on('message', handleMessage);
  });
}).call(this);
