{Game} = require './Game'
{GameManager} = require './GameManager'
connect = require 'connect'

gameManager = new GameManager
idClientMap = {}

# create our HTTP server
app = connect.createServer(
	connect.compiler src: __dirname + '/client', enable: ['coffeescript']
	connect.static(__dirname + '/client')
	connect.errorHandler dumpExceptions: true, showStack: true
)

# changed for Heroku
port = process.env.PORT || 3000
app.listen port
console.log "Browse to http://localhost:#{port} to play"

# bind socket to HTTP server
io = require 'socket.io'
socket = io.listen app

socket.sockets.on 'connection', (client) ->
	assignToGame client
	client.on 'message', (message) -> handleMessage client, message
	client.on 'disconnect', -> 
		removeFromGame client

assignToGame = (client) ->
	idClientMap[client.id] = client
	game = gameManager.getNextAvailableGame()
	game.addPlayer client.id
	if game.isFull() then welcomePlayers(game)

removeFromGame = (client) ->
	delete idClientMap[client.id]	
	#remove player from game
	game = gameManager.getGameWithPlayer client
	game.removePlayer client.id 

	# remove timer and interval when player disconects and notify remaining player
	clearTimeout game.timer
	clearInterval game.interval
	for player in game.players
		idClientMap[player.id].send "opponentQuit: blank" if player.id 	

	# two players in games where opponent quit can be connected automatically
	gameManager.connectOrphanedPlayers(welcomePlayers)

# player loses turn if they take too long
startTimer = (currPlayer, otherPlayer) ->
	game = gameManager.getGameWithPlayer currPlayer
	
	# interval ticker for each second - fire before timer for safety's sake
	game.interval = setInterval ->
		idClientMap[currPlayer.id].send "tick:#{JSON.stringify('tock')}"
	, 1000
	# fire off first tick
	idClientMap[currPlayer.id].send "tick:#{JSON.stringify('tick')}"			

	# timer for turn
	game.timer = setTimeout ->		 
		idClientMap[currPlayer.id].send "timeIsUp: blank"
		idClientMap[otherPlayer.id].send "yourTurnNow: blank"	
		game.endTurn()
		resetTimer otherPlayer, currPlayer
		# clearInterval game.interval
		# startTimer otherPlayer, currPlayer	
	, Game.TURN_TIME

resetTimer = (currPlayer, otherPlayer) ->
	game = gameManager.getGameWithPlayer currPlayer
	clearTimeout game.timer
	clearInterval game.interval
	startTimer currPlayer, otherPlayer
		
welcomePlayers = (game) ->
	info = {players: game.players, tiles: game.grid.tiles
				 ,currPlayerNum: game.currPlayer.num
				 , newWords: getWords(game.dictionary.usedWords), turnTime: Game.TURN_TIME/1000}
	for player in game.players
		playerInfo = extend {}, info, {yourNum: player.num}
		idClientMap[player.id].send "welcome:#{JSON.stringify playerInfo}"
	
	# reset things just to be safe - could be an old game getting recycled
	resetTimer game.currPlayer, game.otherPlayer 
	
handleMessage = (client, message) ->
	{type, content} = typeAndContent message
	game = gameManager.getGameWithPlayer client
	if type is 'move'
		return unless client.id is game.currPlayer.id #no cheating
		swapCoordinates = JSON.parse content
		{moveScore, newWords} = game.currPlayer.makeMove swapCoordinates	
		result = {swapCoordinates, moveScore, player: game.currPlayer
						 , newWords: getWords(newWords)}
						
		# only send results to players, reset timer since move has been made
		for player in game.players
			idClientMap[player.id].send "moveResult:#{JSON.stringify result}"
		game.endTurn()
		resetTimer game.currPlayer, game.otherPlayer

getWords = (newWords) ->
  # gather used words	and defs - only send new ones
	wordsHtml = []
	defs = {}
	for word in newWords
		wordsHtml.push "<a href='#' class='uword'>#{word}</a>"
		defs[word] = gameManager.words[word]
	{wordsHtml: wordsHtml.join(", "), defs}
	
typeAndContent = (message) ->
	[ignore, type, content] = message.match /(.*?):(.*)/
	{type, content}

# adds props of arbitrary objs (others) to a
extend = (a, others...) ->
	for o in others
		a[key] = val for key, val of o
	a