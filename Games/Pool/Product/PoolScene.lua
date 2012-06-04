--[[
	PoolScene.lua
--]]

Tanx.log("[Test\\PoolScene.lua]: parsed.", Ogre.LogMessageLevel.TRIVIAL, false)

Tanx.require"Core:SlottedRenderTargetListener.lua"


g_Listeners = {}


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
	spot_light.DiffuseColour = Tanx.ColourValue(0.92, 0.8, 0.7, 1)
	spot_light.SpecularColour = Tanx.ColourValue(0.92, 0.8, 0.7, 1)
	spot_light.Direction = Tanx.Vector3(0, -1, 0)
	spot_light.SpotInnerAngle = Tanx.Radian(math.pi * 0.1)
	spot_light.SpotOuterAngle = Tanx.Radian(math.pi * 0.9)
	spot_light.CastShadows = true
	world:createAppearance("SpotLight1", spot_light):getParentNode():setPosition(Tanx.Vector3(8, 15, 0))
	world:createAppearance("SpotLight2", spot_light):getParentNode():setPosition(Tanx.Vector3(-8, 15, 0))

	local ground = Tanx.UnitConfig(world:getUnitConfig"Tanx/Core/Plane")
	ground.RigidBodies:at(0).Shape:get().Scale = Tanx.Vector3(100, 100, 100)
	ground.Nodes:at(0).Appearances:at(0):get():toDerived().Scale = Tanx.Vector3(1, 1, 1)
	ground.Nodes:at(0).Appearances:at(0):get():toDerived().MaterialMap:at(0).MaterialName = "Pool/Floor"
	ground.Nodes:at(0).Appearances:at(0):get():toDerived().MaterialMap:at(0).CastShadows = false
	ground.RigidBodies:at(0).MotionType = Havok.hkpMotion.MotionType.FIXED
	ground.RigidBodies:at(0).QualityType = Havok.hkpCollidableQualityType.FIXED
	world:createAgent(ground, "Ground", makeRigidBodyState(Tanx.Vector3(0, 0, 0)))

	world:createAgent("Pool/Table", "Table", makeRigidBodyState(Tanx.Vector3(0, 5.6, 0)))

	local wball = world:createAgent("Pool/Ball_White", "Ball0", makeRigidBodyState(Tanx.Vector3(-8, 6, 0.04), nil, Tanx.Vector3(6, 0, 0)))
	createEnvironmentMap(wball, world)

	local ball = Tanx.UnitConfig(world:getUnitConfig"Pool/Ball_White")

	local i
	for i = 1, 15 do
		ball.Nodes:at(0).Appearances:at(0):get():toDerived().MaterialMap:at(0).MaterialName = "Pool/Balls/P" .. i
		local agent = world:createAgent(ball, "Ball%index", makeRigidBodyState(Tanx.Vector3(1, 12 + i * 0.8, 0)))
		createEnvironmentMap(agent, world)
	end

	local camera = world:createCamera"Default"
	camera:setNearClipDistance(0.1)
	camera:setFarClipDistance(1e+6)
	camera:setPosition(Tanx.Vector3(23.3, 16, 28.18))
	camera:lookAt(Tanx.Vector3(0, 6, 0))
	world:setCurrentCamera"Default"

	g_MainViewport = camera:getViewport()
end


function finalize()
	g_Listeners = {}
end


function createEnvironmentMap(agent, world)
	local agentname = agent:get():getName()

	local camera = world:createCamera(agentname .. "_camera")
	camera:setNearClipDistance(0.1)
	camera:setFarClipDistance(1e+6)
	camera:setFOVy(Ogre.Radian(math.pi * 0.99))
	camera:setAspectRatio(1)

	local entity = agent:get():getNode():getChild(0):getChild(0):toDerived():getAttachedObject(0):toDerived()

	local texname = agentname .. "_envmap"
	local tex = Ogre.TextureManager.getSingleton():createManual2(texname, Ogre.ResourceGroupManager.DEFAULT_RESOURCE_GROUP_NAME, Ogre.TextureType['2D'], 256, 256, 0, Ogre.PixelFormat.R8G8B8, Ogre.TextureUsage.RENDERTARGET)
	local target = tex:get():getBuffer():get():getRenderTarget()
	target:addViewport(camera):setMaterialScheme"Spherical"
	local l = Tanx.SlottedRenderTargetListener{
		preRenderTargetUpdate = function()
			entity:setVisible(false)

			camera:setPosition(agent:get():getMainBody():get():getPosition())
			camera:lookAt(g_MainViewport:getCamera():getDerivedPosition())
			camera:setFixedYawAxis(true, g_MainViewport:getCamera():getRealUp())
		end,
		postRenderTargetUpdate = function()
			entity:setVisible(true)
		end,
		onDestroy = function(self)
			target:removeListener(self)
		end,
	}
	target:addListener(l)
	table.insert(g_Listeners, l)

	local material = entity:getSubEntity(0):getMaterial()
	material:get():getTechnique(0):getPass"Env":getTextureUnitState(0):setTextureName(texname)
end