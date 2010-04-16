--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\Dodgem.game.lua
--]]

Tanx.log("[Dodgem\\Dodgem.game.lua]: parsed.")

Tanx.dofile"VehicleCamera.lua"
Tanx.dofile"Automobile.lua"


function initialize(game)
	g_Game = game
	g_World = game:getWorld()
	g_Keyboard = game:getKeyboard()
	g_Mouse = game:getMouse()

	game:getWorld():reset()

	-- load scene
	local scene = game:getResourcePackage():get():getResource("Park.scene")
	game:getWorld():loadScene(scene, game:getResourcePackage())

	local car1 = game:getWorld():createAgent("Dodgem/Dodgem", "car1", Tanx.RigidBodyState.make(Tanx.Vector3(0, 0.8, 0)))
	g_PlayerAutomobile = Automobile(car1:get():getMainBody(), "Dodgem/Dodgem")

	local params = Tanx.ParameterMap()
	params:at"target":assign(car1)

	local i
	for i = 1, 5 do
		game:getWorld():createAgent("Dodgem/AiCar", "aicar%index", Tanx.RigidBodyState.make(Tanx.Vector3((i - 3) * 8, 0.8, 20)), game:getResourcePackage(), params)
	end

	do
		g_MainCamera = VehicleCamera(car1, g_World, "Main", {Radius = 7, AspectRatio = game:getWindow():getWidth() / game:getWindow():getHeight(), RearCamera = {}})

		local viewport = game:getWindow():addViewport(g_MainCamera:getCamera())
		viewport:setBackgroundColour(Ogre.ColourValue(0.2, 0.3, 0.5))

		local rearview = game:getWindow():addViewport(g_MainCamera:getRearCamera(), 1, 0.3, 0.01, 0.4, 0.2)
		rearview:setBackgroundColour(Ogre.ColourValue(0.2, 0.3, 0.5))
	end
end


function onStep(elapsed)
	g_MainCamera:step(elapsed)

	-- player control
	do
		local driver = g_PlayerAutomobile.Driver
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

	g_PlayerAutomobile:step(elapsed)
end


function windowClosing(window)
	g_Game:exit()

	return false
end
