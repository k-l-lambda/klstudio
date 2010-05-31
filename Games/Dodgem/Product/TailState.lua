--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\TailState.lua
--]]

Tanx.log("[Dodgem\\TailState.lua]: parsed.")

Tanx.require"Core:StateMachine.lua"


local s_TailStateSet =
{
	Idle = {},

	Flicker =
	{
		enterState = function(state, machine)
			machine.FlickerBrightness = 1
		end,

		leaveState = function(state, machine)
			machine.Material:get():setSelfIllumination(Ogre.ColourValue.Black)
			machine.Material:get():_notifyNeedsRecompile()
		end,

		step = function(state, machine, elapsed)
			machine.Material:get():setSelfIllumination(Ogre.ColourValue.White * machine.FlickerBrightness)
			machine.Material:get():_notifyNeedsRecompile()

			machine.FlickerBrightness = machine.FlickerBrightness - elapsed * 1.8
			if machine.FlickerBrightness <= 0 then
				machine:switch("Idle", machine)
			end
		end
	},
}


class "TailState" (TanxStateMachine)

	function TailState:__init(car)
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			TanxStateMachine.__init(self, s_TailStateSet, "Idle", nil, false)
		else
			super(s_TailStateSet, "Idle", nil, false)
		end

		self.Material = car:get():findBody"tail":get():getNode():toDerived():getChild(0):toDerived():getAttachedObject(0):toDerived():getSubEntity(0):getMaterial()
	end

	function TailState:step(elapsed)
		local state = self:state()
		if state and state.step then
			state:step(self, elapsed)
		end
	end

	function TailState:flicker()
		self:switch("Flicker", self)
	end
