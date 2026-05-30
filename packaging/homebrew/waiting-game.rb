cask "waiting-game" do
  version "0.4.0"
  sha256 "c9943f1f4227a8809799144e2e0b87d3f33a52367fe6d1e5853c643f7e67aa3d"

  url "https://github.com/ziuus/waiting-game/releases/download/v#{version}/waiting-game_#{version}_aarch64.dmg"
  name "Waiting Game"
  desc "Autonomous kinetic overlay game"
  homepage "https://github.com/ziuus/waiting-game"

  app "Waiting Game.app"
end
