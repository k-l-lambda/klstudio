--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Tetris.scene.lua
--]]

Tanx.log("[Tetris\\Tetris.scene.lua]: parsed.")


g_BrickConfigNames =
{
	--"Tetris/Brick1_0",
	--"Tetris/Brick2_0",
	--"Tetris/Brick3_0",
	--"Tetris/Brick3_1",
	"Tetris/Brick4_0",
	"Tetris/Brick4_1",
	"Tetris/Brick4_2",
	"Tetris/Brick4_3",
	"Tetris/Brick4_4",
	"Tetris/Brick4_5",
	"Tetris/Brick4_6",
	"Tetris/Brick4_7",
}


function makeBrickMaterials()
	local mm = Ogre.MaterialManager.getSingleton()
	local reflection = mm:getByName("Tetris/Reflection"):get():toDerived()

	local make = function(name)
		local material = mm:getByName(name):get():toDerived()
		local tus = Ogre.TextureUnitState.new(material:getTechnique(0):getPass(0), reflection:getTechnique(0):getPass(0):getTextureUnitState"CylinderBackground")
		material:getTechnique(0):getPass(0):addTextureUnitState(tus)
	end

	make"Tetris/Brick/White"
	make"Tetris/Brick/Black"
	make"Tetris/Brick/Red"
	make"Tetris/Brick/Green"
	make"Tetris/Brick/Blue"
	make"Tetris/Brick/Yellow"
	make"Tetris/Brick/Brown"
	make"Tetris/Brick/Cyan"
	make"Tetris/Brick/Pink"
	make"Tetris/Brick/Purple"
end


function initialize(world)
	g_World = world
	world:reset()

	makeBrickMaterials()

	local light = Tanx.LightAppearanceConfig()
	light.LightType = Ogre.Light.LightTypes.DIRECTIONAL
	light.Direction = Tanx.Vector3(0.6, -1.0, -1.0)
	light.DiffuseColour = Tanx.ColourValue(0.8, 0.8, 0.8, 1)
	light.SpecularColour = Tanx.ColourValue(1, 1, 1, 1)
	g_LightNode = world:createAppearance("Light", light):getParentNode()

	light.Direction = Tanx.Vector3(-1, -1.6, 0.8)
	light.DiffuseColour = Tanx.ColourValue(0.4, 0.4, 0.4, 1)
	light.SpecularColour = Tanx.ColourValue(0.3, 0.3, 0.3, 1)
	light.CastShadows = false
	g_LightNode2 = world:createAppearance("Light2", light):getParentNode()

	--[[local floor = Tanx.UnitConfig(world:getUnitConfig"Tanx/Core/Plane")
	floor.RigidBodies:at(0).Shape:get().Scale = Tanx.Vector3(100, 100, 100)
	floor.Nodes:at(0).Appearances:at(0):get():toDerived().Scale = Tanx.Vector3(1, 1, 1)
	floor.Nodes:at(0).Appearances:at(0):get():toDerived().MaterialMap:at(0).MaterialName = "Tetris/Floor"
	floor.RigidBodies:at(0).MotionType = Havok.hkpMotion.MotionType.FIXED
	floor.RigidBodies:at(0).QualityType = Havok.hkpCollidableQualityType.FIXED
	world:createAgent(floor, "Floor", Tanx.RigidBodyState.make(Tanx.Vector3(0, 0, 0)))]]

	world:createAgent("Tetris/Well", "Well", Tanx.RigidBodyState.make())

	--[[local i
	for i = 1, table.maxn(g_BrickConfigNames) do
		g_World:createAgent(g_BrickConfigNames[i], "brick%index", Tanx.RigidBodyState.make(Tanx.Vector3(i * 4, 10, 0)))
	end]]

	local topcamera = world:createCamera"Top"
	topcamera:setPosition(Tanx.Vector3(0, 200, 0.1))
	topcamera:lookAt(Tanx.Vector3(0, 0, 0))
	topcamera:setFOVy(Tanx.Radian(math.pi * 0.01))
end

function onStep(elapsed)
	g_LightNode:yaw(Tanx.Radian(-0.6 * elapsed), Ogre.Node.TransformSpace.LOCAL)
	g_LightNode2:yaw(Tanx.Radian(-0.6 * elapsed), Ogre.Node.TransformSpace.LOCAL)
end

