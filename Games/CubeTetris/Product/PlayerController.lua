--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	PlayerController.lua
--]]

Tanx.log("[Tetris\\PlayerController.lua]: parsed.")


local g_KeyMap =
{
	MoveLeft	= OIS.KeyCode.A,
	MoveRight	= OIS.KeyCode.D,
	MoveUp		= OIS.KeyCode.W,
	MoveDown	= OIS.KeyCode.S,
	MoveDrop	= OIS.KeyCode.X,
}

local g_JoyStickRotateSensitivity = 60
local g_JoyStickViewXSensitivity = 4.8


local JoyStickProcs =
{
	-- default proc function
	[0] = function(self, state)
		if state.mAxes:at(1).abs == 32767 or state.mAxes:at(3).abs == 32767 then
			self.ManipulatorState.MoveX = 1
		elseif state.mAxes:at(1).abs == -32768 or state.mAxes:at(3).abs == -32768 then
			self.ManipulatorState.MoveX = -1
		end
		if state.mAxes:at(0).abs == -32768 or state.mAxes:at(2).abs == -32768 then
			self.ManipulatorState.MoveZ = 1
		elseif state.mAxes:at(0).abs == 32767 or state.mAxes:at(2).abs == 32767 then
			self.ManipulatorState.MoveZ = -1
		end
		if state.mButtons:at(8) then
			self.ManipulatorState.MoveY = -1
		end

		if state.mButtons:at(2) then
			self.ManipulatorState.RotateX = self.ManipulatorState.RotateX + g_JoyStickRotateSensitivity
		end
		if state.mButtons:at(0) then
			self.ManipulatorState.RotateX = self.ManipulatorState.RotateX - g_JoyStickRotateSensitivity
		end
		if state.mButtons:at(1) then
			self.ManipulatorState.RotateY = self.ManipulatorState.RotateY + g_JoyStickRotateSensitivity
		end
		if state.mButtons:at(3) then
			self.ManipulatorState.RotateY = self.ManipulatorState.RotateY - g_JoyStickRotateSensitivity
		end
		if state.mButtons:at(7) then
			self.ManipulatorState.RotateZ = self.ManipulatorState.RotateZ + g_JoyStickRotateSensitivity
		end
		if state.mButtons:at(6) then
			self.ManipulatorState.RotateZ = self.ManipulatorState.RotateZ - g_JoyStickRotateSensitivity
		end

		if state.mButtons:at(5) then
			self.ManipulatorState.ViewX = self.ManipulatorState.ViewX + g_JoyStickViewXSensitivity
		end
		if state.mButtons:at(4) then
			self.ManipulatorState.ViewX = self.ManipulatorState.ViewX - g_JoyStickViewXSensitivity
		end
	end,

	["USB/PS2 Vibration Pad"] = function(self, state)
		local direction = state:mPOV(0):get().direction
		if direction == OIS.Pov.East or direction == OIS.Pov.NorthEast or direction == OIS.Pov.SouthEast then
			self.ManipulatorState.MoveX = 1
		elseif direction == OIS.Pov.West or direction == OIS.Pov.NorthWest or direction == OIS.Pov.SouthWest then
			self.ManipulatorState.MoveX = -1
		end
		if direction == OIS.Pov.North or direction == OIS.Pov.NorthEast or direction == OIS.Pov.NorthWest then
			self.ManipulatorState.MoveZ = 1
		elseif direction == OIS.Pov.South or direction == OIS.Pov.SouthEast or direction == OIS.Pov.SouthWest then
			self.ManipulatorState.MoveZ = -1
		end

		if state.mButtons:at(2) then
			self.ManipulatorState.RotateX = self.ManipulatorState.RotateX + g_JoyStickRotateSensitivity
		end
		if state.mButtons:at(0) then
			self.ManipulatorState.RotateX = self.ManipulatorState.RotateX - g_JoyStickRotateSensitivity
		end
		if state.mButtons:at(1) then
			self.ManipulatorState.RotateY = self.ManipulatorState.RotateY + g_JoyStickRotateSensitivity
		end
		if state.mButtons:at(3) then
			self.ManipulatorState.RotateY = self.ManipulatorState.RotateY - g_JoyStickRotateSensitivity
		end
		if state.mButtons:at(7) then
			self.ManipulatorState.RotateZ = self.ManipulatorState.RotateZ + g_JoyStickRotateSensitivity
		end
		if state.mButtons:at(6) then
			self.ManipulatorState.RotateZ = self.ManipulatorState.RotateZ - g_JoyStickRotateSensitivity
		end

		if state.mButtons:at(5) then
			self.ManipulatorState.ViewX = self.ManipulatorState.ViewX + g_JoyStickViewXSensitivity
		end
		if state.mButtons:at(4) then
			self.ManipulatorState.ViewX = self.ManipulatorState.ViewX - g_JoyStickViewXSensitivity
		end

		if math.abs(state.mAxes:at(3).abs) > 4096 then
			self.ManipulatorState.ViewX = self.ManipulatorState.ViewX - state.mAxes:at(3).abs * g_JoyStickViewXSensitivity / 32768
		end
	end,
}


function createJoyStick(game)
	local joystick = game:getInputSystem():createInputObject(OIS.Type.JoyStick, true):toDerived()
	Tanx.log("[Tetris\\PlayerController.lua]: JoyStick vendor: " .. joystick:vendor())

	PlayerController.processJoyStick = JoyStickProcs[joystick:vendor()] or JoyStickProcs[0]

	return joystick
end


class "PlayerController"

	function PlayerController:__init(game, joystick)
		self.Game = game

		self.ManipulatorState =
		{
			MoveX = 0,
			MoveY = 0,
			MoveZ = 0,

			RotateX = 0,
			RotateY = 0,
			RotateZ = 0,

			ViewX = 0,
			ViewZ = 0,
		}

		self.JoyStick = joystick
	end

	function PlayerController:dispose()
		if self.JoyStick then
			self.Game:getInputSystem():destroyInputObject(self.JoyStick)
			self.JoyStick = nil
		end
	end

	function PlayerController:brickDropped(brick)
		--self.FocusBrick = brick
	end

	function PlayerController:step(elapsed)
		self.ManipulatorState.MoveX = 0
		self.ManipulatorState.MoveY = 0
		self.ManipulatorState.MoveZ = 0
		if g_Keyboard:isKeyDown(g_KeyMap.MoveLeft) then
			self.ManipulatorState.MoveX = -1
		elseif g_Keyboard:isKeyDown(g_KeyMap.MoveRight) then
			self.ManipulatorState.MoveX = 1
		end
		if g_Keyboard:isKeyDown(g_KeyMap.MoveUp) then
			self.ManipulatorState.MoveZ = 1
		elseif g_Keyboard:isKeyDown(g_KeyMap.MoveDown) then
			self.ManipulatorState.MoveZ = -1
		end
		if g_Keyboard:isKeyDown(g_KeyMap.MoveDrop) then
			self.ManipulatorState.MoveY = -1
		end

		local mousestate = g_Mouse:getMouseState()
		if mousestate:buttonDown(OIS.MouseButtonID.Left) then
			self.ManipulatorState.RotateX = 0
			self.ManipulatorState.RotateY = 0
			self.ManipulatorState.RotateZ = 0

			self.ManipulatorState.ViewX = -mousestate.X.rel * 0.6
			self.ManipulatorState.ViewY = mousestate.Y.rel
		else
			self.ManipulatorState.RotateX = mousestate.Z.rel * -1
			self.ManipulatorState.RotateY = mousestate.X.rel
			self.ManipulatorState.RotateZ = mousestate.Y.rel

			self.ManipulatorState.ViewX = 0
			self.ManipulatorState.ViewY = 0
		end

		if self.JoyStick then
			self:processJoyStick(self.JoyStick:getJoyStickState())
		end
	end

	function PlayerController:getManipulatorState()
		return self.ManipulatorState
	end
