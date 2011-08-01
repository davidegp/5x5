socket = tiles = selectedCoordinates = myNum = myTurn = usedWords = turnTime = null

# forced = true when last turn ended because a player took too long
startTurn = (forced = false) ->
	myTurn = true
	if forced is false then showMessage 'firstTile' else showMessage 'yourTurnNow'

endTurn = (forced = false) ->
	selectedCoordinates = null
	myTurn = false
	if forced is false then showMessage 'waitForMove' else showMessage 'timeIsUp'

drawTiles = (x1, y1, x2, y2) ->
	gridHtml = ''
	for x in [0...tiles.length]
		gridHtml += '<ul>'
		for y in [0...tiles.length]
	  	gridHtml += "<li id='tile#{x}_#{y}'>#{tiles[x][y]}</li>"
		gridHtml += '</ul>'
	# draw the grid and highlight the recently swapped tiles
	$('#grid').html(gridHtml)
		.find("li#tile#{x1}_#{y1}").add("li#tile#{x2}_#{y2}")
		.effect("highlight", color: "#eb4", 5500)
		
showMessage = (messageType) ->
	switch messageType
		when 'waitForConnection'
			messageHtml = "Waiting for another player to connect to the server..."
			$('#usedwords, #grid, #scores').hide()
		when 'waitForMove'
			messageHtml = "Waiting for the other player to make a move..."
		when 'firstTile'
			messageHtml = "Please select your first tile."
		when 'secondTile'
			messageHtml = "Please select a second tile."
		when 'timeIsUp'
			messageHtml = "You lost your turn because you took too long."
		when 'yourTurnNow'
			messageHtml = "Your turn because your opponent took too long."
		when 'opponentQuit'
			messageHtml = "Opponent quit. Waiting for another play to connect..."
			$('#usedwords, #grid, #scores').hide()
	$('#message').html messageHtml
	
tileClick = ->
	return unless myTurn
	$this = $(this)
	if $this.hasClass 'selected'
		# undo
		selectedCoordinates = null
		$this.removeClass 'selected'
		showMessage 'firstTile'
	else
		[x, y] = @id.match(/(\d+)_(\d+)/)[1..]

		if selectedCoordinates is null
			selectedCoordinates = {x1: x, y1: y}
			$this.addClass 'selected'
			showMessage 'secondTile'
		else
			selectedCoordinates.x2 = x
			selectedCoordinates.y2 = y
			socket.send "move:#{JSON.stringify selectedCoordinates}"
			endTurn()

swapTiles = ({x1, y1, x2, y2}) ->
	[tiles[x1][y1], tiles[x2][y2]] = [tiles[x2][y2], tiles[x1][y1]]
	drawTiles(x1, y1, x2, y2)
	
updateUsedWords = (newWords) ->
	# if no usedwords, initialize with new words
	if Object.keys(usedWords).length is 0
		[usedWords.wordsHtml, usedWords.defs] = [newWords.wordsHtml, newWords.defs]
	# otherwise only update usedWords if there are newWords formed during move
	else if newWords.wordsHtml.length > 0
		usedWords.wordsHtml = usedWords.wordsHtml.concat(", " + newWords.wordsHtml)
		usedWords.defs = $.extend(usedWords.defs, newWords.defs)	
	$('#uwords').html usedWords.wordsHtml
	$('a').hover -> $('#udefinition').html usedWords.defs[$(this).html()]
	
handleMessage = (message) ->
	{type, content} = typeAndContent message
	switch type
		when 'welcome' 
			{players, currPlayerNum, tiles, yourNum: myNum, newWords, turnTime} = 
			JSON.parse content
			startGame players, currPlayerNum
			# update page
			$('#usedwords, #grid, #scores').show()
			$('#uwords').html ""
			usedWords = {}
			updateUsedWords newWords
		when 'moveResult'
			{player, swapCoordinates, moveScore, newWords} = JSON.parse content
			showMoveResult player, swapCoordinates, moveScore, newWords
			updateUsedWords newWords
		when 'opponentQuit'
			showMessage 'opponentQuit'
		when 'timeIsUp'
			endTurn(true)
		when 'yourTurnNow'
			startTurn(true)
		when 'tick'			
			tick = JSON.parse content
			# tick for first tick of turn, tock for others
			if tick is "tick" 
				$('#timer').html turnTime 
			else 
				$('#timer').html parseInt($('#timer').html()) - 1 
			
typeAndContent = (message) ->
	[ignore, type, content] = message.match /(.*?):(.*)/
	{type, content}

getPlayerName = (player) ->
	name = null
	if player.num is myNum then name = "You" else name = "Opponent"

toArray = (newWords) ->
	words = []
	words.push key for key, value of newWords.defs 
	words
	
showNotice = (moveScore, newWords, player) ->
	words = toArray(newWords)
	$notice = $("<p class='notice'></p>")
	if moveScore is 0
		$notice.html "#{getPlayerName player} formed no words this turn."
	else
		$notice.html """ 
			#{getPlayerName player} formed the following #{words.length} word(s):<br /> 
			<b>#{words.join(', ')}</b><br /> 
			earning <b>#{moveScore / words.length}x#{words.length}
			= #{moveScore}</b> points!
		"""
	showThenFade $notice	

showThenFade = ($elem) ->
	$elem.insertAfter $('#grid')
	$elem.effect "highlight", color: "#eb4", 5500, -> $elem.remove()
	
startGame = (players, currPlayerNum) ->
	for player in players
		$("#p#{player.num}name").html getPlayerName player
		$("#p#{player.num}score").html player.score
	drawTiles()
	if myNum is currPlayerNum then startTurn() 
	else endTurn()

showMoveResult = (player, swapCoordinates, moveScore, newWords) -> 
	$("#p#{player.num}score").html player.score 
	showNotice moveScore, newWords, player
	swapTiles swapCoordinates
	if player.num isnt myNum then startTurn()

$(document).ready ->
	$('#grid li').live 'click', tileClick
	socket = io.connect()
	socket.on 'connect', -> showMessage 'waitForConnection'
	socket.on 'message', handleMessage