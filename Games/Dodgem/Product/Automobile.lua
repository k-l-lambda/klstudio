--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\Automobile.lua
--]]

Tanx.log("[Dodgem\\Automobile.lua]: parsed.")


class "Automobile"

	function Automobile:__init(chassis, vehiclemakername, soundsources)
		local maker = Tanx.VehicleBook.getSingleton():at(vehiclemakername)

		self.Chassis = chassis
		self.VehicleAction = maker:make(chassis)
		self.Driver = self.VehicleAction:get().m_deviceStatus:toDerived()

		self.SoundSources = soundsources or {}

		if self.SoundSources.Engine then
			self.SoundSources.Engine:get():setLooping(true)
			self.SoundSources.Engine:get():setGain(0)
			self.SoundSources.Engine:get():play()
		end

		self.CollisionListener = AutomobileCollisionListener(self.SoundSources)
		self.Chassis:get():addCollisionListener(self.CollisionListener)
	end

	function Automobile:__finalize()
		--self.Chassis:get():removeCollisionListener(self.CollisionListener)
	end

	function Automobile:step(elapsed)
		self.RPM = self.VehicleAction:get():calcRPM()
		self.KMPH = self.VehicleAction:get():calcKMPH()
		self.MPH = self.VehicleAction:get():calcMPH()

		--Tanx.log(string.format("[Dodgem\\Automobile.lua]: rpm: %f, kmph: %f, mph: %f.", self.RPM, self.KMPH, self.MPH))

		if self.SoundSources.Engine then
			local position = self.Chassis:get():getPosition()
			local velocity = self.Chassis:get():getLinearVelocity()

			self.SoundSources.Engine:get():setPosition(position.x, position.y, position.z)
			self.SoundSources.Engine:get():setVelocity(velocity.x, velocity.y, velocity.z)
			self.SoundSources.Engine:get():setGain(self.RPM / 2000)
		end
	end


class "AutomobileCollisionListener" (Tanx.CollisionListener)

	function AutomobileCollisionListener:__init(sounds)
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			Tanx.CollisionListener.__init(self)
		else
			super()
		end

		self.Sounds = sounds
	end

	function AutomobileCollisionListener:contactPointAddedCallback(event)
	end

	function AutomobileCollisionListener:contactPointConfirmedCallback(event)
		if event.m_collidableB:getShape():getType() ~= Havok.hkpShapeType.BOX then
			Tanx.log(string.format("AutomobileCollisionListener:contactPointConfirmedCallback: A shape type: %d, B shape type: %d, projected velocity: %f, contace point: %s.",
				event.m_collidableA:getShape():getType(), event.m_collidableB:getShape():getType(), event.m_projectedVelocity, tostring(Tanx.madp(event.m_contactPoint:getPosition()))))
		end
		--[[if self.Sounds then
			local rba = event.m_collidableA:getRigidBody()
			local rbb = event.m_collidableB:getRigidBody()
			if rba and rbb and (rba:isFixed():get() or rbb:isFixed():get()) and event.m_collidableB:getShape():getType() == Havok.hkpShapeType.BOX then
				local vel = math.abs(event.m_projectedVelocity) - 0.4
				if vel > 0 then
					--Tanx.log(string.format("AutomobileCollisionListener:contactPointConfirmedCallback: A fixed: %s, B fixed: %s, projected velocity: %f, contace point: %s.",
					--	tostring(rba:isFixed():get()), tostring(rbb:isFixed():get()), event.m_projectedVelocity, tostring(Tanx.madp(event.m_contactPoint:getPosition()))))

					local volume = vel * 0.8
					self.Sounds.BrickCollision:get():setGain(volume)
					self.Sounds.BrickCollision:get():play()
				end
			end

			if event.m_collidableA:getShape():getType() == Havok.hkpShapeType.BOX and event.m_collidableB:getShape():getType() == Havok.hkpShapeType.CONVEX_VERTICES then
				local volume = math.abs(event.m_projectedVelocity) / 32
				self.Sounds.GlassCollision:get():setGain(volume)
				self.Sounds.GlassCollision:get():play()
			end
		end]]
	end

	function AutomobileCollisionListener:contactPointRemovedCallback(event)
	end

	function AutomobileCollisionListener:contactProcessCallback(event)
	end
