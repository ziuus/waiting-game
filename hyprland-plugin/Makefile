# Waiting Game - Hyprland Plugin Makefile

PLUGIN_NAME = waiting-game.so
SOURCE = src/main.cpp

CXX = g++
CXXFLAGS = -shared -fPIC --optimize-speed -std=c++23
CXXFLAGS += `pkg-config --cflags hyprland pixman-1 libdrm pangocairo`
LDFLAGS = `pkg-config --libs hyprland pixman-1 libdrm pangocairo`

all: $(PLUGIN_NAME)

$(PLUGIN_NAME): $(SOURCE)
	$(CXX) $(CXXFLAGS) $(SOURCE) -o $(PLUGIN_NAME) $(LDFLAGS)

clean:
	rm -f $(PLUGIN_NAME)
