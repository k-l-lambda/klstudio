--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\Park.scene.lua
--]]

Tanx.log("[Dodgem\\Park.scene.lua]: parsed.")


function initialize(world)
	local light = Tanx.LightAppearanceConfig()
	light.LightType = Ogre.Light.LightTypes.DIRECTIONAL
	light.Direction = Tanx.Vector3(0.6, -1.0, -1.0)
	light.DiffuseColour = Tanx.ColourValue(0.8, 0.8, 0.8, 1)
	light.SpecularColour = Tanx.ColourValue(1, 1, 1, 1)
	world:createAppearance("MainLight", light):getParentNode()

	world:createAgent("Dodgem/Pool", "ground", Tanx.RigidBodyState.make())
end
