cask "waiting-game" do
  version "0.3.7"
  sha256 "481778f104aeac2e703e20088935e280321b3dd29a971c53f9b085499ac81dbc"

  url "https://github.com/ziuus/waiting-game/releases/download/v#{version}/waiting-game_#{version}_aarch64.dmg"
  name "Waiting Game"
  desc "Autonomous kinetic overlay game"
  homepage "https://github.com/ziuus/waiting-game"

  app "Waiting Game.app"
end
