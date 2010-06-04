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
	Disabled =
	{
		enterState = function(state, machine)
			machine.Material:get():setDiffuse(machine.Colors.Disabled)
			machine.Material:get():setAmbient(machine.Colors.Disabled)
			machine.Material:get():setSpecular(Ogre.ColourValue.Black)
			machine.Material:get():_notifyNeedsRecompile()
		end,
	},

	Active =
	{
		enterState = function(state, machine)
			machine.Material:get():setDiffuse(machine.Colors.Active)
			machine.Material:get():setAmbient(machine.Colors.Active)
			machine.Material:get():setSpecular(Ogre.ColourValue.White)
			machine.Material:get():_notifyNeedsRecompile()
		end,
	},

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
			machine.Material:get():setSelfIllumination(machine.Colors.Flicker * machine.FlickerBrightness)
			machine.Material:get():_notifyNeedsRecompile()

			machine.FlickerBrightness = machine.FlickerBrightness - elapsed * 1.8
			if machine.FlickerBrightness <= 0 then
				machine:switch("Active", machine)
			end
		end
	},
}


class "TailState" (TanxStateMachine)

	function TailState:__init(car, colors)
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			TanxStateMachine.__init(self, s_TailStateSet, nil, nil, false)
		else
			super(s_TailStateSet, nil, nil, false)
		end

		self.Colors = colors or {}
		self.Colors.Active = self.Colors.Active or Ogre.ColourValue.Red
		self.Colors.Disabled = self.Colors.Disabled or Ogre.ColourValue(0.4, 0.4, 0.4)
		self.Colors.Flicker = self.Colors.Disabled or Ogre.ColourValue.White

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

	function TailState:disable()
		self:switch("Disabled", self)
	end

	function TailState:activate()
		self:switch("Active", self)
	end
