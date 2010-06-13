--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\Dodgem.game.lua
--]]

Tanx.log("[Dodgem\\Dodgem.game.lua]: parsed.")

Tanx.require"Core:utility.lua"
Tanx.require"Core:StateMachine.lua"
Tanx.require"Core:CeguiUtil.lua"
Tanx.dofile"VehicleCamera.lua"
Tanx.dofile"Dodgem.lua"
Tanx.dofile"ScoreMark.lua"
Tanx.dofile"TailState.lua"
Tanx.dofile"LevelConfigs.lua"


s_CoverDuration = 3
s_PreparingDuration = 5.7
s_PostGameDuration = 7


g_AutomobileList = {}
g_AiCarList = {}
g_ScoreMarks = {}

g_TailStates = {}

g_UserData =
{
	TotalScore	= 0,
	HiScore		= 0,
	Level		= 1,
}


function getLevelConfig(level)
	local static_config = g_LevelConfigs[level] or g_LevelConfigs[#g_LevelConfigs]
	local ailayouts = static_config.AiLayouts
	local layout = ailayouts[Tanx.random(#ailayouts)]

	local config =
	{
		PassScore		= static_config.PassScore or math.floor(#layout * level ^ 0.6),
		AiCount			= #layout,
		AiConfig		= {},
		Duration		= static_config.Duration or math.floor(math.log(level + 1) * 3) * 10,
	}
	config.CriticalTime = config.Duration / 2

	local i, v
	for i, v in ipairs(layout) do
		config.AiConfig[i] =
		{
			InitState = Tanx.RigidBodyState.make(Tanx.Vector3(v[1] * 5, 0.8 + (v.y or 0), v[2] * 5), Tanx.Quaternion(Tanx.Degree(v.yaw or 180), Tanx.Vector3.UNIT_Y)),
			Power = v.Power or static_config.AiPower or 0.6,
		}
	end

	local playerstate = static_config.Player or {0, -4}
	config.PlayerInitState = Tanx.RigidBodyState.make(Tanx.Vector3(playerstate[1] * 5, 0.8 + (playerstate.y or 0), playerstate[2] * 5), Tanx.Quaternion(Tanx.Degree(playerstate.yaw or 0), Tanx.Vector3.UNIT_Y))

	return config
end


function updateFooter()
	g_GuiWindows.Footer:setText(CEGUI.String(string.format("LEVEL %d       TOTAL %4d       HI %4d", g_UserData.Level, g_UserData.TotalScore, g_UserData.HiScore)))
end


function changeScore(delta)
	g_Score = g_Score + delta

	g_UserData.TotalScore = g_UserData.TotalScore + delta
	if g_UserData.TotalScore > g_UserData.HiScore then
		g_UserData.HiScore = g_UserData.TotalScore
	end

	updateFooter()
end


local function loadSound()
	local createSoundSource = function(filename, ambient)
		local source = openalpp.Source.new(Tanx.ScriptSpace:resource():get():getResource(filename):get())
		source:get():setAmbient(ambient or false)

		return source
	end

	g_Sounds = {
		Gain			= createSoundSource("gain.wav", true),
		Loss			= createSoundSource("loss.wav", true),
		LevelUp			= createSoundSource("Level-up.wav", true),
		LevelFail		= createSoundSource("LevelFail.wav", true),
		CriticalPoint	= createSoundSource("CriticalPoint.wav", true),
		Beep			= createSoundSource("beep.wav", true),
		Dang			= createSoundSource("dang.wav", true),
	}
end


function onPlayerHitTail(id, power)
	if g_BodyStateMachine:stateKey() == "Gaming" then
		local score = math.floor(power / 3)
		changeScore(score)

		if score > 0 then
			if g_Score >= g_CurrentLevelConfig.PassScore and g_GameTimeRemain < g_CurrentLevelConfig.CriticalTime then
				g_BodyStateMachine:switch"PostGame"
			end

			assert(g_WindowManager)
			local mark = ScoreMark(g_WindowManager, score)
			table.insert(g_ScoreMarks, mark)

			g_TailStates.Ai[id]:flicker()

			if g_Sounds then
				g_Sounds.Gain:get():play()
			end
		end
	end
end

function onAiHitTail(power)
	if g_BodyStateMachine:stateKey() == "Gaming" then
		local score = math.floor(power / 5)

		if score > 0 then
			if g_ProtectedTime <= 0 then
				changeScore(-score)
				g_ProtectedTime = 0.4

				assert(g_WindowManager)
				local mark = ScoreMark(g_WindowManager, -score)
				table.insert(g_ScoreMarks, mark)

				g_TailStates.Player:flicker()

				if g_Sounds then
					g_Sounds.Loss:get():play()
				end
			end
		end
	end
end


function resetGame(config)
	g_CurrentLevelConfig = config

	g_World:reset()

	-- load scene
	local scene = g_Game:getResourcePackage():get():getResource("Park.scene")
	g_World:loadScene(scene, g_Game:getResourcePackage())

	g_AutomobileList = {}

	local car1 = g_World:createAgent("Dodgem/Dodgem", "player%index", config.PlayerInitState)
	g_PlayerCar = Dodgem(g_World, car1:get(), "Dodgem/Dodgem", nil, {onHitTail = onPlayerHitTail})
	table.insert(g_AutomobileList, g_PlayerCar)
	g_TailStates.Player = TailState(car1, {Disabled = Ogre.ColourValue(0.8, 0.2, 0.2)})
	g_TailStates.Player:disable()

	-- create AI cars
	g_AiCarList = {}
	g_TailStates.Ai = {}
	local aiparams = Tanx.tableToMap{target = car1, onHitTail = Tanx.functor(onAiHitTail)}
	local i
	for i = 1, config.AiCount do
		if config.Power then
			aiparams:at"MaxPower":set(config.Power)
		end

		local ai = g_World:createAgent("Dodgem/AiCar", "aicar%index", config.AiConfig[i].InitState, g_Game:getResourcePackage(), aiparams)
		table.insert(g_AiCarList, ai)

		local tailid = ai:get():findBody"tail":get():getRigidBody():get():getUid()
		g_TailStates.Ai[tailid] = TailState(ai, {Active = Ogre.ColourValue.Green, Disabled = Ogre.ColourValue(0.5, 0.6, 0.5)})
		g_TailStates.Ai[tailid]:disable()
	end

	-- create main camera
	g_MainCamera = VehicleCamera(car1, g_World, "Main", {Radius = 7, AspectRatio = g_Game:getWindow():getWidth() / g_Game:getWindow():getHeight(), RearCamera = {}})
	g_Game:getWindow():getViewport(0):setCamera(g_MainCamera:getCamera())
	Ogre.CompositorManager.getSingleton():setCompositorEnabled(g_Game:getWindow():getViewport(0), "Dodgem/Curtain", false)
	Ogre.CompositorManager.getSingleton():setCompositorEnabled(g_Game:getWindow():getViewport(0), "Dodgem/Curtain", true)

	if g_Game:getWindow():getNumViewports() < 2 then
		local rearview = g_Game:getWindow():addViewport(g_MainCamera:getRearCamera(), 1, 0.3, 0.01, 0.4, 0.2)
		rearview:setBackgroundColour(Ogre.ColourValue(0.2, 0.3, 0.5))
		rearview:setOverlaysEnabled(false)
	else
		g_Game:getWindow():getViewport(1):setCamera(g_MainCamera:getRearCamera())
	end

	-- create sound listener
	if g_SoundListener == nil then
		local s, r = pcall(openalpp.Listener.new)
		if s then
			g_SoundListener = r
		end
	end
	if g_SoundListener then
		updateSoundListenerByCamera(g_SoundListener, g_MainCamera:getCamera())
	end

	g_Score = 0
	g_GameTimeRemain = g_CurrentLevelConfig.Duration

	g_ProtectedTime = 0
end


function setCurtainIntensity(intensity)
	intensity = math.min(math.max(intensity, 0), 1)

	g_CurtainMaterial = g_CurtainMaterial or Ogre.MaterialManager.getSingleton():getByName"Dodgem/Curtain":get():toDerived()
	--assert(g_CurtainCompositor)
	--g_CurtainMaterial = g_CurtainMaterial or g_CurtainCompositor:getTechnique():getOutputTargetPass():getPass(0):getMaterial():get()

	local color = Ogre.ColourValue.White * (1 - intensity)

	local texunit = g_CurtainMaterial:getTechnique(0):getPass(0):getTextureUnitState"Mask"
	local blendop = texunit:getColourBlendMode()
	if blendop.colourArg1 ~= color then
		texunit:setColourOperationEx(blendop.operation, blendop.source1, blendop.source2, color)

		assert(g_CompositorChain)
		g_CompositorChain:_markDirty()
	end
end


function setHudVisible(visible)
	g_GuiWindows.Score:setVisible(visible)
	g_GuiWindows.Timer:setVisible(visible)
	g_GuiWindows.Footer:setVisible(visible)

	if g_Game:getWindow():getNumViewports() >= 2 then
		local rearview = g_Game:getWindow():getViewport(1)
		if visible then
			rearview:setDimensions(0.3, 0.01, 0.4, 0.2)
		else
			rearview:setDimensions(0, 0, 0, 0)
		end
	end
end


function initialize(game)
	g_Game = game
	g_World = game:getWorld()
	g_Keyboard = game:getKeyboard()
	g_Mouse = game:getMouse()

	if g_Keyboard then
		g_KeyListener = KeyListener()
		g_Keyboard:setEventCallback(g_KeyListener)
	end
	if g_Mouse then
		g_MouseListener = MouseListener()
		g_Mouse:setEventCallback(g_MouseListener)
	end

	-- setup GUI
	g_GuiSystem = CEGUI.System.getSingleton()
	CEGUI.SchemeManager.getSingleton():loadScheme(CEGUI.String"TaharezLookSkin.scheme")
	CEGUI.SchemeManager.getSingleton():loadScheme(CEGUI.String"Dodgem.scheme")
	g_WindowManager = CEGUI.WindowManager.getSingleton()
	local sheet = g_WindowManager:loadWindowLayout(CEGUI.String"Dodgem.layout")
	g_GuiSystem:setGUISheet(sheet)

	g_GuiWindows =
	{
		Vendor				= g_WindowManager:getWindow(CEGUI.String"Dodgem/Vendor"),
		Score				= g_WindowManager:getWindow(CEGUI.String"Dodgem/Score"),
		Timer				= g_WindowManager:getWindow(CEGUI.String"Dodgem/Timer"),
		Footer				= g_WindowManager:getWindow(CEGUI.String"Dodgem/Footer"),
		Prompt				= g_WindowManager:getWindow(CEGUI.String"Dodgem/Prompt"),
		Countdown			= g_WindowManager:getWindow(CEGUI.String"Dodgem/Countdown"),
		EscPanel			= g_WindowManager:getWindow(CEGUI.String"Dodgem/EscPanel"),
		EscPanel_Resume		= g_WindowManager:getWindow(CEGUI.String"Dodgem/EscPanel/Resume"),
		EscPanel_Restart	= g_WindowManager:getWindow(CEGUI.String"Dodgem/EscPanel/Restart"),
		EscPanel_Exit		= g_WindowManager:getWindow(CEGUI.String"Dodgem/EscPanel/Exit"),
	}
	g_GuiWindows.Prompt:hide()

	local s, e = pcall(loadSound)
	if not s then
		Tanx.log("[Dodgem\\Dodgem.game.lua]: 'loadSound' failed: " .. e)
	end

	-- create viewport
	local tmpcamera = g_World:createCamera"tmp"
	local viewport = g_Game:getWindow():addViewport(tmpcamera)
	viewport:setBackgroundColour(Ogre.ColourValue(0.2, 0.3, 0.5))

	Ogre.CompositorManager.getSingleton():addCompositor(viewport, "Dodgem/Curtain")
	Ogre.CompositorManager.getSingleton():setCompositorEnabled(viewport, "Dodgem/Curtain", true)
	g_CompositorChain = Ogre.CompositorManager.getSingleton():getCompositorChain(viewport)

	g_GameStateMachine:switch"Cover"
end


function onStep(elapsed)
	local state = g_GameStateMachine:state()
	if state and state.step then
		state:step(elapsed)
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



g_BodyStateMachine = TanxStateMachine{
	Preparing =
	{
		SubState = TanxStateMachine{
			Title =
			{
				enterState = function(state, parent)
					setHudVisible(false)

					setCurtainIntensity(1)

					state.Remain = 1

					g_GuiWindows.Prompt:setAlpha(1)
					g_GuiWindows.Prompt:setXPosition(CEGUI.UDim(0.36, 0))
					g_GuiWindows.Prompt:setText(CEGUI.String("LEVEL " .. g_UserData.Level))
					g_GuiWindows.Prompt:setProperty(CEGUI.String"TextColours", CEGUI.colorString"ffffffff")
					g_GuiWindows.Prompt:show()

					local i, v
					for i, v in ipairs(g_AiCarList) do
						v:get():callHost(Tanx.param"setFreezed", Tanx.param(true))
					end
				end,

				step = function(state, parent, elapsed)
					state.Remain = state.Remain - elapsed
					if state.Remain <= 0 then
						parent.SubState:switch("FadeIn", parent)
					end
				end,
			},

			FadeIn =
			{
				enterState = function(state, parent)
					state.CurtainIntensity = 1.2

					setHudVisible(false)

					setCurtainIntensity(state.CurtainIntensity)
				end,

				step = function(state, parent, elapsed)
					state.CurtainIntensity = state.CurtainIntensity - elapsed * 0.7
					setCurtainIntensity(state.CurtainIntensity)

					g_GuiWindows.Prompt:setAlpha(math.max(math.min(state.CurtainIntensity, 1), 0))

					if state.CurtainIntensity < 0 then
						parent.SubState:switch("Countdown", parent)
					end
				end,
			},

			Countdown =
			{
				enterState = function(state, parent)
					g_GuiWindows.Prompt:hide()

					state.Count = math.ceil(s_PreparingDuration - parent.Time)

					g_GuiWindows.Countdown:setText(CEGUI.String(tostring(state.Count)))
					g_GuiWindows.Countdown:show()

					if g_Sounds then
						g_Sounds.Beep:get():play()
					end

					local i, v
					for i, v in ipairs(g_AiCarList) do
						v:get():callHost(Tanx.param"setFreezed", Tanx.param(false))
					end
				end,

				step = function(state, parent, elapsed)
					local oldcount = state.Count

					state.Count = math.ceil(s_PreparingDuration - parent.Time)
					g_GuiWindows.Countdown:setText(CEGUI.String(tostring(state.Count)))

					if state.Count ~= oldcount and state.Count > 0 then
						if g_Sounds then
							g_Sounds.Beep:get():play()
						end
					end
				end,
			},
		},

		enterState = function(state)
			resetGame(getLevelConfig(g_UserData.Level))

			state.Time = 0

			state.SubState:switch("Title", state)
		end,

		leaveState = function(state)
			if g_Sounds then
				g_Sounds.Dang:get():play()
			end

			g_GuiWindows.Countdown:hide()
		end,

		step = function(state, elapsed)
			state.Time = state.Time + elapsed

			local substate = state.SubState:state()
			if substate and substate.step then
				substate:step(state, elapsed)
			end

			if state.Time > s_PreparingDuration then
				g_BodyStateMachine:switch"Gaming"
				return
			end
		end,
	},


	Gaming =
	{
		SubState = TanxStateMachine{
			PreCriticalPoint =
			{
				step = function(state, parent, elapsed)
					if g_GameTimeRemain < g_CurrentLevelConfig.CriticalTime then
						parent.SubState:switch("PostCriticalPoint", parent)
					end
				end,
			},

			PostCriticalPoint =
			{
				enterState = function(state, parent)
					--Tanx.log("[Dodgem\\Dodgem.game.lua]: PostCriticalPoint.enterState.")
					if g_Sounds then
						--Tanx.log("[Dodgem\\Dodgem.game.lua]: PostCriticalPoint.enterState.g_Sounds.")
						g_Sounds.CriticalPoint:get():play()
					end
				end,
			},
		},

		enterState = function(state)
			setHudVisible(true)

			local i, k, v
			for i, v in ipairs(g_AiCarList) do
				v:get():callHost(Tanx.param"enable", Tanx.param(true))
			end

			g_TailStates.Player:activate()
			for k, v in pairs(g_TailStates.Ai) do
				v:activate()
			end

			state.SubState:switch("PreCriticalPoint", state)
		end,

		leaveState = function(state)
			local i, k, v
			for i, v in ipairs(g_AiCarList) do
				v:get():callHost(Tanx.param"enable", Tanx.param(false))
			end

			g_TailStates.Player:disable()
			for k, v in pairs(g_TailStates.Ai) do
				v:disable()
			end
		end,

		step = function(state, elapsed)
			if g_ProtectedTime > 0 then
				g_ProtectedTime = g_ProtectedTime - elapsed
			end

			if g_GameTimeRemain > 0 then
				g_GameTimeRemain = g_GameTimeRemain - elapsed

				if g_GameTimeRemain < 0 then
					g_GameTimeRemain = 0
					g_BodyStateMachine:switch"PostGame"
					return
				end
			end

			local substate = state.SubState:state()
			if substate and substate.step then
				substate:step(state, elapsed)
			end
		end,
	},


	PostGame =
	{
		SubState = TanxStateMachine{
			Idle =
			{
				step = function(state, parent, elapsed)
					if parent.RemainTime < 2 then
						parent.SubState:switch("FadeOut", parent)
					end
				end,
			},

			FadeOut =
			{
				enterState = function(state, parent)
					setHudVisible(false)
					state.CurtainIntensity = 0
				end,

				step = function(state, parent, elapsed)
					state.CurtainIntensity = state.CurtainIntensity + elapsed * 0.7
					setCurtainIntensity(state.CurtainIntensity)
				end,
			},
		},

		enterState = function(state)
			local passed = g_Score >= g_CurrentLevelConfig.PassScore

			if passed then
				g_UserData.Level = g_UserData.Level + 1

				updateFooter()
			end

			state.RemainTime = s_PostGameDuration

			g_GuiWindows.Prompt:setAlpha(0)
			g_GuiWindows.Prompt:setXPosition(CEGUI.UDim(0.24, 0))
			g_GuiWindows.Prompt:setText(CEGUI.String(iif(passed, "MISSION PASSED", "MISSION FAILED")))
			g_GuiWindows.Prompt:setProperty(CEGUI.String"TextColours", iif(passed, CEGUI.colorString"fffff0a0", CEGUI.colorString"ffc04040"))
			g_GuiWindows.Prompt:show()

			if g_Sounds then
				iif(passed, g_Sounds.LevelUp, g_Sounds.LevelFail):get():play()
			end

			state.SubState:switch("Idle", state)
		end,

		leaveState = function(state)
			g_GuiWindows.Prompt:hide()
			setCurtainIntensity(1)
		end,

		step = function(state, elapsed)
			state.RemainTime = state.RemainTime - elapsed
			if state.RemainTime <= 0 then
				g_BodyStateMachine:switch"Preparing"
				return
			end

			local substate = state.SubState:state()
			if substate and substate.step then
				substate:step(state, elapsed)
			end

			g_GuiWindows.Prompt:setAlpha(math.min(math.max((s_PostGameDuration - state.RemainTime - 2) * 0.4, 0), 1))
		end,
	},
}


g_GameStateMachine = TanxStateMachine{
	Cover =
	{
		enterState = function(state)
			setCurtainIntensity(1)

			setHudVisible(false)
			g_GuiWindows.Vendor:setAlpha(0)
			g_GuiWindows.Vendor:show()

			state.Remain = s_CoverDuration

			g_Game:setWorldStepRate(0)
		end,

		leaveState = function(state)
			g_GuiWindows.Vendor:hide()
		end,

		step = function(state, elapsed)
			g_GuiWindows.Vendor:setAlpha(math.max(math.min(state.Remain * 1.2 - 0.1, 1) * math.min((s_CoverDuration - state.Remain) * 1.2, 1), 0))

			state.Remain = state.Remain - elapsed
			if state.Remain <= 0 then
				g_GameStateMachine:switch("Body", "start")
			end
		end,

		keyPressed = function(state, e)
			if g_Keyboard:isKeyDown(OIS.KeyCode.LCONTROL) and g_Keyboard:isKeyDown(OIS.KeyCode.F) then
				if e.key == OIS.KeyCode.UP then
					g_LevelConfigs.BeginLevel = (g_LevelConfigs.BeginLevel or 1) + 1

					if g_Sounds then
						g_Sounds.Gain:get():play()
					end

					state.Remain = math.max(state.Remain, 1)
				end
			end
		end,
	},


	Body =
	{
		enterState = function(state, command)
			if command == "start" then
				g_UserData.TotalScore = 0
				g_UserData.HiScore = g_UserData.HiScore or 0
				g_UserData.Level = g_LevelConfigs.BeginLevel or 1

				updateFooter()

				g_BodyStateMachine:switch"Preparing"

				g_Game:setWorldStepRate(1)
			end
		end,

		step = function(state, elapsed)
			g_MainCamera:step(elapsed)

			-- player control
			do
				local driver = g_PlayerCar.Driver
				driver.m_positionX = 0
				driver.m_positionY = 0
				driver.m_handbrakeButtonPressed:set(g_Keyboard ~= nil and g_Keyboard:isKeyDown(OIS.KeyCode.SPACE))
				driver.m_reverseButtonPressed:set(g_Keyboard ~= nil and g_Keyboard:isKeyDown(OIS.KeyCode.LCONTROL))

				if g_Keyboard then
					if g_Keyboard:isKeyDown(OIS.KeyCode.W) or g_Keyboard:isKeyDown(OIS.KeyCode.UP) then
						driver.m_positionY = driver.m_positionY + 1
					end

					if g_Keyboard:isKeyDown(OIS.KeyCode.S) or g_Keyboard:isKeyDown(OIS.KeyCode.DOWN) then
						driver.m_positionY = driver.m_positionY - 1
					end

					if g_Keyboard:isKeyDown(OIS.KeyCode.A) or g_Keyboard:isKeyDown(OIS.KeyCode.LEFT) then
						driver.m_positionX = driver.m_positionX - 1
					end

					if g_Keyboard:isKeyDown(OIS.KeyCode.D) or g_Keyboard:isKeyDown(OIS.KeyCode.RIGHT) then
						driver.m_positionX = driver.m_positionX + 1
					end
				end
			end

			local k, i, v

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

			g_GuiWindows.Score:setText(CEGUI.String(string.format("%4d / %d", g_Score, g_CurrentLevelConfig.PassScore)))
			g_GuiWindows.Timer:setText(CEGUI.String(string.format("%6.2f", g_GameTimeRemain)))

			g_GuiWindows.Score:setProperty(CEGUI.String"TextColours", iif(g_Score >= g_CurrentLevelConfig.PassScore, CEGUI.colorString"ff80ff80", CEGUI.colorString"ffffffff"))
			g_GuiWindows.Timer:setProperty(CEGUI.String"TextColours", iif(g_GameTimeRemain > g_CurrentLevelConfig.CriticalTime, CEGUI.colorString"ffffffff", iif(g_Score < g_CurrentLevelConfig.PassScore, CEGUI.colorString"ffff8080", CEGUI.colorString"ff80ff80")))

			local state = g_BodyStateMachine:state()
			if state and state.step then
				state:step(elapsed)
			end

			g_TailStates.Player:step(elapsed)
			for k, v in pairs(g_TailStates.Ai) do
				v:step(elapsed)
			end
		end,

		keyPressed = function(state, e)
			if g_BodyStateMachine:stateKey() == "Gaming" then
				if e.key == OIS.KeyCode.ESCAPE then
					g_GameStateMachine:switch"Timeout"
				end
			end
		end,
	},


	Timeout =
	{
		enterState = function(state)
			state.Time = 0

			g_GuiWindows.EscPanel_Resume:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(state.EventHandles.onResume))
			g_GuiWindows.EscPanel_Restart:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(state.EventHandles.onRestart))
			g_GuiWindows.EscPanel_Exit:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(state.EventHandles.onExit))

			setHudVisible(false)
			g_Game:setWorldStepRate(0)
			g_GuiWindows.EscPanel:setAlpha(0)
			g_GuiWindows.EscPanel:show()

			local i, v
			for i, v in ipairs(g_AutomobileList) do
				v:setSilent(true)
			end
			for i, v in ipairs(g_AiCarList) do
				v:get():callHost(Tanx.param"setSilent", Tanx.param(true))
			end
		end,

		leaveState = function(state)
			setHudVisible(true)
			setCurtainIntensity(0)
			g_Game:setWorldStepRate(1)
			g_GuiWindows.EscPanel:hide()

			local i, v
			for i, v in ipairs(g_AutomobileList) do
				v:setSilent(false)
			end
			for i, v in ipairs(g_AiCarList) do
				v:get():callHost(Tanx.param"setSilent", Tanx.param(false))
			end
		end,

		step = function(state, elapsed)
			setCurtainIntensity(math.min(state.Time, 0.7))
			g_GuiWindows.EscPanel:setAlpha(math.min(state.Time * 1.4, 1))

			state.Time = state.Time + elapsed
		end,

		keyPressed = function(state, e)
			if e.key == OIS.KeyCode.ESCAPE then
				g_GameStateMachine:switch("Body", "resume")
			end
		end,


		EventHandles = {
			onResume = function()
				g_GameStateMachine:switch("Body", "resume")
			end,

			onRestart = function()
				g_LevelConfigs.BeginLevel = 1
				g_ScoreMarks = {}

				g_GameStateMachine:switch"Cover"
			end,

			onExit = function()
				g_Game:exit()
			end,
		},
	},
}


class "KeyListener" (OIS.KeyListener)

	function KeyListener:__init()
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			OIS.KeyListener.__init(self)
		else
			super()
		end
	end

	function KeyListener:keyPressed(e)
		local state = g_GameStateMachine:state()
		if state and state.keyPressed then
			state:keyPressed(e)
		end

		return true
	end

	function KeyListener:keyReleased(e)
		local state = g_GameStateMachine:state()
		if state and state.keyReleased then
			state:keyReleased(e)
		end

		return true
	end


class "MouseListener" (OIS.MouseListener)

	function MouseListener:__init()
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			OIS.MouseListener.__init(self)
		else
			super()
		end
	end

	function MouseListener:mousePressed(e, id)
		CEGUI.System.getSingleton():injectMouseButtonDown(CEGUI.ButtonIdFromOis[id])

		local state = g_GameStateMachine:state()
		if state and state.mousePressed then
			state.mousePressed(e)
		end

		return true
	end

	function MouseListener:mouseReleased(e, id)
		CEGUI.System.getSingleton():injectMouseButtonUp(CEGUI.ButtonIdFromOis[id])

		local state = g_GameStateMachine:state()
		if state and state.mouseReleased then
			state.mouseReleased(e)
		end

		return true
	end

	function MouseListener:mouseMoved(e)
		CEGUI.System.getSingleton():injectMousePosition(e:state().X.abs, e:state().Y.abs)
		CEGUI.System.getSingleton():injectMouseWheelChange(e:state().Z.rel)

		local state = g_GameStateMachine:state()
		if state and state.mouseMoved then
			state.mouseMoved(e)
		end

		return true
	end
