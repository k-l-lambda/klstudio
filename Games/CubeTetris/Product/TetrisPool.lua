--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	TetrisPool.lua
--]]

Tanx.log("[Tetris\\TetrisPool.lua]: parsed.")


local s_BrickConfigNames =
{
	"Tetris/Brick4_0",
	"Tetris/Brick4_1",
	"Tetris/Brick4_2",
	"Tetris/Brick4_3",
	"Tetris/Brick4_4",
	"Tetris/Brick4_5",
	"Tetris/Brick4_6",
	"Tetris/Brick4_7",
}

local s_BrickMaterials =
{
	"Tetris/Brick/White",
	"Tetris/Brick/Red",
	"Tetris/Brick/Green",
	"Tetris/Brick/Blue",
	"Tetris/Brick/Yellow",
	"Tetris/Brick/Brown",
	"Tetris/Brick/Cyan",
	"Tetris/Brick/Pink",
	"Tetris/Brick/Purple",
	"Tetris/Brick/Black",
}


local s_UpDirection = Tanx.Vector3.UNIT_Y

local s_DefaultFreezeTime = 1.6
local s_InitBodiesActiveTime = 1

local s_GridSize = 1.07
local s_GridYSize = 1

local s_DefaultTopHeight = 30

local s_CubeRisingInterval = 0.08


local function createTopBoardConfig()
	local config = Tanx.EntityAppearanceConfig()
	config.MeshName = "Prefab_Plane"
	config.CastShadows = false
	config.Scale = Tanx.Vector3(0.021)
	config.Rotation = Tanx.Quaternion(Tanx.Radian(math.pi / 2), Tanx.Vector3.UNIT_X)
	config.MaterialMap:at(0).MaterialName = "Tetris/TopBoard"

	return config
end
local s_TopBoardConfig = s_TopBoardConfig or createTopBoardConfig()


local function addCollisionListenerForAgent(agent, listener)
	local i
	for i = 0, agent:get():getBodies():size() - 1 do
		agent:get():getBodies():at(i):get():addCollisionListener(listener)
	end
end

local function removeCollisionListenerForAgent(agent, listener)
	local i
	for i = 0, agent:get():getBodies():size() - 1 do
		agent:get():getBodies():at(i):get():removeCollisionListener(listener)
	end
end


local function dropBrick(self)
	if self.Callbacks.onDropingBrick then
		self.Callbacks.onDropingBrick(self)
	end

	local config = s_BrickConfigNames[self.Random(#s_BrickConfigNames)]
	local brick = Tanx.AgentPtr(self.Game:getWorld():createAgent(self.AgentsNode, config, "brick%index", Tanx.RigidBodyState.make(Tanx.Vector3(self.Center.x - 1e-3, self.TopHeight + s_GridYSize, self.Center.z - 1e-3))))

	self.FocusBrickAction = FocusBrickAction(brick, self)
	self.Game:getWorld():addAction(Havok.hkpActionPtr(self.FocusBrickAction))

	self.StillTime = 0

	addCollisionListenerForAgent(brick, g_FocusBrickCollisionListener)

	Tanx.log("[Tetris\\TetrisPool.lua]: brick dropped.", Ogre.LogMessageLevel.TRIVIAL)

	return brick, config
end


local function isStill(agent)
	local body = agent:get():getMainBody()
	return body:get():getLinearVelocity():length() < 4e-2 and body:get():getAngularVelocity():length() < 9e-2
end


local function isBodyStill(body)
	return body:get():getLinearVelocity():length() < 8e-2 and body:get():getAngularVelocity():length() < 0.1
end


local function setBrickMaterial(brick, materialname)
	local node = brick:get():getNode()
	local i
	for i = 0, node:numChildren() - 1 do
		node:getChild(i):getChild(0):toDerived():getAttachedObject(0):toDerived():setMaterialName(materialname)
	end
end


local function freezeBrick(brick, changematerial)
	brick:get():freeze()

	if changematerial ~= false then
		setBrickMaterial(brick, "Tetris/Brick/Gray")
	end
end


local function updateControlIndicators(root, nodes, force, torque, elapsed)
	local computeOrient = function(v)
		local x = v:crossProduct(Tanx.Vector3.UNIT_Y):normalisedCopy()
		local y = v:normalisedCopy()
		local z = x:crossProduct(y)
		return Tanx.Quaternion(x, y, z)
	end

	if force then
		nodes.Arrow:setOrientation(root:getOrientation() * computeOrient(force))
		nodes.Arrow:setScale(Tanx.Vector3(1, force:length() * 0.038, 1) * 0.2)
		nodes.Arrow:setVisible(true)
	else
		nodes.Arrow:setVisible(false)
	end

	if torque then
		nodes.Ball:rotate(torque, Tanx.Radian(torque:length() * 0.0001 * elapsed), Ogre.Node.TransformSpace.WORLD)
		nodes.Ball:setVisible(true)
	end
end


local function manipulateBrickCube(pool, body, elapsed)
	local force, torque

	if pool.Controller then
		local state = pool.Controller:getManipulatorState()
		local sideDirection = pool.FrontDirection:crossProduct(s_UpDirection)
		if state.MoveX ~= 0 or state.MoveY ~= 0 or state.MoveZ ~= 0 then
			force = (sideDirection * state.MoveX + pool.FrontDirection * state.MoveZ) * 40 + s_UpDirection * state.MoveY * 320
			body:applyForce(elapsed, Tanx.madp(force))

			pool.StillTime = 0
		end

		if state.RotateX ~= 0 or state.RotateY ~= 0 or state.RotateZ ~= 0 then
			torque = (sideDirection * state.RotateX + s_UpDirection * state.RotateY + pool.FrontDirection * state.RotateZ) * 2
			body:applyTorque(elapsed, Tanx.madp(torque))

			pool.StillTime = 0
		end
	end

	if pool.ControlIndicatorNodes then
		updateControlIndicators(pool.RootNode, pool.ControlIndicatorNodes, force, torque, elapsed)
	end
end

local function processManipulation(self, state, elapsed)
	if state.ViewX ~= 0 then
		self.RootNode:yaw(Tanx.Radian(-state.ViewX * elapsed * 0.4), Ogre.Node.TransformSpace.LOCAL)

		local yaw = self.RootNode:getOrientation():getYaw(true):valueRadians()
		if math.abs(yaw) < math.pi / 4 then
			self.FrontDirection = Tanx.Vector3.UNIT_Z
		elseif math.abs(yaw) > math.pi * 0.75 then
			self.FrontDirection = Tanx.Vector3.NEGATIVE_UNIT_Z
		elseif yaw > math.pi * -0.75 and yaw < math.pi * -0.25 then
			self.FrontDirection = Tanx.Vector3.UNIT_X
		elseif yaw > math.pi * 0.25 and yaw < math.pi * 0.75 then
			self.FrontDirection = Tanx.Vector3.NEGATIVE_UNIT_X
		end
	end

	if state.MoveX ~= 0 or state.MoveY ~= 0 or state.MoveZ ~= 0 or state.RotateX ~= 0 or state.RotateY ~= 0 or state.RotateZ ~= 0 then
		if self.FocusBrick then
			self.FocusBrick:get():getMainBody():get():getRigidBody():get():activate()
		end
	end
end


local function fillBodyToHeap(self, body)
	local position = body:get():getNode():getPosition()
	local posx = (position.x - self.Center.x) / s_GridSize + 2.5
	local posy = position.y / s_GridYSize + 0.5
	local posz = (position.z - self.Center.z) / s_GridSize + 2.5

	local x, y, z
	for x = math.floor(posx + 0.3), math.ceil(posx - 0.3) do
		for y = math.floor(posy + 0.3), math.ceil(posy - 0.3) do
			for z = math.floor(posz + 0.3), math.ceil(posz - 0.3) do
				self.Heap:set(x, y, z, self.Heap:get(x, y, z) or true)
			end
		end
	end

	self.Heap:set(math.floor(posx + 0.5), math.floor(posy + 0.5), math.floor(posz + 0.5), Tanx.BodyPtr(body))

	return math.floor(posy + 0.5)
end


local function fillBrickToHeap(self, brick)
	local yset = {}

	local bodies = self.Game:getWorld():detachAgent(brick)
	local i
	for i = 0, bodies:size() - 1 do
		local y = fillBodyToHeap(self, bodies:at(i))
		yset[y] = true
	end

	return yset
end


local function checkClearLayer(self, y)
	--Tanx.log("[Tetris\\TetrisPool.lua]: checkClearLayer " .. y)
	local x, z
	for x = 1, 4 do
		for z = 1, 4 do
			--Tanx.log(string.format("[Tetris\\TetrisPool.lua]: checkClearLayer heap(%d, %d, %d): %s", x, y, z, type(self.Heap:get(x, y, z))))
			if type(self.Heap:get(x, y, z)) ~= "userdata" then
				return false
			end
		end
	end

	-- do clear
	for x = 1, 4 do
		for z = 1, 4 do
			table.insert(self.CleaningCubes, {body = self.Heap:get(x, y, z), remain = 0.4})
			self.Heap:set(x, y, z)
		end
	end
	Tanx.log("[Tetris\\TetrisPool.lua]: layer[" .. y .. "] cleared.", Ogre.LogMessageLevel.TRIVIAL)

	if g_Sounds then
		g_Sounds.LayerClearSound:get():play()
	end

	return true
end


local function activateBodiesLayer(self, layer)
	local x, z
	for x = 1, 4 do
		for z = 1, 4 do
			local value = self.Heap:get(x, layer, z)
			self.Heap:set(x, layer, z)
			if type(value) == "userdata" then
				value:get():unfreeze()
				value:get():getRigidBody():get():activate()
				table.insert(self.ActiveBodies, value)
			end
		end
	end
end


local function activateBodies(self, layer)
	local y
	for y = layer + 1, self.Heap:maxY() do
		activateBodiesLayer(self, y)
	end
end


local function fillBlocksLayer(self, y, mat_index, space)
	space = space or {min = 1, max = 3}

	local x, z
	for x = 1, 4 do
		for z = 1, 4 do
			local uc = Tanx.UnitConfig(self.Game:getWorld():getUnitConfig"Tetris/Brick1_0")
			local material = s_BrickMaterials[mat_index or self.Random(#s_BrickMaterials)]
			local f
			for f = 0, 5 do
				uc.Nodes:at(0).Appearances:at(0):get():toDerived().MaterialMap:at(f).MaterialName = material
			end
			local block = self.Game:getWorld():createAgent(self.AgentsNode, uc, "brick%index", Tanx.RigidBodyState.make(Tanx.Vector3(self.Center.x + (x - 2.5) * s_GridSize, y - 0.5, self.Center.z + (z - 2.5) * s_GridSize)))
			freezeBrick(block, false)
			self.Heap:set(x, y, z, Tanx.BodyPtr(self.Game:getWorld():detachAgent(block):at(0)))
		end
	end

	local i
	for i = 1, space.min + self.Random(space.max - space.min + 1) - 1 do
		self.Heap:set(self.Random(4), y, self.Random(4))
	end
end

local function fillBlocks(self, height)
	local y
	for y = 1, height do
		fillBlocksLayer(self, y)
	end
end


class "SimpleCollisionListener" (Tanx.CollisionListener)

	function SimpleCollisionListener:__init(cpcomfirmed)
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			Tanx.CollisionListener.__init(self)
		else
			super()
		end

		self.FnContactPointConfirmed = cpcomfirmed
	end

	function SimpleCollisionListener:contactPointConfirmedCallback(event)
		self.FnContactPointConfirmed(event)
	end

	function SimpleCollisionListener:contactPointAddedCallback(event)
	end

	function SimpleCollisionListener:contactPointRemovedCallback(event)
	end

	function SimpleCollisionListener:contactProcessCallback(event)
	end



class "FocusBrickAction" (Tanx.ArrayAction)

	function FocusBrickAction:__init(agent, pool)
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			Tanx.ArrayAction.__init(self, agent)
		else
			super(agent)
		end

		self.Pool = pool
	end

	function FocusBrickAction:applyAction(elapsed)
		local i
		for i = 0, self.m_RigidBodies:size() - 1 do
			local body = self.m_RigidBodies:at(i):get()
			alignRigidbody(body, elapsed, self.Pool.Center)
			manipulateBrickCube(self.Pool, body, elapsed)
		end
	end

	--function FocusBrickAction:__finalize()
	--	Tanx.log("[Tetris\\TetrisPool.lua]: FocusBrickAction:__finalize.")
	--end


class "TetrisPool"

	function TetrisPool:__init(game, controller, cameranode, paramters)
		paramters = paramters or {}

		self.Game = game
		self.Controller = controller
		self.CameraNode = cameranode
		self.Center = paramters.Center or {x = 0, z = 0}
		self.FrontDirection = Tanx.Vector3.UNIT_Z
		self.Heap = CubeGrid()
		self.StillTime = 0
		self.FreezeTime = paramters.FreezeTime or s_DefaultFreezeTime
		self.ActiveBodies = {}
		self.BodiesActiveTime = 0
		self.TopHeight = paramters.TopHeight or math.max(s_DefaultTopHeight, (paramters.BlockLayers or 0) + 4)
		self.End = false
		self.RisingCubes = {}
		self.RisingTime = s_CubeRisingInterval
		--self.ClearedLayers = 0
		self.ShowBrickFreezeClock = (paramters.ShowBrickFreezeClock == nil) or paramters.ShowBrickFreezeClock
		self.ControlIndicatorNodes = paramters.ControlIndicatorNodes
		self.CleaningCubes = {}
		self.Callbacks = paramters.Callbacks or {}
		self.ScorePanel = paramters.ScorePanel or {}
		self.Random = paramters.Random or Tanx.random

		if self.Controller then
			self.Controller.Center = self.Center
			self.Controller.Heap = self.Heap
		end

		local pivot = Tanx.Vector3(self.Center.x, 0, self.Center.z)

		g_PoolIndex = (g_PoolIndex or 0) + 1
		self.RootNode = paramters.RootNode or self.Game:getWorld():getRootSceneNode():createChildSceneNodeInheritName("PoolRoot" .. g_PoolIndex)
		self.RootNode:setPosition(pivot)
		self.AgentsNode = self.RootNode:createChildSceneNodeInheritName("PoolAgents" .. g_PoolIndex, -pivot)

		-- create fence
		self.Fence = game:getWorld():createAgent(self.AgentsNode, "Tetris/Fence4x4", "fence%index", Tanx.RigidBodyState.make(pivot)):get():getName()

		-- create top board
		self.TopBoardNode = game:getWorld():createAppearance(self.AgentsNode, "TopBoard", s_TopBoardConfig):getParentSceneNode()
		self.TopBoardNode:setPosition(self.Center.x, self.TopHeight, self.Center.z)

		if paramters.BlockLayers then
			fillBlocks(self, paramters.BlockLayers)
		end

		-- adjust camera height to ideal position
		self:adaptCameraHeight()

		self.Active = true
	end

	function TetrisPool:__finalize()
		--Tanx.log("[Tetris\\TetrisPool.lua]: TetrisPool:__finalize.")

		-- remove agent of fence
		local fence = self.Game:getWorld():findAgent(self.Fence)
		if fence:get() then
			self.Game:getWorld():detachAgent(fence)
			Tanx.log("[Tetris\\TetrisPool.lua]: fence detached.", Ogre.LogMessageLevel.TRIVIAL)
		else
			--Tanx.log("[Tetris\\TetrisPool.lua]: cannot find agnet of fence.", Ogre.LogMessageLevel.TRIVIAL)
		end

		if self.Controller then
			self.Controller.Heap = nil
		end

		--self.Game:getWorld():getRootSceneNode():removeAndDestroyChild(self.RootNode:getName())
	end

	function TetrisPool:step(elapsed)
		if #self.ActiveBodies > 0 then
			if #self.CleaningCubes == 0 then
				if self.BodiesActiveTime > 0 then
					self.BodiesActiveTime = self.BodiesActiveTime - elapsed
				else
					local i, body
					for i, body in pairs(self.ActiveBodies) do
						if isBodyStill(body) then
							body:get():freeze()
							local y = fillBodyToHeap(self, body)
							table.remove(self.ActiveBodies, i)

							-- clear layer during body active time
							if checkClearLayer(self, y) then
								if self.Callbacks.onLayersCleared then
									self.Callbacks.onLayersCleared(self, y, {y})
								end

								activateBodies(self, y)
								self.BodiesActiveTime = s_InitBodiesActiveTime
							end

							break
						end
					end
				end
			end

			local i, body
			for i, body in pairs(self.ActiveBodies) do
				alignRigidbody(body:get():getRigidBody():get(), elapsed, self.Center)
			end
		else
			if self.Active and not self.End and self.FocusBrick == nil and self.BigCube == nil then
				local config
				self.FocusBrick, config = dropBrick(self)
				if self.Controller then
					self.Controller:brickDropped(Tanx.AgentWeakPtr(self.FocusBrick), config)
				end
			end
		end

		if self.FocusBrick and isStill(self.FocusBrick) then
			if self.StillTime > self.FreezeTime then
				freezeBrick(self.FocusBrick)
				if g_Sounds then
					g_Sounds.BrickFreeze:get():play()
				end
				removeCollisionListenerForAgent(self.FocusBrick, g_FocusBrickCollisionListener)
				local yset = fillBrickToHeap(self, self.FocusBrick)

				if self.Callbacks.onBrickFrozen then
					self.Callbacks.onBrickFrozen(self, yset)
				end

				-- clear layers
				local y, v
				local cleared_y
				local layers = {}
				for y, v in pairs(yset) do
					if checkClearLayer(self, y) then
						table.insert(layers, y)
						cleared_y = math.min(cleared_y or y, y)
					end
				end

				if cleared_y then
					if self.Callbacks.onLayersCleared then
						self.Callbacks.onLayersCleared(self, cleared_y, layers)
					end

					activateBodies(self, cleared_y)
					self.BodiesActiveTime = s_InitBodiesActiveTime
				end

				self.FocusBrick = nil
				self.FocusBrickAction:close()
				self.FocusBrickAction = nil
				self.Controller.FocusBrick = nil

				-- check whether it's end
				if cleared_y == nil then
					local top = 0
					local y, _
					for y, _ in pairs(yset) do
						if y > top then
							top = y
						end
					end
					--Tanx.log("top: " .. top .. ", " .. self.TopHeight)

					if self.TopHeight and top > self.TopHeight then
						if self.Callbacks.onGameOver then
							self.Callbacks.onGameOver(self)
						end

						self.End = true
						if g_Sounds then
							g_Sounds.GameOver:get():play()
						end
						Tanx.log("[Tetris\\TetrisPool.lua]: pool end.")
					end
				end
			else
				if self.ShowBrickFreezeClock and g_GuiWindows then
					g_GuiWindows.BrickFreezeClock:show()
					g_GuiWindows.BrickFreezeClock:setText(CEGUI.String(tostring(math.floor((1 - self.StillTime / self.FreezeTime) * 5))))
					--Tanx.log("StillTime 1: " .. self.StillTime .. ", " .. elapsed)
				end
			end
			self.StillTime = self.StillTime + elapsed
		else
			self.StillTime = 0

			if self.ShowBrickFreezeClock and g_GuiWindows then
				g_GuiWindows.BrickFreezeClock:hide()
			end
		end

		-- process rising cubes
		if self.End then
			self.RisingTime = self.RisingTime - elapsed
			if self.RisingTime <= 0 then
				self.RisingTime = s_CubeRisingInterval

				local layer = self.Heap.Blocks[self.Heap:maxY()]
				if layer then
					local x, line
					for x, line in pairs(layer) do
						local z, cube
						for z, cube in pairs(line) do
							self.Heap:set(x, self.Heap:maxY(), z)
							if type(cube) == "userdata" then
								cube:get():unfreeze()
								cube:get():getNode():getChild(0):toDerived():getAttachedObject(0):toDerived():setMaterialName("Tetris/Brick/Crystalloid")
								table.insert(self.RisingCubes, {cube = cube, force = self.Random() * 18 + 12})
							end

							break
						end
						break
					end
				end
			end
		end

		local i, unit
		for i, unit in pairs(self.RisingCubes) do
			local position = unit.cube:get():getPosition()
			local x = position.x - self.Center.x
			local z = position.z - self.Center.z
			local forcey = iif(x * x + z * z > 7, 0, unit.force)

			local force = Tanx.Vector3(self.Random() * 18 - 9 + x * 0.3, forcey, self.Random() * 18 - 9 + z * 0.3)
			--Tanx.log("force: " .. tostring(force))
			unit.cube:get():getRigidBody():get():applyForce(elapsed, Tanx.madp(force))
		end

		-- process big cube
		--if self.BigCube and not self.BigCube:get():getBodies():at(0):get():isFrozen() then
		--end

		-- process cleaning cubes
		do
			local i, cube
			for i, cube in ipairs(self.CleaningCubes) do
				local odd = (math.floor(cube.remain / 0.08) % 2) > 0
				cube.body:get():getObject():setMaterialName(iif(odd, "Tetris/Brick/Cleaning/0", "Tetris/Brick/Cleaning/1"))

				cube.remain = cube.remain - elapsed
			end

			tableext.remove_if(self.CleaningCubes, function(x) return x.remain <= 0 end)
		end

		if self.Controller then
			self.Controller:step(elapsed)

			processManipulation(self, self.Controller:getManipulatorState(), elapsed)
		end

		-- adjust camera height
		if not self.End and self.CameraNode and #self.ActiveBodies == 0 then
			local ideal = self:idealCameraHeight()
			local differ = ideal - self.CameraNode:getPosition().y
			local delta = iif(differ > 0, elapsed, -elapsed) * math.max(0.6, math.abs(differ) * 0.8)
			if math.abs(delta) > math.abs(differ) then
				delta = differ
			end

			self.CameraNode:translate(0, delta, 0)
		end
	end

	function TetrisPool:isEnd(elapsed)
		return self.End, self.End and self.Heap:maxY() == 0
	end

	function TetrisPool:heapHeight()
		return self.Heap:maxY()
	end

	function TetrisPool:stop()
		if self.FocusBrickAction then
			self.FocusBrickAction:close()
			self.FocusBrickAction.Pool = nil
			self.FocusBrickAction = nil
		end

		if self.BigCube then
			g_World:detachAgent(self.BigCube)
			self.BigCube = nil
			--self.BigCubeListener = nil
		end

		if self.FocusBrick then
			removeCollisionListenerForAgent(self.FocusBrick, g_FocusBrickCollisionListener)
			self.Game:getWorld():detachAgent(self.FocusBrick)
		end

		self.RisingCubes = {}

		-- remove agent of fence
		local fence = self.Game:getWorld():findAgent(self.Fence)
		if fence:get() then
			self.Game:getWorld():detachAgent(fence)
		end

		if self.Controller then
			self.Controller.Heap = nil
			self.Controller = nil
		end

		if self.ControlIndicatorNodes then
			self.ControlIndicatorNodes.Arrow:setVisible(false)
			self.ControlIndicatorNodes.Ball:setVisible(false)
		end

		if self.TopBoardNode then
			self.TopBoardNode:setVisible(false)
		end

		self.Heap:clear()
	end

	function TetrisPool:pause()
		self.Active = false

		if self.FocusBrick and self.FocusBrick:get() then
			self.FocusBrick:get():freeze()
		end
	end

	function TetrisPool:activate()
		self.Active = true

		if self.FocusBrick and self.FocusBrick:get() then
			self.FocusBrick:get():unfreeze()
		end
	end

	function TetrisPool:activateBlocks(layer)
		activateBodiesLayer(self, layer)
		self.BodiesActiveTime = s_InitBodiesActiveTime
	end

	function TetrisPool:dropBigCube(params)
		params = params or {}
		params.height = params.height or 60

		local config = Tanx.UnitConfig(g_World:getUnitConfig"Tetris/Brick8_0_2")
		if params.material then
			local i, j
			for i = 0, 7 do
				-- set material
				local mmap = config.Nodes:at(i).Appearances:at(0):get():toDerived().MaterialMap
				for j = 0, mmap:size() - 1 do
					mmap:at(j).MaterialName = params.material
				end
			end
		end
		self.BigCube = g_World:createAgent(self.AgentsNode, config, "bigcube%index", Tanx.RigidBodyState.make(Tanx.Vector3(self.Center.x - 1, params.height, self.Center.z - 1)))

		self.BigCubeListener = SimpleCollisionListener(function(event)
			if self.BigCube then
				local rbb = event.m_collidableB:getRigidBody()
				if rbb and rbb:isFixed():get() and (event.m_collidableB:getShape():getType() == Havok.hkpShapeType.BOX or self.BigCube:get():getMainNode():getPosition().y < 1.2) then
					--Tanx.log("[Tetris\\TetrisPool.lua]: big cube collision.")

					local bodies = self.Game:getWorld():detachAgent(self.BigCube)
					local i
					for i = 0, bodies:size() - 1 do
						table.insert(self.CleaningCubes, {body = Tanx.BodyPtr(bodies:at(i)), remain = 0.8})
					end
					self.BigCube = nil
					--self.BigCubeListener = nil

					if g_Sounds then
						g_Sounds.LayerClearSound:get():play()
					end
				end
			end
		end)
		local i
		for i = 0, self.BigCube:get():getBodies():size() - 1 do
			self.BigCube:get():getBodies():at(i):get():addCollisionListener(self.BigCubeListener)
		end

		return self.BigCube
	end

	function TetrisPool:fillBlocksLayer(layer, material, space)
		layer = layer or self.Heap:maxY() + 1
		fillBlocksLayer(self, layer, material, space)

		return layer
	end

	function TetrisPool:setTopHeight(height)
		self.TopHeight = height
		if self.TopBoardNode then
			self.TopBoardNode:setPosition(self.Center.x, self.TopHeight, self.Center.z)
		end
	end

	function TetrisPool:changeTopHeight(delta)
		self:setTopHeight(self.TopHeight + delta)
	end

	function TetrisPool:idealCameraHeight()
		local height = self.Heap:maxY() * s_GridYSize + 2

		if self.FocusBrick then
			local bricky = self.FocusBrick:get():getMainBody():get():getPosition().y
			if height < bricky - 12 then
				height = bricky - 12
			end
			if height > bricky + 10 then
				height = bricky + 10
			end
		end

		height = math.min(height, self.TopHeight - 0)
		height = math.max(height, 16)

		return height
	end

	function TetrisPool:adaptCameraHeight()
		if self.CameraNode then
			local ideal = self:idealCameraHeight()
			local differ = ideal - self.CameraNode:getPosition().y
			self.CameraNode:translate(0, differ, 0)
		end
	end


class "FocusBrickCollisionListener" (Tanx.CollisionListener)

	function FocusBrickCollisionListener:__init()
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			Tanx.CollisionListener.__init(self)
		else
			super()
		end

		self.Entities = {}
	end

	function FocusBrickCollisionListener:__finalize()
	end

	function FocusBrickCollisionListener:contactPointAddedCallback(event)
		--Tanx.log(string.format("FocusBrickCollisionListener:contactPointAddedCallback: A shape type: %d, B shape type: %d, contace point: %s.",
		--	event.m_bodyA:getShape():getType(), event.m_bodyB:getShape():getType(), tostring(Tanx.madp(event.m_contactPoint:getPosition()))))
	end

	function FocusBrickCollisionListener:contactPointConfirmedCallback(event)
		--[[if event.m_collidableB:getShape():getType() ~= Havok.hkpShapeType.BOX then
			Tanx.log(string.format("FocusBrickCollisionListener:contactPointConfirmedCallback: A shape type: %d, B shape type: %d, projected velocity: %f, contace point: %s.",
				event.m_collidableA:getShape():getType(), event.m_collidableB:getShape():getType(), event.m_projectedVelocity, tostring(Tanx.madp(event.m_contactPoint:getPosition()))))
		end]]
		if g_Sounds then
			local rba = event.m_collidableA:getRigidBody()
			local rbb = event.m_collidableB:getRigidBody()
			if rba and rbb and (rba:isFixed():get() or rbb:isFixed():get()) and event.m_collidableB:getShape():getType() == Havok.hkpShapeType.BOX then
				local vel = math.abs(event.m_projectedVelocity) - 0.4
				if vel > 0 then
					--Tanx.log(string.format("FocusBrickCollisionListener:contactPointConfirmedCallback: A fixed: %s, B fixed: %s, projected velocity: %f, contace point: %s.",
					--	tostring(rba:isFixed():get()), tostring(rbb:isFixed():get()), event.m_projectedVelocity, tostring(Tanx.madp(event.m_contactPoint:getPosition()))))

					local volume = vel * 0.8
					--Tanx.log("setGain: " .. volume)
					g_Sounds.BrickCollision:get():setGain(volume)
					g_Sounds.BrickCollision:get():play()
				end
			end

			if event.m_collidableA:getShape():getType() == Havok.hkpShapeType.BOX and event.m_collidableB:getShape():getType() == Havok.hkpShapeType.CONVEX_VERTICES then
				local volume = math.abs(event.m_projectedVelocity) / 32
				--Tanx.log("setGain: " .. volume)
				g_Sounds.GlassCollision:get():setGain(volume)
				g_Sounds.GlassCollision:get():play()
			end
		end
	end

	function FocusBrickCollisionListener:contactPointRemovedCallback(event)
		--Tanx.log("FocusBrickCollisionListener:contactPointRemovedCallback: contact point id: " .. event.m_contactPointId)
	end

	function FocusBrickCollisionListener:contactProcessCallback(event)
		--Tanx.log(string.format("FocusBrickCollisionListener:contactProcessCallback: A shape type: %d, B shape type: %d, contance points count: %d",
		--	event.m_collidableA:getShape():getType(), event.m_collidableB:getShape():getType(), event.m_collisionData:getNumContactPoints()))
	end

g_FocusBrickCollisionListener = FocusBrickCollisionListener()
