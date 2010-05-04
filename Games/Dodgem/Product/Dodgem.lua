--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\Automobile.lua
--]]

Tanx.log("[Dodgem\\Automobile.lua]: parsed.")

Tanx.dofile"Core:utility.lua"
Tanx.dofile"Automobile.lua"


function loadSounds(soundconfig)
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


class "Dodgem" (Automobile)

	function Dodgem:__init(world, chassis, vehiclemakername, soundconfig)
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			Automobile.__init(self, chassis, vehiclemakername, loadSounds(soundconfig))
		else
			super(chassis, vehiclemakername, loadSounds(soundconfig))
		end

		self.World = world

		self.CollisionListener = DodgemCollisionListener(self)
		self.Chassis:get():addCollisionListener(self.CollisionListener)

		self.ChassisId = self.Chassis:get():getRigidBody():get():getUid()

		local exist, sparksnode = pcall(function() return self.Chassis:get():getNode():getChild"Sparks" end)
		if exist then
			self.ChassisSparks = sparksnode:toDerived():getAttachedObject(0):toDerived()
			self.ChassisSparks:getEmitter(0):setEnabled(false)
		end

		self.ChassisSparksTime = 0
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
			local velocity = Tanx.madp(target:getOwner():toDerived():getAngularVelocity())

			local emit_spark = false

			if target:getShape():getType() == Havok.hkpShapeType.BOX then
				local sound = self.SoundSources.CollisionBox
				if sound then
					--Tanx.log(string.format("Dodgem:contactPointConfirmedCallback: A fixed: %s, B fixed: %s, projected velocity: %f, contace point: %s.",
					--	tostring(rba:isFixed():get()), tostring(rbb:isFixed():get()), event.m_projectedVelocity, tostring(Tanx.madp(event.m_contactPoint:getPosition()))))

					local volume = math.abs(event.m_projectedVelocity) ^ 2 * 3

					sound:get():setPosition(position.x, position.y, position.z)
					sound:get():setVelocity(velocity.x, velocity.y, velocity.z)
					sound:get():setGain(volume)
					sound:get():play()
				end

				self:emitChassisSparks(position, math.abs(event.m_projectedVelocity) * 4)
			elseif targetname == "chassis" and self.ChassisId < target:getOwner():getUid() then
				local sound = self.SoundSources.CollisionConvex
				if sound then
					local vel = math.abs(event.m_projectedVelocity) ^ 2 - 0.1
					if vel > 0 then
						local volume = vel * 0.1

						sound:get():setPosition(position.x, position.y, position.z)
						sound:get():setVelocity(velocity.x, velocity.y, velocity.z)
						sound:get():setGain(volume)
						sound:get():play()
					end
				end

				--emit_spark = true

				self:emitChassisSparks(position, math.abs(event.m_projectedVelocity) * 10)
			elseif targetname == "tail" then
				local sound = self.SoundSources.CollisionTail
				if sound then
					local volume = math.abs(event.m_projectedVelocity) ^ 2 * 0.04

					sound:get():setPosition(position.x, position.y, position.z)
					sound:get():setVelocity(velocity.x, velocity.y, velocity.z)
					sound:get():setGain(volume)
					sound:get():play()
				end

				--emit_spark = true

				self:emitChassisSparks(position, math.abs(event.m_projectedVelocity) * 16)
			end

			if emit_spark and self.World.createAgent then
				self.World:createAgent("Dodgem/Sparks", "spark%index", Tanx.RigidBodyState.make(position, Tanx.Quaternion.IDENTITY, velocity), Tanx.ScriptSpace:resource())
			end
		end
	end

	function Dodgem:emitChassisSparks(position, rate, duration)
		duration = duration or 0.1

		if self.ChassisSparks then
			self.ChassisSparksTime = duration
			self.ChassisSparks:getEmitter(0):setEmissionRate(rate)
			self.ChassisSparks:getEmitter(0):setEnabled(true)

			local localposition = self.Chassis:get():getOrientation():Inverse() * (position - self.Chassis:get():getPosition())
			self.ChassisSparks:getParentNode():setPosition(localposition)
		end
	end


class "DodgemCollisionListener" (Tanx.CollisionListener)

	function DodgemCollisionListener:__init(receiver)
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			Tanx.CollisionListener.__init(self)
		else
			super()
		end

		self.Receiver = receiver
	end

	function DodgemCollisionListener:contactPointAddedCallback(event)
	end

	function DodgemCollisionListener:contactPointConfirmedCallback(event)
		self.Receiver:contactPointConfirmedCallback(event)
	end

	function DodgemCollisionListener:contactPointRemovedCallback(event)
	end

	function DodgemCollisionListener:contactProcessCallback(event)
	end