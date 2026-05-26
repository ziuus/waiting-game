cask "waiting-game" do
  version "0.3.12"
  sha256 "8e09ff94f2fed836b17684c877dd5cec2ced6af3510a36e18b56c5a120bb1dbf"

  url "https://github.com/ziuus/waiting-game/releases/download/v#{version}/waiting-game_#{version}_aarch64.dmg"
  name "Waiting Game"
  desc "Autonomous kinetic overlay game"
  homepage "https://github.com/ziuus/waiting-game"

  app "Waiting Game.app"
end
