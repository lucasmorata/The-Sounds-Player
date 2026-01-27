# The Sounds Player

A powerful multi-slot sound player for Foundry VTT that brings a modern music player experience to your tabletop sessions.

![Main Interface](screenshots/main-interface.png)

## Why The Sounds Player?

Foundry VTT's default playlist system lacks essential features for smooth audio management during sessions. **The Sounds Player** fills this gap with:

### 🎵 **Full Timeline Navigation**
Unlike Foundry's default player, you can **seek anywhere in your tracks**. Click on the timeline to jump to any position - no more waiting for a track to finish or restarting from the beginning.

![Timeline Navigation](screenshots/timeline.png)

### 🎨 **Visual Slot System with Custom Images**
Assign custom images to each sound slot for instant visual recognition. Perfect for distinguishing between combat themes, ambient sounds, and NPC themes at a glance.

![Custom Images](screenshots/custom-images.png)

### 🔀 **Drag & Drop Reordering**
Organize your sounds exactly how you want them. Simply drag and drop slots to reorder your playlist on the fly during sessions.

![Drag and Drop](screenshots/drag-drop.png)

### 📁 **Bulk Import**
Import entire folders of audio files in one click. No more adding sounds one by one - select a folder and all audio files are added instantly.

![Bulk Import](screenshots/bulk-import.png)

### 🎛️ **Multi-Playlist Management**
Switch between playlists without stopping playback. Each playlist maintains its own state - music keeps playing even when you browse other playlists.

![Playlist Sidebar](screenshots/playlist-sidebar.png)

## How to Access

1. Click on the **Sounds** layer in the left toolbar (speaker icon)
2. Click on **The Sounds Player** button (▶️ icon)

![Access](screenshots/access.png)

## Features

| Feature | The Sounds Player | Foundry Default |
|---------|-------------------|-----------------|
| Timeline seek | ✅ | ❌ |
| Custom slot images | ✅ | ❌ |
| Drag & drop reorder | ✅ | ❌ |
| Bulk folder import | ✅ | ❌ |
| Visual slot grid | ✅ | ❌ |
| Multi-playlist playback | ✅ | ❌ |
| Loop toggle | ✅ | ✅ |
| Volume control | ✅ | ✅ |

## Usage

### Creating a Playlist
1. Click the **+** button in the playlist sidebar
2. Enter a name for your playlist
3. Start adding sounds!

### Adding Sounds
- **Single sound**: Click on an empty slot or the **+** slot, then select a sound
- **Bulk import**: Click the folder icon in the picker to import all audio files from a folder

### Customizing Slots
- **Right-click** on any slot to:
  - Change the slot image
  - Remove the image
  - Remove the sound

### Managing Playlists
- **Right-click** on any playlist in the sidebar to:
  - Edit the playlist (opens Foundry's playlist sheet)
  - Import a folder of sounds
  - Delete the playlist

### Playback Controls
- **Play/Pause**: Click the play button or click on a slot
- **Stop**: Stop the current track
- **Loop**: Toggle loop mode for the current track
- **Previous/Next**: Navigate between tracks
- **Timeline**: Click anywhere to seek
- **Volume**: Adjust with the slider

## Installation

### Method 1: Manifest URL
1. In Foundry VTT, go to **Add-on Modules**
2. Click **Install Module**
3. Paste the manifest URL:
```
https://github.com/YOUR_USERNAME/sounds-player/releases/latest/download/module.json
```

### Method 2: Manual Installation
1. Download the latest release
2. Extract to `Data/modules/sounds-player`
3. Restart Foundry VTT

## Compatibility

- **Foundry VTT**: v13+
- **Systems**: All systems

## Support

Found a bug or have a feature request? [Open an issue](https://github.com/YOUR_USERNAME/sounds-player/issues) on GitHub.

## License

MIT License - Feel free to use, modify, and distribute.

---

Made with ❤️ for the Foundry VTT community
