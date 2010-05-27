--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\Dodgem.game.lua
--]]

Tanx.log("[Dodgem\\Dodgem.game.lua]: parsed.")

Tanx.require"Core:utility.lua"
Tanx.dofile"VehicleCamera.lua"
Tanx.dofile"Dodgem.lua"
Tanx.dofile"ScoreMark.lua"


s_GamingTime = 100
s_PostGameTime = 8


g_AutomobileList ={}
g_AiCarList ={}
g_ScoreMarks ={}


function state(s, ...)
	if g_State and g_State.leaveState then
		g_State.leaveState()
	end

	Tanx.log(string.format("[Dodgem\\Dodgem.game.lua]: swtich state from \"%s\" to \"%s\".", (g_State or {}).name or "", (s or {}).name or ""), Ogre.LogMessageLevel.TRIVIAL)

	g_State = s

	if g_State and g_State.enterState then
		g_State.enterState(unpack(arg))
	end
end


function onPlayerHitTail(id, power)
	--Tanx.log("PLAYER HIT!	p: " .. power)

	if g_GameTimeRemain > 0 then
		local score = math.floor(power / 3)
		g_Score = g_Score + score

		if score > 0 then
			assert(g_WindowManager)
			local mark = ScoreMark(g_WindowManager, score)
			table.insert(g_ScoreMarks, mark)
		end
	end
end

function onAiHitTail(power)
	--Tanx.log("[Dodgem\\Dodgem.game.lua]: AI HIT!	p: " .. power)

	if g_GameTimeRemain > 0 then
		local score = math.floor(power / 5)

		if score > 0 then
			if g_ProtectedTime <= 0 then
				g_Score = g_Score - score
				g_ProtectedTime = 0.4

				assert(g_WindowManager)
				local mark = ScoreMark(g_WindowManager, -score)
				table.insert(g_ScoreMarks, mark)
			end
		end
	end
end


function resetGame()
	g_World:reset()

	-- load scene
	local scene = g_Game:getResourcePackage():get():getResource("Park.scene")
	g_World:loadScene(scene, g_Game:getResourcePackage())

	g_AutomobileList = {}

	local car1 = g_World:createAgent("Dodgem/Dodgem", "player%index", Tanx.RigidBodyState.make(Tanx.Vector3(0, 0.8, 0)))
	g_PlayerCar = Dodgem(g_World, car1:get(), "Dodgem/Dodgem", nil, {onHitTail = onPlayerHitTail})
	table.insert(g_AutomobileList, g_PlayerCar)

	-- create AI cars
	g_AiCarList = {}
	local aiparams = Tanx.tableToMap{target = car1, onHitTail = Tanx.functor(onAiHitTail)}
	local i
	for i = 1, 5 do
		local ai = g_World:createAgent("Dodgem/AiCar", "aicar%index", Tanx.RigidBodyState.make(Tanx.Vector3((i - 3) * 8, 0.8, 20)), g_Game:getResourcePackage(), aiparams)
		table.insert(g_AiCarList, ai)
	end

	-- create main camera
	g_MainCamera = VehicleCamera(car1, g_World, "Main", {Radius = 7, AspectRatio = g_Game:getWindow():getWidth() / g_Game:getWindow():getHeight(), RearCamera = {}})

	g_Game:getWindow():removeAllViewports()
	local viewport = g_Game:getWindow():addViewport(g_MainCamera:getCamera())
	viewport:setBackgroundColour(Ogre.ColourValue(0.2, 0.3, 0.5))

	Ogre.CompositorManager.getSingleton():addCompositor(viewport, "Glass")
	Ogre.CompositorManager.getSingleton():setCompositorEnabled(viewport, "Glass", true)

	local rearview = g_Game:getWindow():addViewport(g_MainCamera:getRearCamera(), 1, 0.3, 0.01, 0.4, 0.2)
	rearview:setBackgroundColour(Ogre.ColourValue(0.2, 0.3, 0.5))
	rearview:setOverlaysEnabled(false)

	-- create sound listener
	local s, r = pcall(openalpp.Listener.new)
	if s then
		g_SoundListener = r
		updateSoundListenerByCamera(g_SoundListener, g_MainCamera:getCamera())
	end

	g_Score = 0
	g_GameTimeRemain = s_GamingTime

	g_ProtectedTime = 0
end


function initialize(game)
	g_Game = game
	g_World = game:getWorld()
	g_Keyboard = game:getKeyboard()
	g_Mouse = game:getMouse()

	-- setup GUI
	g_GuiSystem = CEGUI.System.getSingleton()
	CEGUI.SchemeManager.getSingleton():loadScheme(CEGUI.String"TaharezLookSkin.scheme")
	g_WindowManager = CEGUI.WindowManager.getSingleton()
	local sheet = g_WindowManager:loadWindowLayout(CEGUI.String"Dodgem.layout")
	g_GuiSystem:setGUISheet(sheet)

	g_ScoreWindow = g_WindowManager:getWindow(CEGUI.String"Dodgem/Score")
	g_TimerWindow = g_WindowManager:getWindow(CEGUI.String"Dodgem/Timer")
	g_ResultWindow = g_WindowManager:getWindow(CEGUI.String"Dodgem/Result")
	g_ResultWindow:hide()

	state(PreparingState)
end


function onStep(elapsed)
	g_MainCamera:step(elapsed)

	-- player control
	do
		local driver = g_PlayerCar.Driver
		driver.m_positionX = 0
		driver.m_positionY = 0
		driver.m_handbrakeButtonPressed:set(g_Keyboard ~= nil and g_Keyboard:isKeyDown(OIS.KeyCode.SPACE))
		driver.m_reverseButtonPressed:set(g_Keyboard ~= nil and g_Keyboard:isKeyDown(OIS.KeyCode.LCONTROL))

		if g_Keyboard then
			if g_Keyboard:isKeyDown(OIS.KeyCode.W) then
				driver.m_positionY = driver.m_positionY + 1
			end

			if g_Keyboard:isKeyDown(OIS.KeyCode.S) then
				driver.m_positionY = driver.m_positionY - 1
			end

			if g_Keyboard:isKeyDown(OIS.KeyCode.A) then
				driver.m_positionX = driver.m_positionX - 1
			end

			if g_Keyboard:isKeyDown(OIS.KeyCode.D) then
				driver.m_positionX = driver.m_positionX + 1
			end
		end
	end

	local i, v

	for i, v in ipairs(g_AutomobileList) do
		v:step(elapsed)
	end

	for i, v in ipairs(g_ScoreMarks) do
		repeat
			v:step(elapsed)

			local next = true
			if v.RemainTime <= 0 then
				table.remove(g_ScoreMarks, i)
				v = g_ScoreMarks[i]
				next = false
			end
		until next or v == nil
	end

	if g_SoundListener then
		updateSoundListenerByCamera(g_SoundListener, g_MainCamera:getCamera(), elapsed)
	end

	g_ScoreWindow:setText(CEGUI.String("S " .. g_Score))
	g_TimerWindow:setText(CEGUI.String(string.format("%6.2f", g_GameTimeRemain)))

	if g_State and g_State.step then
		g_State.step(elapsed)
	end
end


function windowClosing(window)
	g_Game:exit()

	return false
end


function updateSoundListenerByCamera(listener, camera, elapsed)
	elapsed = elapsed or 1

	local chassis = g_PlayerCar.Chassis:lock()

	if chassis:get() then
		--local position = camera:getRealPosition()
		local position = chassis:get():getPosition()
		local velocity = chassis:get():getLinearVelocity()
		local direction = camera:getRealDirection()
		local up = camera:getRealUp()

		--g_LastPosition = g_LastPosition or position
		--local velocity = (position - g_LastPosition) / elapsed

		listener:get():setPosition(position.x, position.y, position.z)
		listener:get():setOrientation(direction.x, direction.y, direction.z, up.x, up.y, up.z)
		listener:get():setVelocity(velocity.x, velocity.y, velocity.z)

		--g_LastPosition = position
	end
end



PreparingState =
{
	name = "Preparing",

	enterState = function()
		resetGame()

		state(GamingState)
	end,
}


GamingState =
{
	name = "Gaming",

	enterState = function()
		local i, v
		for i, v in ipairs(g_AiCarList) do
			v:get():callHost(Tanx.param"enable", Tanx.param(true))
		end
	end,

	leaveState = function()
		local i, v
		for i, v in ipairs(g_AiCarList) do
			v:get():callHost(Tanx.param"enable", Tanx.param(false))
		end
	end,

	step = function(elapsed)
		if g_ProtectedTime > 0 then
			g_ProtectedTime = g_ProtectedTime - elapsed
		end

		if g_GameTimeRemain > 0 then
			g_GameTimeRemain = g_GameTimeRemain - elapsed

			if g_GameTimeRemain < 0 then
				g_GameTimeRemain = 0
				state(PostGameState)
			end
		end
	end
}


PostGameState =
{
	name = "PostGame",

	enterState = function()
		PostGameState.RemainTime = s_PostGameTime

		g_ResultWindow:setAlpha(0)
		g_ResultWindow:setText(CEGUI.String("TOTAL: " .. g_Score))
		g_ResultWindow:show()

		-- TODO: play a sound
	end,

	leaveState = function()
		g_ResultWindow:hide()
	end,

	step = function(elapsed)
		PostGameState.RemainTime = PostGameState.RemainTime - elapsed
		if PostGameState.RemainTime <= 0 then
			state(PreparingState)
		end

		g_ResultWindow:setAlpha(math.min(math.max((s_PostGameTime - PostGameState.RemainTime - 2) * 0.4, 0), 1))
	end
}
