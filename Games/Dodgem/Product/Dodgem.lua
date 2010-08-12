--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\Dodgem.lua
--]]

Tanx.log("[Dodgem\\Dodgem.lua]: parsed.")

Tanx.require"Core:utility.lua"
Tanx.require"Core:bind.lua"
Tanx.require"Core:SlottedContactListener.lua"
Tanx.dofile"Automobile.lua"


local function loadSounds(soundconfig)
	function doLoadSounds()
		soundconfig = soundconfig or {}

		loadsource = function()
			local loadsound = function(filename) return openalpp.Source.new(Tanx.ScriptSpace:resource():get():getResource(filename):get()); end

			return {
				Engine = loadsound"engine.wav",
				EngineEnemy = loadsound"engine_e.wav",
				CollisionBox = loadsound"collision3.wav",
				CollisionConvex = loadsound"collision2.wav",
				CollisionTail = loadsound"TailCollision.wav",
			}
		end

		g_SoundSources = g_SoundSources or loadsource()

		return {
			Engine = g_SoundSources[soundconfig.Engine or "Engine"],
			CollisionBox = g_SoundSources[soundconfig.CollisionBox or "CollisionBox"],
			CollisionConvex = g_SoundSources[soundconfig.CollisionConvex or "CollisionConvex"],
			CollisionTail = g_SoundSources[soundconfig.CollisionTail or "CollisionTail"],
		}
	end

	local s, r = pcall(doLoadSounds)
	if s then
		return r
	end
end


class "Dodgem" (Automobile)

	function Dodgem:__init(world, agent, vehiclemakername, soundconfig, eventhandlers)
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			Automobile.__init(self, agent, vehiclemakername, loadSounds(soundconfig))
		else
			super(agent, vehiclemakername, loadSounds(soundconfig))
		end

		self.World = world

		local chassis = self.Chassis:lock()
		--self.CollisionListener = DodgemCollisionListener(self)
		self.CollisionListener = TanxSlottedContactListener{onContactPointConfirmed = Tanx.bind(self.contactPointConfirmedCallback, self, Tanx._1)}
		chassis:get():addContactListener(self.CollisionListener)

		self.ChassisId = chassis:get():getRigidBody():get():getUid()

		local tail = agent:findBody"tail"
		if tail:get() then
			self.TailId = tail:get():getRigidBody():get():getUid()
		end

		local exist, sparksnode = pcall(function() return chassis:get():getNode():getChildInheritName"Sparks" end)
		if exist then
			self.ChassisSparks = sparksnode:toDerived():getAttachedObject(0):toDerived()
			self.ChassisSparks:getEmitter(0):setEnabled(false)
		end

		self.ChassisSparksTime = 0

		self.EventHandlers = eventhandlers or {}
	end

	function Dodgem:step(elapsed)
		Automobile.step(self, elapsed)

		if self.ChassisSparks and self.ChassisSparksTime > 0 then
			self.ChassisSparksTime = self.ChassisSparksTime - elapsed

			--Tanx.log("Dodgem:step: ChassisSparksTime: " .. self.ChassisSparksTime)

			if self.ChassisSparksTime <= 0 then
				self.ChassisSparks:getEmitter(0):setEnabled(false)
			end
		end
	end

	function Dodgem:contactPointConfirmedCallback(event)
		--Tanx.log(string.format("Dodgem:contactPointConfirmedCallback: A shape type: %d, B shape type: %d, projected velocity: %f, contace point: %s.",
		--	event.m_collidableA:getShape():getType(), event.m_collidableB:getShape():getType(), event.m_projectedVelocity, tostring(Tanx.madp(event.m_contactPoint:getPosition()))))
		--Tanx.log(string.format("Dodgem:contactPointConfirmedCallback: A name: %s, B name: %s", event.m_collidableA:getOwner():getName() or "", event.m_collidableB:getOwner():getName() or ""))

		local target = iif(event.m_collidableA:getOwner():getUid() == self.ChassisId, event.m_collidableB, event.m_collidableA)
		local targetname = target:getOwner():getName()
		--Tanx.log(string.format("Dodgem:contactPointConfirmedCallback: targetname: %s", targetname))

		local rba = event.m_collidableA:getRigidBody()
		local rbb = event.m_collidableB:getRigidBody()
		if rba and rbb then
			local position = Tanx.madp(event.m_contactPoint:getPosition())
			local velocity = Tanx.madp(target:getOwner():toDerived():getLinearVelocity())
			local projectedVelocity = event.m_projectedVelocity
			local normal = Tanx.madp(event.m_contactPoint:getNormal())

			if target:getShape():getType() == Havok.hkpShapeType.BOX then
				local sound = self.SoundSources.CollisionBox
				if sound then
					--Tanx.log(string.format("Dodgem:contactPointConfirmedCallback: A fixed: %s, B fixed: %s, projected velocity: %f, contace point: %s.",
					--	tostring(rba:isFixed():get()), tostring(rbb:isFixed():get()), projectedVelocity, tostring(position)))

					local volume = math.abs(projectedVelocity) ^ 2 * 3

					sound:get():setPosition(position.x, position.y, position.z)
					sound:get():setVelocity(velocity.x, velocity.y, velocity.z)
					sound:get():setGain(volume)
					sound:get():play()
				end

				self:emitChassisSparks(position, math.abs(projectedVelocity) * 4)

				if self.EventHandlers.onHitBox then
					self.EventHandlers.onHitBox(target:getOwner():getUid(), self:translateToLocal(position),
						self:rotateToLocal(normal), projectedVelocity)
				end
			elseif targetname == "chassis" then
				-- to avoid double sound effect
				if self.ChassisId < target:getOwner():getUid() then
					local sound = self.SoundSources.CollisionConvex
					if sound then
						local vel = math.abs(projectedVelocity) ^ 2 - 0.1
						if vel > 0 then
							local volume = vel * 0.1

							sound:get():setPosition(position.x, position.y, position.z)
							sound:get():setVelocity(velocity.x, velocity.y, velocity.z)
							sound:get():setGain(volume)
							sound:get():play()
						end
					end
				end

				self:emitChassisSparks(position, math.abs(projectedVelocity) * 10)

				if self.EventHandlers.onHitChassis then
					self.EventHandlers.onHitChassis(target:getOwner():getUid(), self:translateToLocal(position),
						self:rotateToLocal(normal), projectedVelocity)
				end
			elseif targetname == "tail" then
				local sound = self.SoundSources.CollisionTail
				if sound then
					local volume = math.abs(projectedVelocity) ^ 2 * 0.04

					sound:get():setPosition(position.x, position.y, position.z)
					sound:get():setVelocity(velocity.x, velocity.y, velocity.z)
					sound:get():setGain(volume)
					sound:get():play()
				end

				self:emitChassisSparks(position, math.abs(projectedVelocity) * 16)

				if self.EventHandlers.onHitTail and target:getOwner():getUid() ~= self.TailId then
					self.EventHandlers.onHitTail(target:getOwner():getUid(), math.abs(projectedVelocity))
				end
			end
		end
	end

	function Dodgem:emitChassisSparks(position, rate, duration)
		duration = duration or 0.1

		if self.ChassisSparks and not self.Chassis:expired() then
			local chassis = self.Chassis:lock()

			self.ChassisSparksTime = duration
			self.ChassisSparks:getEmitter(0):setEmissionRate(rate)
			self.ChassisSparks:getEmitter(0):setEnabled(true)

			local localposition = chassis:get():getOrientation():Inverse() * (position - chassis:get():getPosition())
			assert(self, "self is nil")
			assert(self.ChassisSparks, "self.ChassisSparks is nil")
			assert(self.ChassisSparks:getParentNode(), "self.ChassisSparks:getParentNode() is nil")
			self.ChassisSparks:getParentNode():setPosition(localposition)
		end
	end
