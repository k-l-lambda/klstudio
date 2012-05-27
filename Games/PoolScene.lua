--[[
	PoolScene.lua
--]]

Tanx.log("[Test\\PoolScene.lua]: parsed.", Ogre.LogMessageLevel.TRIVIAL, false)


function makeRigidBodyState(position, orientation, linearVel, angleVel)
	position = position or Tanx.Vector3.ZERO
	orientation = orientation or Tanx.Quaternion.IDENTITY
	linearVel = linearVel or Tanx.Vector3.ZERO
	angleVel = angleVel or Tanx.Vector3.ZERO

	return Tanx.RigidBodyState.make(position, orientation, linearVel, angleVel)
end


function initialize(world)
	world:reset()

	local global_light = Tanx.LightAppearanceConfig()
	global_light.LightType = Ogre.Light.LightTypes.DIRECTIONAL
	global_light.Direction = Tanx.Vector3(0.6, -1.0, -1.0)
	global_light.DiffuseColour = Tanx.ColourValue(0.4, 0.4, 0.4, 1)
	global_light.SpecularColour = Tanx.ColourValue(0.3, 0.3, 0.3, 1)
	world:createAppearance("GlobalLight", global_light)

	local spot_light = Tanx.LightAppearanceConfig()
	spot_light.LightType = Ogre.Light.LightTypes.SPOTLIGHT
	spot_light.DiffuseColour = Tanx.ColourValue(1.0, 0.9, 0.7, 1)
	spot_light.SpecularColour = Tanx.ColourValue(1.0, 0.9, 0.7, 1)
	spot_light.Direction = Tanx.Vector3(0, -1, 0)
	spot_light.SpotInnerAngle = Tanx.Radian(math.pi * 0.1)
	spot_light.SpotOuterAngle = Tanx.Radian(math.pi * 0.6)
	spot_light.CastShadows = true
	world:createAppearance("SpotLight1", spot_light):getParentNode():setPosition(Tanx.Vector3(7, 15, 0))
	world:createAppearance("SpotLight2", spot_light):getParentNode():setPosition(Tanx.Vector3(-7, 15, 0))

	local ground = Tanx.UnitConfig(world:getUnitConfig"Tanx/Core/Plane")
	ground.RigidBodies:at(0).Shape:get().Scale = Tanx.Vector3(100, 100, 100)
	ground.Nodes:at(0).Appearances:at(0):get():toDerived().Scale = Tanx.Vector3(1, 1, 1)
	ground.Nodes:at(0).Appearances:at(0):get():toDerived().MaterialMap:at(0).MaterialName = "Pool/Floor"
	ground.Nodes:at(0).Appearances:at(0):get():toDerived().MaterialMap:at(0).CastShadows = false
	ground.RigidBodies:at(0).MotionType = Havok.hkpMotion.MotionType.FIXED
	ground.RigidBodies:at(0).QualityType = Havok.hkpCollidableQualityType.FIXED
	world:createAgent(ground, "Ground", makeRigidBodyState(Tanx.Vector3(0, 0, 0)))

	world:createAgent("Pool/Table", "Table", makeRigidBodyState(Tanx.Vector3(0, 5.6, 0)))

	world:createAgent("Pool/Ball_White", "Ball0", makeRigidBodyState(Tanx.Vector3(-8, 6, 0.04), nil, Tanx.Vector3(6, 0, 0)))

	local ball = Tanx.UnitConfig(world:getUnitConfig"Pool/Ball_White")

	local i
	for i = 1, 15 do
		ball.Nodes:at(0).Appearances:at(0):get():toDerived().MaterialMap:at(0).MaterialName = "Pool/Balls/P" .. i
		world:createAgent(ball, "Ball%index", makeRigidBodyState(Tanx.Vector3(1, 12 + i * 0.8, 0)))
	end

	local camera = world:createCamera"Default"
	camera:setNearClipDistance(0.1)
	camera:setFarClipDistance(1e+6)
	camera:setPosition(Tanx.Vector3(23.3, 16, 28.18))
	camera:lookAt(Tanx.Vector3(0, 6, 0))
	world:setCurrentCamera"Default"
end
