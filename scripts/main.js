// =============================================
// LOCALIZATION
// =============================================
const i18n = {
  get lang() {
    return game.i18n?.lang || "en";
  },
  t(key) {
    const translations = {
      en: {
        "empty": "Empty",
        "selectSlot": "Select a slot",
        "changeImage": "Change image",
        "removeImage": "Remove image",
        "removeSound": "Remove sound",
        "editSound": "Edit sound",
        "playlistDeleted": "Playlist deleted",
        "playlistCreated": "Playlist created",
        "selectSound": "Select a sound",
        "addSound": "Add sound",
        "importFolder": "Import folder",
        "search": "Search...",
        "noPlaylist": "No playlist found.",
        "playlistName": "Playlist name",
        "newPlaylist": "New playlist",
        "create": "Create",
        "cancel": "Cancel",
        "deletePlaylist": "Delete playlist",
        "editPlaylist": "Edit playlist",
        "confirmDelete": "Delete this playlist?",
        "importedSounds": "sounds imported",
        "playlists": "Playlists",
        "selectPlaylist": "Select a playlist to begin",
        "changeCategory": "Category",
        "categoryMusic": "Music",
        "categoryEnvironment": "Environment",
        "categoryInterface": "Interface",
        "volume": "Volume"
      },
      fr: {
        "empty": "Vide",
        "selectSlot": "Sélectionnez un slot",
        "changeImage": "Changer l'image",
        "removeImage": "Supprimer l'image",
        "removeSound": "Supprimer le son",
        "editSound": "Éditer le son",
        "playlistDeleted": "Playlist supprimée",
        "playlistCreated": "Playlist créée",
        "selectSound": "Sélectionner un son",
        "addSound": "Ajouter un son",
        "importFolder": "Importer un dossier",
        "search": "Rechercher...",
        "noPlaylist": "Aucune playlist trouvée.",
        "playlistName": "Nom de la playlist",
        "newPlaylist": "Nouvelle playlist",
        "create": "Créer",
        "cancel": "Annuler",
        "deletePlaylist": "Supprimer la playlist",
        "editPlaylist": "Éditer la playlist",
        "confirmDelete": "Supprimer cette playlist ?",
        "importedSounds": "sons importés",
        "playlists": "Playlists",
        "selectPlaylist": "Sélectionnez une playlist pour commencer",
        "changeCategory": "Catégorie",
        "categoryMusic": "Musique",
        "categoryEnvironment": "Environnement",
        "categoryInterface": "Interface",
        "volume": "Volume"
      }
    };
    const lang = this.lang === "fr" ? "fr" : "en";
    return translations[lang][key] || translations["en"][key] || key;
  }
};

// =============================================
// PLAYLIST CATEGORIES & HELPERS
// =============================================
const PLAYLIST_CATEGORIES = {
  music: "🎵",
  environment: "🌲",
  interface: "🔔"
};

function cleanSoundName(path) {
  try {
    return decodeURIComponent(path.split("/").pop()).replace(/\.[^/.]+$/, "");
  } catch {
    return path.split("/").pop().replace(/\.[^/.]+$/, "");
  }
}

// =============================================
// SOUND PICKER (ApplicationV2)
// =============================================
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class SoundPickerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(callback, options = {}) {
    super(options);
    this.callback = callback;
    this.searchTerm = "";
  }

  static DEFAULT_OPTIONS = {
    id: "sounds-player-picker",
    window: { title: "Select Sound", resizable: true },
    position: { width: 400, height: 500 },
    classes: ["mp-sound-picker"]
  };

  static PARTS = {
    main: { template: "modules/sounds-player/templates/picker.html" }
  };

  get title() { return i18n.t("selectSound"); }

  async _prepareContext() {
    const playlists = [];
    for (const playlist of game.playlists) {
      const sounds = [];
      for (const sound of playlist.sounds) {
        if (this.searchTerm && !sound.name.toLowerCase().includes(this.searchTerm.toLowerCase())) continue;
        sounds.push({ id: sound.id, name: sound.name, playing: sound.playing, playlistId: playlist.id });
      }
      if (sounds.length > 0) {
        playlists.push({ id: playlist.id, name: playlist.name, sounds });
      }
    }
    return {
      playlists,
      searchPlaceholder: i18n.t("search"),
      addSoundLabel: i18n.t("addSound"),
      importFolderLabel: i18n.t("importFolder"),
      noPlaylistMsg: i18n.t("noPlaylist")
    };
  }

  _onRender(context, options) {
    const html = this.element;

    html.querySelector(".mp-picker-search")?.addEventListener("input", (e) => {
      this.searchTerm = e.target.value;
      this.render();
    });

    html.querySelectorAll(".mp-picker-sound").forEach(el => {
      el.addEventListener("click", (e) => {
        const soundId = e.currentTarget.dataset.soundId;
        const playlistId = e.currentTarget.dataset.playlistId;
        const playlist = game.playlists.get(playlistId);
        const sound = playlist?.sounds.get(soundId);
        if (sound && this.callback) {
          this.callback({
            id: sound.id, name: sound.name, path: sound.path,
            playlistId: playlist.id, playlistName: playlist.name
          });
        }
        this.close();
      });
    });

    html.querySelector(".mp-picker-add-file")?.addEventListener("click", () => {
      const fp = new FilePicker({
        type: "audio",
        callback: (path) => {
          if (path && this.callback) {
            const name = cleanSoundName(path);
            this.callback({ id: null, name, path, playlistId: null, playlistName: null });
          }
          this.close();
        }
      });
      fp.browse();
    });

    html.querySelector(".mp-picker-import-folder")?.addEventListener("click", () => {
      this._importFolder();
    });
  }

  async _importFolder() {
    const fp = new FilePicker({
      type: "folder",
      callback: async (folderPath) => {
        if (!folderPath) return;
        const result = await FilePicker.browse("data", folderPath);
        const audioFiles = result.files.filter(f => /\.(mp3|ogg|wav|webm|m4a|flac)$/i.test(f));

        if (audioFiles.length === 0) {
          ui.notifications.warn("No audio files found in folder");
          return;
        }

        if (this.callback) {
          this.callback({
            id: null,
            name: cleanSoundName(audioFiles[0]),
            path: audioFiles[0],
            playlistId: null,
            playlistName: null,
            batchFiles: audioFiles
          });
        }
        this.close();
      }
    });
    fp.browse();
  }
}

// =============================================
// PLAYLIST NAME DIALOG
// =============================================
class PlaylistNameDialog {
  static async prompt(defaultName = "") {
    return new Promise((resolve) => {
      new foundry.applications.api.DialogV2({
        window: { title: i18n.t("playlistName") },
        content: `
          <form>
            <div class="form-group">
              <label>${i18n.t("playlistName")}:</label>
              <input type="text" name="playlistName" value="${defaultName}" autofocus style="width:100%;margin-top:5px;">
            </div>
          </form>
        `,
        buttons: [
          {
            action: "create", label: i18n.t("create"), icon: "fas fa-plus", default: true,
            callback: (event, button, dialog) => {
              const input = dialog.element.querySelector('[name="playlistName"]');
              resolve(input?.value || null);
            }
          },
          { action: "cancel", label: i18n.t("cancel"), icon: "fas fa-times", callback: () => resolve(null) }
        ],
        close: () => resolve(null)
      }).render(true);
    });
  }
}

// =============================================
// MAIN SOUNDS PLAYER (ApplicationV2)
// Uses Foundry native playlists for audio
// so all connected users hear the sounds.
// =============================================
class SoundsPlayerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.currentPlaylist = "";
    this.focusedSoundId = null;
    this._updateInterval = null;
    this._contextMenu = null;
    this._draggedSlot = null;
    this._seeking = false;
    this._allPlaylistImages = this._loadAllPlaylistImages();
    this._playlistVolumes = this._loadPlaylistVolumes();
    this._expandedVolumes = new Set();
    this._manualStops = new Set();
  }

  static DEFAULT_OPTIONS = {
    id: "sounds-player",
    window: { title: "The Sounds Player", resizable: true, minimizable: true },
    position: { width: 650, height: 550 },
    classes: ["sounds-player-window"]
  };

  static PARTS = {
    main: { template: "modules/sounds-player/templates/player.html" }
  };

  // =============================================
  // DATA ACCESSORS
  // =============================================
  _getPlaylist(id) {
    return game.playlists?.get(id || this.currentPlaylist);
  }

  _getSounds(playlistId) {
    const playlist = this._getPlaylist(playlistId);
    if (!playlist) return [];
    return Array.from(playlist.sounds);
  }

  _getFocusedSound() {
    if (!this.focusedSoundId || !this.currentPlaylist) return null;
    const playlist = this._getPlaylist();
    return playlist?.sounds.get(this.focusedSoundId) || null;
  }

  _isPlaylistPlaying(playlistId) {
    const playlist = game.playlists?.get(playlistId);
    if (!playlist) return false;
    return playlist.sounds.some(s => s.playing);
  }

  _getPlaylistCategory(playlistId) {
    const playlist = game.playlists?.get(playlistId);
    return playlist?.getFlag("sounds-player", "category") || "music";
  }

  // =============================================
  // IMAGE MANAGEMENT (keyed by soundId)
  // =============================================
  _loadAllPlaylistImages() {
    try {
      return JSON.parse(localStorage.getItem("sounds-player-images-v2")) || {};
    } catch { return {}; }
  }

  _saveAllPlaylistImages() {
    localStorage.setItem("sounds-player-images-v2", JSON.stringify(this._allPlaylistImages));
  }

  _getSlotImage(soundId) {
    if (!this.currentPlaylist) return null;
    return this._allPlaylistImages[this.currentPlaylist]?.[soundId] || null;
  }

  _setSlotImage(soundId, path) {
    if (!this.currentPlaylist) return;
    if (!this._allPlaylistImages[this.currentPlaylist]) this._allPlaylistImages[this.currentPlaylist] = {};
    this._allPlaylistImages[this.currentPlaylist][soundId] = path;
    this._saveAllPlaylistImages();
  }

  _removeSlotImage(soundId) {
    if (!this.currentPlaylist || !this._allPlaylistImages[this.currentPlaylist]) return;
    delete this._allPlaylistImages[this.currentPlaylist][soundId];
    this._saveAllPlaylistImages();
  }

  // =============================================
  // PLAYLIST VOLUME (local per-playlist)
  // =============================================
  _loadPlaylistVolumes() {
    try {
      return JSON.parse(localStorage.getItem("sounds-player-pl-volumes")) || {};
    } catch { return {}; }
  }

  _savePlaylistVolumes() {
    localStorage.setItem("sounds-player-pl-volumes", JSON.stringify(this._playlistVolumes));
  }

  _getPlaylistVolume(playlistId) {
    return this._playlistVolumes[playlistId] ?? 1;
  }

  _setPlaylistVolume(playlistId, volume) {
    this._playlistVolumes[playlistId] = volume;
    this._savePlaylistVolumes();
    this._applyPlaylistVolume(playlistId);
  }

  _applyPlaylistVolume(playlistId) {
    const vol = this._getPlaylistVolume(playlistId);
    const playlist = game.playlists?.get(playlistId);
    if (!playlist) return;
    for (const sound of playlist.sounds) {
      if (sound.playing && sound.sound) {
        try {
          sound.sound.volume = sound.volume * vol;
        } catch { /* ignore */ }
      }
    }
  }

  _applyAllPlaylistVolumes() {
    for (const playlist of game.playlists) {
      this._applyPlaylistVolume(playlist.id);
    }
  }

  // =============================================
  // SEEK HELPERS
  // In Foundry v13, Sound and AudioContainer are MERGED.
  // Sound.stop() corrupts the Sound state (duration/currentTime = 0).
  // Sound.currentTime setter doesn't actually seek.
  // The only reliable way is the Foundry document API:
  //   update({ playing: false }) then update({ playing: true, pausedTime })
  // We only seek on mouseup to avoid spamming the server during drag.
  // =============================================

  _getCurrentTime(playlistSound) {
    if (!playlistSound?.sound) return 0;
    try {
      const t = playlistSound.sound.currentTime;
      if (typeof t === "number" && isFinite(t)) return t;
    } catch {}
    return 0;
  }

  _getDuration(playlistSound) {
    if (!playlistSound?.sound) return 0;
    try {
      const d = playlistSound.sound.duration;
      if (typeof d === "number" && isFinite(d) && d > 0) return d;
    } catch {}
    return 0;
  }

  // Actually perform the seek via Foundry document API.
  // Called only on mouseup after drag, or on single click.
  async _doSeek(percent) {
    const playlistSound = this._getFocusedSound();
    if (!playlistSound) return;

    const duration = this._getDuration(playlistSound);
    if (!duration || !isFinite(duration)) return;

    const seekTime = Math.max(0, Math.min(percent * duration, duration - 0.5));

    // Use Foundry document API: stop then restart at position
    try {
      this._manualStops.add(playlistSound.id);
      await playlistSound.update({ playing: false });
      await playlistSound.update({ playing: true, pausedTime: seekTime });
    } catch (e) {
      console.warn("Sounds Player | Seek failed:", e);
    }
  }

  // =============================================
  // PREPARE CONTEXT
  // =============================================
  async _prepareContext() {
    const playlist = this._getPlaylist();
    const hasPlaylist = !!playlist;
    const sounds = this._getSounds();

    // Validate focusedSoundId
    if (this.focusedSoundId && !playlist?.sounds.get(this.focusedSoundId)) {
      this.focusedSoundId = null;
    }

    const slots = sounds.map((sound, index) => ({
      index,
      id: sound.id,
      name: sound.name,
      playing: sound.playing,
      active: this.focusedSoundId === sound.id,
      image: this._getSlotImage(sound.id)
    }));

    const focusedSound = this._getFocusedSound();
    const anyPlaying = sounds.some(s => s.playing);

    const playlistItems = [];
    for (const pl of game.playlists) {
      const category = this._getPlaylistCategory(pl.id);
      playlistItems.push({
        id: pl.id,
        name: pl.name,
        selected: this.currentPlaylist === pl.id,
        playing: this._isPlaylistPlaying(pl.id),
        emoji: PLAYLIST_CATEGORIES[category] || PLAYLIST_CATEGORIES.music,
        volume: this._getPlaylistVolume(pl.id),
        volumeExpanded: this._expandedVolumes.has(pl.id)
      });
    }

    return {
      slots,
      playlistItems,
      hasPlaylist,
      hasActiveSound: !!focusedSound,
      activeSoundName: focusedSound?.name || "",
      isPlaying: focusedSound?.playing || false,
      isLooping: focusedSound?.repeat || false,
      volume: focusedSound?.volume ?? 0.5,
      selectSlotLabel: i18n.t("selectSlot"),
      playlistsLabel: i18n.t("playlists"),
      selectPlaylistLabel: i18n.t("selectPlaylist"),
      anyPlaying
    };
  }

  // =============================================
  // RENDER & EVENT BINDING
  // =============================================
  _onRender(context, options) {
    const el = this.element;

    document.addEventListener("click", () => this._closeContextMenu());

    // --- Playlist sidebar ---
    el.querySelectorAll(".mp-playlist-item").forEach(item => {
      const playlistId = item.dataset.playlistId;

      item.addEventListener("click", (e) => {
        if (e.target.closest(".mp-playlist-vol-toggle")) return;
        this._onPlaylistSelect(playlistId);
      });

      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._showPlaylistContextMenu(e, playlistId);
      });
    });

    // Playlist volume toggles
    el.querySelectorAll(".mp-playlist-vol-toggle").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const playlistId = btn.dataset.playlistId;
        if (this._expandedVolumes.has(playlistId)) {
          this._expandedVolumes.delete(playlistId);
        } else {
          this._expandedVolumes.add(playlistId);
        }
        this.render();
      });
    });

    // Playlist volume sliders
    el.querySelectorAll(".mp-playlist-volume-slider").forEach(slider => {
      slider.addEventListener("input", (e) => {
        const playlistId = slider.dataset.playlistId;
        this._setPlaylistVolume(playlistId, parseFloat(e.target.value));
      });
    });

    el.querySelector(".mp-btn-new-playlist")?.addEventListener("click", () => this._onCreatePlaylist());

    // --- Slots ---
    el.querySelectorAll(".mp-slot").forEach(slot => {
      if (slot.classList.contains("mp-slot-add")) {
        slot.addEventListener("click", () => this._addSound());
        return;
      }

      const soundId = slot.dataset.soundId;
      const index = parseInt(slot.dataset.slot);

      slot.addEventListener("click", (e) => {
        if (e.button !== 0) return;
        this.focusedSoundId = soundId;
        this._updateUIOnly();
      });

      slot.addEventListener("dblclick", () => {
        this._togglePlaySound(soundId);
      });

      slot.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._showSlotContextMenu(e, soundId);
      });

      // Drag & drop
      slot.setAttribute("draggable", "true");

      slot.addEventListener("dragstart", (e) => {
        this._draggedSlot = index;
        slot.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", soundId);
      });

      slot.addEventListener("dragend", () => {
        slot.classList.remove("dragging");
        this._draggedSlot = null;
        el.querySelectorAll(".mp-slot").forEach(s => s.classList.remove("drag-over"));
      });

      slot.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (this._draggedSlot !== null && this._draggedSlot !== index) {
          slot.classList.add("drag-over");
        }
      });

      slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));

      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        slot.classList.remove("drag-over");
        if (this._draggedSlot !== null && this._draggedSlot !== index) {
          this._reorderSounds(this._draggedSlot, index);
          return;
        }
        this._onExternalDrop(e);
      });
    });

    // --- Player controls ---
    el.querySelector(".mp-btn-play")?.addEventListener("click", () => this._onPlayPause());
    el.querySelector(".mp-btn-stop")?.addEventListener("click", () => this._onStop());
    el.querySelector(".mp-btn-loop")?.addEventListener("click", () => this._onToggleLoop());
    el.querySelector(".mp-btn-backward")?.addEventListener("click", () => this._onPrevTrack());
    el.querySelector(".mp-btn-forward")?.addEventListener("click", () => this._onNextTrack());

    // Timeline seek:
    // - During drag: only update the visual progress bar (no audio change)
    // - On mouseup: perform actual seek via Foundry document API
    const timeline = el.querySelector(".mp-timeline");
    if (timeline) {
      let dragging = false;
      let seekPercent = 0;

      const updateVisual = (e) => {
        const rect = timeline.getBoundingClientRect();
        seekPercent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const progress = el.querySelector(".mp-timeline-progress");
        if (progress) progress.style.width = (seekPercent * 100) + "%";

        // Update time display during drag
        const focusedSound = this._getFocusedSound();
        const duration = this._getDuration(focusedSound);
        const timeCurrent = el.querySelector(".mp-time-current");
        if (timeCurrent && duration) {
          timeCurrent.textContent = this._formatTime(seekPercent * duration);
        }
      };

      timeline.addEventListener("mousedown", (e) => {
        e.preventDefault();
        dragging = true;
        this._seeking = true;
        updateVisual(e);
      });

      window.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        e.preventDefault();
        updateVisual(e);
      });

      window.addEventListener("mouseup", () => {
        if (dragging) {
          dragging = false;
          this._seeking = false;
          this._doSeek(seekPercent);
        }
      });
    }

    el.querySelector(".mp-volume-slider")?.addEventListener("input", (e) => this._onVolumeChange(e));

    this._startUpdateLoop();
  }

  // =============================================
  // PLAYLIST CONTEXT MENU
  // =============================================
  _showPlaylistContextMenu(event, playlistId) {
    this._closeContextMenu();

    const menu = document.createElement("div");
    menu.className = "mp-context-menu";
    menu.style.left = event.clientX + "px";
    menu.style.top = event.clientY + "px";

    // Edit playlist
    this._addMenuItem(menu, "fa-edit", i18n.t("editPlaylist"), () => {
      const playlist = game.playlists.get(playlistId);
      if (playlist) playlist.sheet.render(true);
    });

    // Import folder
    this._addMenuItem(menu, "fa-folder-open", i18n.t("importFolder"), () => {
      this._importFolderToPlaylist(playlistId);
    });

    // Category submenu
    this._addMenuSeparator(menu);
    const catHeader = document.createElement("div");
    catHeader.className = "mp-context-menu-header";
    catHeader.textContent = i18n.t("changeCategory");
    menu.appendChild(catHeader);

    for (const [key, emoji] of Object.entries(PLAYLIST_CATEGORIES)) {
      const label = i18n.t("category" + key.charAt(0).toUpperCase() + key.slice(1));
      const current = this._getPlaylistCategory(playlistId);
      this._addMenuItem(menu, null, `${emoji} ${label}${current === key ? " \u2713" : ""}`, async () => {
        const playlist = game.playlists.get(playlistId);
        if (playlist) await playlist.setFlag("sounds-player", "category", key);
        this.render();
      });
    }

    this._addMenuSeparator(menu);

    // Delete
    this._addMenuItem(menu, "fa-trash", i18n.t("deletePlaylist"), () => {
      this._deletePlaylist(playlistId);
    }, true);

    document.body.appendChild(menu);
    this._contextMenu = menu;
    this._adjustContextMenuPosition(menu);
  }

  // =============================================
  // SLOT CONTEXT MENU
  // =============================================
  _showSlotContextMenu(event, soundId) {
    this._closeContextMenu();

    const menu = document.createElement("div");
    menu.className = "mp-context-menu";
    menu.style.left = event.clientX + "px";
    menu.style.top = event.clientY + "px";

    // Edit sound (opens Foundry native sound config)
    this._addMenuItem(menu, "fa-edit", i18n.t("editSound"), () => {
      const playlist = this._getPlaylist();
      const sound = playlist?.sounds.get(soundId);
      if (sound) sound.sheet.render(true);
    });

    // Change image
    this._addMenuItem(menu, "fa-image", i18n.t("changeImage"), () => {
      this._pickSlotImage(soundId);
    });

    // Remove image (if has one)
    if (this._getSlotImage(soundId)) {
      this._addMenuItem(menu, "fa-times", i18n.t("removeImage"), () => {
        this._removeSlotImage(soundId);
        this.render();
      });
    }

    this._addMenuSeparator(menu);

    // Remove sound
    this._addMenuItem(menu, "fa-trash", i18n.t("removeSound"), () => {
      this._removeSound(soundId);
    }, true);

    document.body.appendChild(menu);
    this._contextMenu = menu;
    this._adjustContextMenuPosition(menu);
  }

  // =============================================
  // CONTEXT MENU HELPERS
  // =============================================
  _addMenuItem(menu, icon, label, callback, danger = false) {
    const item = document.createElement("div");
    item.className = "mp-context-menu-item" + (danger ? " danger" : "");
    item.innerHTML = (icon ? `<i class="fas ${icon}"></i> ` : "") + label;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      this._closeContextMenu();
      callback();
    });
    menu.appendChild(item);
  }

  _addMenuSeparator(menu) {
    const sep = document.createElement("div");
    sep.style.cssText = "height:1px;background:#444;margin:4px 0";
    menu.appendChild(sep);
  }

  _adjustContextMenuPosition(menu) {
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 10) + "px";
    if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 10) + "px";
  }

  _closeContextMenu() {
    if (this._contextMenu) {
      this._contextMenu.remove();
      this._contextMenu = null;
    }
  }

  _pickSlotImage(soundId) {
    new FilePicker({
      type: "image",
      current: this._getSlotImage(soundId) || "",
      callback: (path) => { this._setSlotImage(soundId, path); this.render(); }
    }).browse();
  }

  // =============================================
  // PLAYLIST MANAGEMENT
  // =============================================
  _onPlaylistSelect(playlistId) {
    if (this.currentPlaylist === playlistId) return;
    this.currentPlaylist = playlistId;
    this.focusedSoundId = null;
    this.render();
  }

  async _onCreatePlaylist() {
    const name = await PlaylistNameDialog.prompt(i18n.t("newPlaylist"));
    if (!name) return;

    const playlist = await Playlist.create({
      name, sounds: [], mode: CONST.PLAYLIST_MODES.SIMULTANEOUS,
      flags: { "sounds-player": { category: "music" } }
    });

    this.currentPlaylist = playlist.id;
    this.focusedSoundId = null;
    this.render();
    ui.notifications.info(`${i18n.t("playlistCreated")}: ${name}`);
  }

  async _editPlaylist(playlistId) {
    const playlist = game.playlists.get(playlistId);
    if (playlist) playlist.sheet.render(true);
  }

  async _importFolderToPlaylist(playlistId) {
    const playlist = game.playlists.get(playlistId);
    if (!playlist) return;

    const fp = new FilePicker({
      type: "folder",
      callback: async (folderPath) => {
        if (!folderPath) return;
        const result = await FilePicker.browse("data", folderPath);
        const audioFiles = result.files.filter(f => /\.(mp3|ogg|wav|webm|m4a|flac)$/i.test(f));

        if (audioFiles.length === 0) {
          ui.notifications.warn("No audio files found");
          return;
        }

        const soundsData = audioFiles.map(f => ({
          name: cleanSoundName(f),
          path: f,
          volume: 0.5
        }));

        await playlist.createEmbeddedDocuments("PlaylistSound", soundsData);
        ui.notifications.info(`${audioFiles.length} ${i18n.t("importedSounds")}`);
        this.render();
      }
    });
    fp.browse();
  }

  async _deletePlaylist(playlistId) {
    const playlist = game.playlists.get(playlistId);
    if (!playlist) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: i18n.t("deletePlaylist") },
      content: `<p>${i18n.t("confirmDelete")}</p><p><strong>${playlist.name}</strong></p>`,
      yes: { label: i18n.t("deletePlaylist"), icon: "fas fa-trash" },
      no: { label: i18n.t("cancel"), icon: "fas fa-times" }
    });

    if (!confirmed) return;

    // Stop all playing sounds first
    for (const sound of playlist.sounds) {
      if (sound.playing) {
        try { await sound.update({ playing: false }); } catch { /* ignore */ }
      }
    }

    // Clean up images
    delete this._allPlaylistImages[playlistId];
    this._saveAllPlaylistImages();

    await playlist.delete();

    if (this.currentPlaylist === playlistId) {
      this.currentPlaylist = "";
      this.focusedSoundId = null;
    }

    this.render();
    ui.notifications.info(i18n.t("playlistDeleted"));
  }

  // =============================================
  // SOUND MANAGEMENT
  // =============================================
  async _addSound() {
    if (!this.currentPlaylist) {
      ui.notifications.warn(i18n.t("selectPlaylist"));
      return;
    }

    new SoundPickerApp(async (soundData) => {
      const playlist = this._getPlaylist();
      if (!playlist) return;

      if (soundData.batchFiles) {
        // Batch import
        const soundsData = soundData.batchFiles.map(f => ({
          name: cleanSoundName(f),
          path: f,
          volume: 0.5
        }));
        await playlist.createEmbeddedDocuments("PlaylistSound", soundsData);
        ui.notifications.info(`${soundData.batchFiles.length} ${i18n.t("importedSounds")}`);
      } else {
        // Single sound
        const created = await playlist.createEmbeddedDocuments("PlaylistSound", [{
          name: soundData.name,
          path: soundData.path,
          volume: 0.5
        }]);
        if (created.length > 0) {
          this.focusedSoundId = created[0].id;
        }
      }
      this.render();
    }).render(true);
  }

  async _removeSound(soundId) {
    const playlist = this._getPlaylist();
    const sound = playlist?.sounds.get(soundId);
    if (!sound) return;

    // Stop if playing
    if (sound.playing) {
      try { await sound.update({ playing: false }); } catch { /* ignore */ }
    }

    // Remove image
    this._removeSlotImage(soundId);

    // Reset focus if this was focused
    if (this.focusedSoundId === soundId) {
      this.focusedSoundId = null;
    }

    await playlist.deleteEmbeddedDocuments("PlaylistSound", [soundId]);
    this.render();
  }

  async _reorderSounds(fromIndex, toIndex) {
    const sounds = this._getSounds();
    if (fromIndex >= sounds.length || toIndex >= sounds.length) return;

    // Build new order
    const ordered = [...sounds];
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);

    // Update sort values
    const updates = ordered.map((sound, i) => ({
      _id: sound.id,
      sort: (i + 1) * 100000
    }));

    const playlist = this._getPlaylist();
    if (playlist) {
      await playlist.updateEmbeddedDocuments("PlaylistSound", updates);
    }
    this.render();
  }

  async _onExternalDrop(event) {
    try {
      const data = JSON.parse(event.dataTransfer.getData("text/plain"));
      if (data.type !== "PlaylistSound") return;

      let playlistId, soundId;
      if (data.uuid) {
        const parts = data.uuid.split(".");
        playlistId = parts[1];
        soundId = parts[3];
      } else {
        playlistId = data.playlistId || data.parentId;
        soundId = data.soundId || data.id;
      }

      const srcPlaylist = game.playlists.get(playlistId);
      const srcSound = srcPlaylist?.sounds.get(soundId);
      if (!srcSound) return;

      // Add to current playlist
      const destPlaylist = this._getPlaylist();
      if (!destPlaylist) return;

      const created = await destPlaylist.createEmbeddedDocuments("PlaylistSound", [{
        name: srcSound.name,
        path: srcSound.path,
        volume: srcSound.volume ?? 0.5
      }]);

      if (created.length > 0) {
        this.focusedSoundId = created[0].id;
      }
      this.render();
    } catch { /* ignore non-parseable drops */ }
  }

  // =============================================
  // PLAYBACK CONTROLS (via Foundry native API)
  // =============================================
  async _togglePlaySound(soundId) {
    const playlist = this._getPlaylist();
    const sound = playlist?.sounds.get(soundId);
    if (!sound) return;

    this.focusedSoundId = soundId;

    if (sound.playing) {
      // Pause: save current position
      const currentTime = this._getCurrentTime(sound);
      this._manualStops.add(soundId);
      await sound.update({ playing: false, pausedTime: currentTime });
    } else {
      // Play: Foundry will resume from pausedTime
      await sound.update({ playing: true });
    }
  }

  async _onPlayPause() {
    if (!this.focusedSoundId) {
      const sounds = this._getSounds();
      if (sounds.length > 0) {
        this.focusedSoundId = sounds[0].id;
      } else return;
    }
    await this._togglePlaySound(this.focusedSoundId);
  }

  async _onStop() {
    if (!this.focusedSoundId) return;
    const playlist = this._getPlaylist();
    const sound = playlist?.sounds.get(this.focusedSoundId);
    if (!sound) return;

    this._manualStops.add(this.focusedSoundId);

    if (sound.playing) {
      await sound.update({ playing: false, pausedTime: 0 });
    }
  }

  async _onToggleLoop() {
    if (!this.focusedSoundId) return;
    const playlist = this._getPlaylist();
    const sound = playlist?.sounds.get(this.focusedSoundId);
    if (!sound) return;

    await sound.update({ repeat: !sound.repeat });
  }

  async _onVolumeChange(event) {
    const volume = parseFloat(event.target.value);
    if (!this.focusedSoundId) return;

    const playlist = this._getPlaylist();
    const sound = playlist?.sounds.get(this.focusedSoundId);
    if (!sound) return;

    // Update Foundry document (syncs to all clients)
    await sound.update({ volume });

    // Apply playlist volume multiplier locally
    const plVol = this._getPlaylistVolume(this.currentPlaylist);
    if (sound.sound) {
      try { sound.sound.volume = volume * plVol; } catch { /* ignore */ }
    }
  }

  _onPrevTrack() {
    const sounds = this._getSounds();
    if (sounds.length === 0) return;
    const currentIdx = sounds.findIndex(s => s.id === this.focusedSoundId);
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : sounds.length - 1;
    this.focusedSoundId = sounds[prevIdx].id;
    this._updateUIOnly();
  }

  _onNextTrack() {
    const sounds = this._getSounds();
    if (sounds.length === 0) return;
    const currentIdx = sounds.findIndex(s => s.id === this.focusedSoundId);
    const nextIdx = currentIdx < sounds.length - 1 ? currentIdx + 1 : 0;
    this.focusedSoundId = sounds[nextIdx].id;
    this._updateUIOnly();
  }

  // Auto-advance when a track ends naturally
  _onSoundStopped(playlistSound) {
    if (this._manualStops.has(playlistSound.id)) {
      this._manualStops.delete(playlistSound.id);
      return;
    }
    // Natural end: auto-advance if this was the focused sound
    if (this.focusedSoundId !== playlistSound.id) return;
    if (playlistSound.repeat) return;

    const sounds = this._getSounds();
    const currentIdx = sounds.findIndex(s => s.id === this.focusedSoundId);
    if (currentIdx < 0) return;

    const nextIdx = currentIdx + 1;
    if (nextIdx < sounds.length) {
      const nextSound = sounds[nextIdx];
      this.focusedSoundId = nextSound.id;
      nextSound.update({ playing: true }).catch(e => console.error(e));
    }
  }

  // =============================================
  // UI UPDATE LOOP
  // =============================================
  _startUpdateLoop() {
    if (this._updateInterval) clearInterval(this._updateInterval);
    this._updateInterval = setInterval(() => {
      if (!this.element) { clearInterval(this._updateInterval); return; }
      this._updateUIOnly();
      this._applyAllPlaylistVolumes();
    }, 100);
  }

  _updateUIOnly() {
    const el = this.element;
    if (!el) return;

    const sounds = this._getSounds();
    const anyPlaying = sounds.some(s => s.playing);

    // Header bars animation
    const headerBars = el.querySelector(".mp-header-bars");
    if (headerBars) headerBars.classList.toggle("playing", anyPlaying);

    // Playlist sidebar playing state
    el.querySelectorAll(".mp-playlist-item").forEach(item => {
      const playlistId = item.dataset.playlistId;
      item.classList.toggle("playing", this._isPlaylistPlaying(playlistId));
    });

    // Slots state
    sounds.forEach((sound, i) => {
      const slotEl = el.querySelector(`.mp-slot[data-sound-id="${sound.id}"]`);
      if (!slotEl) return;

      slotEl.classList.toggle("playing", sound.playing);
      slotEl.classList.toggle("active", this.focusedSoundId === sound.id);

      const nameEl = slotEl.querySelector(".mp-slot-name");
      if (nameEl && nameEl.textContent !== sound.name) nameEl.textContent = sound.name;

      // Image
      const image = this._getSlotImage(sound.id);
      const iconEl = slotEl.querySelector(".mp-slot-icon");
      const imgEl = slotEl.querySelector(".mp-slot-image");

      if (image) {
        if (iconEl) iconEl.style.display = "none";
        if (imgEl) { imgEl.style.display = "block"; if (imgEl.src !== image) imgEl.src = image; }
        else {
          const newImg = document.createElement("img");
          newImg.className = "mp-slot-image";
          newImg.src = image;
          slotEl.insertBefore(newImg, slotEl.firstChild);
        }
      } else {
        if (iconEl) iconEl.style.display = "block";
        if (imgEl) imgEl.style.display = "none";
      }
    });

    // Player controls
    const focusedSound = this._getFocusedSound();
    const btnPlay = el.querySelector(".mp-btn-play");
    const btnLoop = el.querySelector(".mp-btn-loop");

    if (btnPlay) {
      const isPlaying = focusedSound?.playing || false;
      btnPlay.classList.toggle("playing", isPlaying);
      const icon = btnPlay.querySelector("i");
      if (icon) icon.className = isPlaying ? "fas fa-pause" : "fas fa-play";
    }

    if (btnLoop) btnLoop.classList.toggle("active", focusedSound?.repeat || false);

    // Timeline
    const current = focusedSound ? this._getCurrentTime(focusedSound) : 0;
    const duration = focusedSound ? this._getDuration(focusedSound) : 0;
    const percent = duration > 0 ? (current / duration) * 100 : 0;

    if (!this._seeking) {
      const progress = el.querySelector(".mp-timeline-progress");
      if (progress) progress.style.width = percent + "%";
    }

    const timeCurrent = el.querySelector(".mp-time-current");
    if (timeCurrent) timeCurrent.textContent = this._formatTime(current);

    const timeTotal = el.querySelector(".mp-time-total");
    if (timeTotal) timeTotal.textContent = this._formatTime(duration);

    // Volume slider
    const volumeSlider = el.querySelector(".mp-volume-slider");
    if (volumeSlider && document.activeElement !== volumeSlider && focusedSound) {
      volumeSlider.value = focusedSound.volume ?? 0.5;
    }

    // Title
    const title = el.querySelector(".mp-player-title");
    if (title) {
      if (focusedSound) {
        title.textContent = focusedSound.name;
        title.title = focusedSound.name;
        title.classList.remove("mp-no-selection");
      } else {
        title.textContent = i18n.t("selectSlot");
        title.classList.add("mp-no-selection");
      }
    }
  }

  _formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  async close(options) {
    if (this._updateInterval) clearInterval(this._updateInterval);
    this._closeContextMenu();
    return super.close(options);
  }
}

// =============================================
// MODULE INITIALIZATION
// =============================================
Hooks.once("init", () => {
  console.log("Sounds Player | Init");
  foundry.applications.handlebars.loadTemplates([
    "modules/sounds-player/templates/player.html",
    "modules/sounds-player/templates/picker.html"
  ]);
});

Hooks.once("ready", () => {
  console.log("Sounds Player | Ready");
  game.soundsPlayer = new SoundsPlayerApp();
});

// React to Foundry playlist/sound changes to keep UI in sync
Hooks.on("updatePlaylistSound", (sound, changes) => {
  if ("playing" in changes && changes.playing === false) {
    game.soundsPlayer?._onSoundStopped(sound);
  }
  game.soundsPlayer?._updateUIOnly();
});

Hooks.on("createPlaylistSound", () => {
  game.soundsPlayer?.render();
});

Hooks.on("deletePlaylistSound", () => {
  game.soundsPlayer?.render();
});

Hooks.on("updatePlaylist", () => {
  game.soundsPlayer?.render();
});

Hooks.on("createPlaylist", () => {
  game.soundsPlayer?.render();
});

Hooks.on("deletePlaylist", () => {
  game.soundsPlayer?.render();
});

Hooks.on("getSceneControlButtons", (controls) => {
  const soundsControl = controls.sounds || controls.find?.(c => c.name === "sounds");
  if (!soundsControl) return;

  const tools = soundsControl.tools;

  if (typeof tools === "object" && !Array.isArray(tools)) {
    tools.soundsPlayer = {
      name: "soundsPlayer",
      title: "The Sounds Player",
      icon: "fa-solid fa-circle-play",
      button: true,
      onChange: () => game.soundsPlayer?.render(true)
    };
  } else if (Array.isArray(tools)) {
    tools.push({
      name: "soundsPlayer",
      title: "The Sounds Player",
      icon: "fa-solid fa-circle-play",
      button: true,
      onClick: () => game.soundsPlayer?.render(true)
    });
  }
});
