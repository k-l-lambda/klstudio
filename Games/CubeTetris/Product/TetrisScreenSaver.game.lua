--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	TetrisScreenSaver.game.lua
--]]

Tanx.log("[Tetris\\TetrisScreenSaver.game.lua]: parsed.")

Tanx.require"Core:utility.lua"
Tanx.dofile"CubeGrid.lua"
Tanx.dofile"AlignAction.lua"
Tanx.dofile"AiController.lua"
Tanx.dofile"TetrisPool.lua"


math.randomseed(std.time())


function startPool()
	g_Pool = TetrisPool(g_Game, g_AiController, g_CameraNode, {Center = {x = 0, z = 0}, FreezeTime = 0.2, BlockLayers = 50, TopHeight = 56})

	g_PoolRestartWaitTime = 15
end


function initialize(game)
	g_Game = game
	g_World = game:getWorld()
	g_Keyboard = game:getKeyboard()
	g_Mouse = game:getMouse()

	local scene = Tanx.SceneConfig()
	Tanx.GenericArchive.load(game:getResourcePackage():get():open("Tetris.scene"):get(), scene)
	game:getWorld():loadScene(scene, game:getResourcePackage())

	g_World:detachAgent(g_World:findAgent"Well")
	local wellconfig = Tanx.UnitConfig(g_World:getUnitConfig"Tetris/Well")
	wellconfig.Nodes:at(0).Appearances:at(0):get():toDerived().MaterialMap:at(0).MaterialName = "Tetris/WellWallWithTitle"
	g_World:createAgent(wellconfig, "Well", Tanx.RigidBodyState.make(Tanx.Vector3(0, 60, 0)))

	g_MainCamera = game:getWorld():createCamera"Main"
	g_CameraNode = g_World:getRootSceneNode():createChildSceneNode(Tanx.Vector3(0, 18, 0))
	g_CameraNode:attachObject(g_MainCamera)
	g_MainCamera:setNearClipDistance(0.1)
	g_MainCamera:setPosition(Tanx.Vector3(0, 12, -24))
	g_MainCamera:lookAt(g_CameraNode:getPosition())
	g_MainCamera:setFOVy(Tanx.Radian(math.pi * 0.32))
	g_MainCamera:setAspectRatio(game:getWindow():getWidth() / game:getWindow():getHeight())

	local viewport = game:getWindow():addViewport(g_MainCamera)
	viewport:setBackgroundColour(Ogre.ColourValue(0.2, 0.3, 0.5))

	g_AiController = AiController(game)
	startPool()
end


function dispose()
	if g_AiController then
		g_AiController:dispose()
	end
end


function onStep(elapsed)
	g_Pool:step(elapsed)

	g_CameraNode:yaw(Tanx.Radian(elapsed * 0.04))
	g_Pool.RootNode:yaw(Tanx.Radian(elapsed * -0.5))

	local end1, end2 = g_Pool:isEnd()
	if end2 then
		g_PoolRestartWaitTime = g_PoolRestartWaitTime - elapsed
		if g_PoolRestartWaitTime <= 0 then
			g_Pool:stop()
			startPool()
		end
	end
end


--function frameEnded(e)
--	return not g_ExitGame
--end


function windowClosing(window)
	g_Game:exit()

	return false
end
