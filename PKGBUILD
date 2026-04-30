# Maintainer: Noel Paul Tomy (Ziuus) <noelyt101@gmail.com>
pkgname=waiting-game-git
pkgver=0.3.5
pkgrel=1
pkgdesc="Cinematic kinetic overlay game for developers, optimized for Hyprland."
arch=('x86_64' 'aarch64')
url="https://github.com/ziuus/waiting-game"
license=('MIT')
depends=('hyprland' 'jq' 'python')
makedepends=('cargo' 'npm' 'pnpm' 'git')
provides=('waiting-game')
conflicts=('waiting-game')
source=("git+https://github.com/ziuus/waiting-game.git")
sha256sums=('SKIP')

pkgver() {
  cd "$srcdir/waiting-game"
  git describe --long --tags | sed 's/^v//;s/\([^-]*-g\)/r\1/;s/-/./g'
}

build() {
  cd "$srcdir/waiting-game"
  pnpm install
  pnpm tauri build --no-bundle
}

package() {
  cd "$srcdir/waiting-game"
  
  # Install binary
  install -Dm755 "src-tauri/target/release/waiting-game-bin" "$pkgdir/usr/bin/waiting-game-bin"
  
  # Install wrapper and conf
  install -Dm755 "install.sh" "$pkgdir/usr/share/waiting-game/install.sh"
  install -Dm644 "waiting-game.conf" "$pkgdir/usr/share/waiting-game/waiting-game.conf"
  
  # Install Desktop entry
  install -Dm644 "src-tauri/icons/128x128.png" "$pkgdir/usr/share/icons/hicolor/128x128/apps/waiting-game.png"
}
