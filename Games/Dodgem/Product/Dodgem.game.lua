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

	-- load unit and vehicle library
	Tanx.UnitBook.getSingleton():loadLibrary(game:getResourcePackage():get():open("Dodgem.unit"):get())
	Tanx.VehicleBook.getSingleton():loadLibrary(game:getResourcePackage():get():open("Dodgem.vehicle"):get())

	-- load scene
	local scene = Tanx.SceneConfig()
	Tanx.GenericArchive.load(game:getResourcePackage():get():open("Park.scene"):get(), scene)
	game:getWorld():loadScene(scene, game:getResourcePackage())

	local car1 = game:getWorld():createAgent("Dodgem/Dodgem", "car1", Tanx.RigidBodyState.make(Tanx.Vector3(0, 0.8, 0)))
	--local action = Tanx.VehicleBook.getSingleton():at"Dodgem/Dodgem":make(car1:get():getMainBody())
	--g_Car1Action = action
	g_PlayerAutomobile = Automobile(car1:get():getMainBody(), "Dodgem/Dodgem")

	--g_Driver = action:get().m_deviceStatus:toDerived()

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

	--[[if g_Car1Action then
		local rpm = g_Car1Action:get():calcRPM()
		local kmph = g_Car1Action:get():calcKMPH()
		local mph = g_Car1Action:get():calcMPH()
		Tanx.log(string.format("[Dodgem\\Dodgem.game.lua]: car1 rpm: %f, kmph: %f, mph: %f.", rpm, kmph, mph))
	end]]
end


function windowClosing(window)
	g_Game:exit()

	return false
end
