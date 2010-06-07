--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\Automobile.lua
--]]

Tanx.log("[Dodgem\\Automobile.lua]: parsed.")


class "Automobile"

	function Automobile:__init(agent, vehiclemakername, soundsources)
		local maker = Tanx.VehicleBook.getSingleton():at(vehiclemakername)

		self.Chassis = Tanx.BodyWeakPtr(agent:findBody"chassis")
		self.VehicleAction = maker:make(self.Chassis:lock())
		self.Driver = self.VehicleAction:get().m_deviceStatus:toDerived()

		self.SoundSources = soundsources or {}

		if self.SoundSources.Engine then
			self.SoundSources.Engine:get():setLooping(true)
			self.SoundSources.Engine:get():setGain(0)
			self.SoundSources.Engine:get():play()
		end

		self.Silent = false
	end

	function Automobile:__finalize()
		--self.Chassis:get():removeCollisionListener(self.CollisionListener)
	end

	function Automobile:step(elapsed)
		self.RPM = self.VehicleAction:get():calcRPM()
		self.KMPH = self.VehicleAction:get():calcKMPH()
		self.MPH = self.VehicleAction:get():calcMPH()

		--Tanx.log(string.format("[Dodgem\\Automobile.lua]: rpm: %f, kmph: %f, mph: %f.", self.RPM, self.KMPH, self.MPH))

		if not self.Silent and self.SoundSources.Engine and not self.Chassis:expired() then
			local position = self.Chassis:lock():get():getPosition()
			local velocity = self.Chassis:lock():get():getLinearVelocity()

			self.SoundSources.Engine:get():setPosition(position.x, position.y, position.z)
			self.SoundSources.Engine:get():setVelocity(velocity.x, velocity.y, velocity.z)
			self.SoundSources.Engine:get():setGain(self.RPM / 2000)
		end
	end

	function Automobile:translateToLocal(position)
		local chassis = self.Chassis:lock():get()
		if chassis then
			return position - chassis:getPosition()
		else
			Tanx.log("[Dodgem\\Automobile.lua]: translateToLocal: chassis has expired.")
			return position
		end
	end

	function Automobile:rotateToLocal(direction)
		local chassis = self.Chassis:lock():get()
		if chassis then
			return chassis:getOrientation():Inverse() * direction
		else
			Tanx.log("[Dodgem\\Automobile.lua]: rotateToLocal: chassis has expired.")
			return direction
		end
	end

	function Automobile:setSilent(silent)
		self.Silent = silent

		if self.SoundSources.Engine then
			self.SoundSources.Engine:get():setGain(0)
		end
	end
