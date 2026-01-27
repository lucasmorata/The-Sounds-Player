# The Sounds Player

A powerful multi-slot sound player for Foundry VTT that brings a modern music player experience to your tabletop sessions.

![Main Interface] <img width="646" height="547" alt="Capture d&#39;écran 2026-01-27 221750" src="https://github.com/user-attachments/assets/11d3622b-40fc-459d-adfc-02e518abc079" />


## Why The Sounds Player?

Foundry VTT's default playlist system lacks essential features for smooth audio management during sessions. **The Sounds Player** fills this gap with:

### 🎵 **Full Timeline Navigation**
Unlike Foundry's default player, you can **seek anywhere in your tracks**. Click on the timeline to jump to any position - no more waiting for a track to finish or restarting from the beginning.

![Timeline Navigation]<img width="438" height="79" alt="Capture d&#39;écran 2026-01-27 221822" src="https://github.com/user-attachments/assets/8916d27b-bb20-411d-98b6-4536fe09ab7c" />


### 🎨 **Visual Slot System with Custom Images**
Assign custom images to each sound slot for instant visual recognition. Perfect for distinguishing between combat themes, ambient sounds, and NPC themes at a glance.

![Custom Images]<img width="203" height="132" alt="Capture d&#39;écran 2026-01-27 221901" src="https://github.com/user-attachments/assets/b8fe7a74-7661-466e-92c0-00301ba9e5c0" />


### 🔀 **Drag & Drop Reordering**
Organize your sounds exactly how you want them. Simply drag and drop slots to reorder your playlist on the fly during sessions.

![Drag and Drop]<img width="231" height="198" alt="Capture d&#39;écran 2026-01-27 221930" src="https://github.com/user-attachments/assets/c5f901e2-cd14-48fe-96b0-8a9e155d6c6a" />


### 📁 **Bulk Import**
Import entire folders of audio files in one click. No more adding sounds one by one - select a folder and all audio files are added instantly.

![Bulk Import]<img width="392" height="490" alt="Capture d&#39;écran 2026-01-27 222003" src="https://github.com/user-attachments/assets/f34567b2-60c3-4b6f-89c6-0e00db63a5ac" />


### 🎛️ **Multi-Playlist Management**
Switch between playlists without stopping playback. Each playlist maintains its own state - music keeps playing even when you browse other playlists.

![Playlist Sidebar]<img width="170" height="216" alt="Capture d&#39;écran 2026-01-27 222034" src="https://github.com/user-attachments/assets/6c1aa0f5-bd92-4fc8-9040-49e924f3cffe" />


## How to Access

1. Click on the **Sounds** layer in the left toolbar (speaker icon)
2. Click on **The Sounds Player** button (▶️ icon)

![Access]<img width="209" height="221" alt="image" src="https://github.com/user-attachments/assets/9073f74c-4591-4874-a23a-fb63a70a64e0" />


## Features

| Feature | The Sounds Player | Foundry Default |
|---------|-------------------|-----------------|
| Timeline seek | ✅ | ❌ |
| Custom slot images | ✅ | ❌ |
| Drag & drop reorder | ✅ | ❌ |
| Bulk folder import | ✅ | ✅ |
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
3. Paste the manifest URL

### Method 2: Manual Installation
1. Download the latest release
2. Extract to `Data/modules/sounds-player`
3. Restart Foundry VTT

## Compatibility

- **Foundry VTT**: v13+
- **Systems**: All systems

## License

MIT License - Feel free to use, modify, and distribute.

---

Made with ❤️ for the Foundry VTT community
