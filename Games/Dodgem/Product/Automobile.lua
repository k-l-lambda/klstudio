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

		self.Chassis = agent:findBody"chassis"
		self.VehicleAction = maker:make(self.Chassis)
		self.Driver = self.VehicleAction:get().m_deviceStatus:toDerived()

		self.SoundSources = soundsources or {}

		if self.SoundSources.Engine then
			self.SoundSources.Engine:get():setLooping(true)
			self.SoundSources.Engine:get():setGain(0)
			self.SoundSources.Engine:get():play()
		end
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
