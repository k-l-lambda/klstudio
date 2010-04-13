--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\Automobile.lua
--]]

Tanx.log("[Dodgem\\Automobile.lua]: parsed.")


class "Automobile"

	function Automobile:__init(chassis, vehiclemakername)
		local maker = Tanx.VehicleBook.getSingleton():at(vehiclemakername)

		self.VehicleAction = maker:make(chassis)
		self.Driver = self.VehicleAction:get().m_deviceStatus:toDerived()
	end
