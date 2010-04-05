--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	VehicleCamera.lua
--]]

Tanx.log("[VehicleCamera.lua]: parsed.")


class"VehicleCamera"

	function VehicleCamera:__init(target, world, name, cameraparams)
		cameraparams = cameraparams or {}
		cameraparams.NearClipDistance = cameraparams.NearClipDistance or 0.1
		cameraparams.FarClipDistance = cameraparams.FarClipDistance or 1000
		cameraparams.Fovy = cameraparams.Fovy or math.pi * 0.3
		cameraparams.AspectRatio = cameraparams.AspectRatio or (4 / 3)
		cameraparams.Height = cameraparams.Height or 1.2
		cameraparams.Radius = cameraparams.Radius or 3
		cameraparams.BaseDirection = cameraparams.BaseDirection or Tanx.Vector3(0, 0.4, -1)
		if cameraparams.RearCamera then
			cameraparams.RearCamera.Direction = cameraparams.RearCamera.Direction or Tanx.Vector3(0, -0.2, 1)
			cameraparams.RearCamera.NearClipDistance = cameraparams.RearCamera.NearClipDistance or cameraparams.NearClipDistance
			cameraparams.RearCamera.FarClipDistance = cameraparams.RearCamera.FarClipDistance or cameraparams.FarClipDistance
			cameraparams.RearCamera.Fovy = cameraparams.RearCamera.Fovy or math.pi * 0.36
			cameraparams.RearCamera.AspectRatio = cameraparams.RearCamera.AspectRatio or 3.4
			cameraparams.RearCamera.Position = cameraparams.RearCamera.Position or Tanx.Vector3(0, 1.4, 0.8)
		end

		self.Target = Tanx.AgentWeakPtr(target)
		self.Radius = cameraparams.Radius
		self.BaseDirection = cameraparams.BaseDirection

		self.Camera = world:createCamera(name)
		self.Camera:setNearClipDistance(cameraparams.NearClipDistance)
		self.Camera:setFarClipDistance(cameraparams.FarClipDistance)
		self.Camera:setFOVy(Tanx.Radian(cameraparams.Fovy))
		self.Camera:setAspectRatio(cameraparams.AspectRatio)

		self.Node = target:get():getMainBody():get():getNode():toDerived():createChildSceneNode(Tanx.Vector3(0, cameraparams.Height, 0))
		--self.Node:setOrientation(Tanx.Quaternion(Tanx.Radian(-math.pi / 2), Tanx.Vector3.UNIT_Y))
		self.Node:setInheritOrientation(false)
		self.Node:attachObject(self.Camera)

		self.Camera:setPosition(self:idealDirection() * self.Radius)
		self.Camera:lookAt(self.Node:_getDerivedPosition())

		if cameraparams.RearCamera then
			self.RearCameraDirection = cameraparams.RearCamera.Direction

			self.RearCamera = world:createCamera(name .. "_Rear")
			self.RearCamera:setNearClipDistance(cameraparams.RearCamera.NearClipDistance)
			self.RearCamera:setFarClipDistance(cameraparams.RearCamera.FarClipDistance)
			self.RearCamera:setFOVy(Tanx.Radian(cameraparams.RearCamera.Fovy))
			self.RearCamera:setAspectRatio(cameraparams.RearCamera.AspectRatio)

			local body = self.Target:lock():get():getMainBody()
			self.Node:attachObject(self.RearCamera)
			self.RearCamera:setPosition(body:get():getOrientation() * cameraparams.RearCamera.Position)
			self.RearCamera:lookAt(self.Node:_getDerivedPosition() + self.RearCamera:getPosition() + body:get():getOrientation() * self.RearCameraDirection)

			local i
			for i = 0, target:get():getMainNode():numChildren() - 1 do
				local obj = target:get():getMainNode():getChild(i):toDerived():getAttachedObject(0)
				--Tanx.log("[VehicleCamera.lua]: child[" .. i .. "] type: " .. obj:getMovableType())
				if obj:getMovableType() == "MovablePlane" then
					self.RearCamera:enableReflection(obj:toDerived())
					Tanx.log("[VehicleCamera.lua]: reflection enabled.", Ogre.LogMessageLevel.TRIVIAL)
				end
			end
			--local mirror = target:get():getMainNode():getChild(2):toDerived():getAttachedObject(0):toDerived()
			--Tanx.log("[VehicleCamera.lua]: mirror type: " .. mirror:getMovableType())
			--self.RearCamera:enableReflection(mirror)
		end
	end

	function VehicleCamera:step(elapsed)
		self.Camera:setPosition(self:idealDirection() * self.Radius)
		self.Camera:lookAt(self.Node:_getDerivedPosition())

		if self.RearCamera then
			local body = self.Target:lock():get():getMainBody()
			self.RearCamera:lookAt(self.Node:_getDerivedPosition() + self.RearCamera:getPosition() + body:get():getOrientation() * self.RearCameraDirection)
		end
	end

	function VehicleCamera:getCamera()
		return self.Camera
	end

	function VehicleCamera:getRearCamera()
		return self.RearCamera
	end

	function VehicleCamera:idealDirection()
		assert(not self.Target:expired())

		local body = self.Target:lock():get():getMainBody()
		local orientation = body:get():getOrientation()
		local velocity = body:get():getLinearVelocity()

		local base = orientation * self.BaseDirection

		local direction = base - velocity:normalisedCopy() * math.pow(velocity:length() * 0.2, 0.7) * 0.4

		return direction:normalisedCopy() * math.pow(direction:length(), 0.6)
	end
