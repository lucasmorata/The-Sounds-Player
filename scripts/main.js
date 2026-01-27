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
        "playlists": "Playlists"
      },
      fr: {
        "empty": "Vide",
        "selectSlot": "Sélectionnez un slot",
        "changeImage": "Changer l'image",
        "removeImage": "Supprimer l'image",
        "removeSound": "Supprimer le son",
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
        "playlists": "Playlists"
      }
    };
    const lang = this.lang === "fr" ? "fr" : "en";
    return translations[lang][key] || translations["en"][key] || key;
  }
};

// =============================================
// CUSTOM AUDIO PLAYER
// =============================================
class CustomAudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.volume = 0.5;
    this.loop = false;
    this.currentPath = null;
    this.onEnded = null;
    
    this.audio.addEventListener("ended", () => {
      if (this.loop) {
        this.audio.currentTime = 0;
        this.audio.play();
      } else if (this.onEnded) {
        this.onEnded();
      }
    });
  }
  
  async load(path) {
    if (this.currentPath === path && this.audio.src) {
      return;
    }
    this.currentPath = path;
    this.audio.src = path;
    this.audio.volume = this.volume;
    this.audio.loop = this.loop;
    
    return new Promise((resolve, reject) => {
      this.audio.addEventListener("canplay", () => resolve(), { once: true });
      this.audio.addEventListener("error", (e) => reject(e), { once: true });
      this.audio.load();
    });
  }
  
  async play() {
    if (!this.audio.src) return;
    try {
      await this.audio.play();
    } catch (e) {
      console.error("Sounds Player | Play error:", e);
    }
  }
  
  pause() { this.audio.pause(); }
  
  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
  
  seek(time) {
    if (!this.audio.src) return;
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
  }
  
  seekPercent(percent) {
    if (!this.audio.duration) return;
    this.seek(percent * this.audio.duration);
  }
  
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.audio.volume = this.volume;
  }
  
  setLoop(loop) {
    this.loop = loop;
    this.audio.loop = loop;
  }
  
  get isPlaying() { return !this.audio.paused && !this.audio.ended; }
  get currentTime() { return this.audio.currentTime || 0; }
  get duration() { return this.audio.duration || 0; }
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
            playlistId: playlist.id, playlistName: playlist.name, playlistSound: sound
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
            const name = path.split("/").pop().replace(/\.[^/.]+$/, "");
            this.callback({ id: null, name, path, playlistId: null, playlistName: "Local", playlistSound: null });
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

        // Return first file and signal batch import
        if (this.callback) {
          this.callback({
            id: null,
            name: audioFiles[0].split("/").pop().replace(/\.[^/.]+$/, ""),
            path: audioFiles[0],
            playlistId: null,
            playlistName: "Local",
            playlistSound: null,
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
// =============================================
class SoundsPlayerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    // Per-playlist state
    this.playlistStates = {}; // { playlistId: { slots, players, activeSlot } }
    this.currentPlaylist = "";
    this._updateInterval = null;
    this._contextMenu = null;
    this._draggedSlot = null;
    this._saving = false;
    this._allPlaylistImages = this._loadAllPlaylistImages();
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

  // Get/create state for a playlist
  _getPlaylistState(playlistId) {
    if (!this.playlistStates[playlistId]) {
      this.playlistStates[playlistId] = { slots: [], players: [], activeSlot: null };
    }
    return this.playlistStates[playlistId];
  }

  get currentState() {
    if (!this.currentPlaylist) return { slots: [], players: [], activeSlot: null };
    return this._getPlaylistState(this.currentPlaylist);
  }

  get slots() { return this.currentState.slots; }
  set slots(v) { if (this.currentPlaylist) this._getPlaylistState(this.currentPlaylist).slots = v; }
  
  get players() { return this.currentState.players; }
  set players(v) { if (this.currentPlaylist) this._getPlaylistState(this.currentPlaylist).players = v; }
  
  get activeSlot() { return this.currentState.activeSlot; }
  set activeSlot(v) { if (this.currentPlaylist) this._getPlaylistState(this.currentPlaylist).activeSlot = v; }

  get slotImages() {
    if (!this.currentPlaylist) return {};
    return this._allPlaylistImages[this.currentPlaylist] || {};
  }
  
  set slotImages(images) {
    if (!this.currentPlaylist) return;
    this._allPlaylistImages[this.currentPlaylist] = images;
    this._saveAllPlaylistImages();
  }

  _loadAllPlaylistImages() {
    try {
      return JSON.parse(localStorage.getItem("sounds-player-all-images")) || {};
    } catch (e) { return {}; }
  }

  _saveAllPlaylistImages() {
    localStorage.setItem("sounds-player-all-images", JSON.stringify(this._allPlaylistImages));
  }

  _setSlotImage(index, path) {
    if (!this.currentPlaylist) return;
    if (!this._allPlaylistImages[this.currentPlaylist]) this._allPlaylistImages[this.currentPlaylist] = {};
    this._allPlaylistImages[this.currentPlaylist][index] = path;
    this._saveAllPlaylistImages();
  }

  _removeSlotImage(index) {
    if (!this.currentPlaylist || !this._allPlaylistImages[this.currentPlaylist]) return;
    delete this._allPlaylistImages[this.currentPlaylist][index];
    this._saveAllPlaylistImages();
  }

  // Check if any playlist is playing
  _isPlaylistPlaying(playlistId) {
    const state = this.playlistStates[playlistId];
    if (!state) return false;
    return state.players.some(p => p?.isPlaying);
  }

  async _prepareContext() {
    const anyPlaying = this.players.some(p => p?.isPlaying);
    
    const slots = this.slots.map((soundData, index) => {
      const player = this.players[index];
      const image = this.slotImages[index];
      return {
        index, empty: !soundData,
        name: soundData?.name || i18n.t("empty"),
        playing: player?.isPlaying || false,
        active: this.activeSlot === index,
        image: image || null
      };
    });

    const activeSound = this._getActiveSound();
    const activePlayer = this._getActivePlayer();
    
    // Build playlist list
    const playlistItems = [];
    for (const playlist of game.playlists) {
      playlistItems.push({
        id: playlist.id,
        name: playlist.name,
        selected: this.currentPlaylist === playlist.id,
        playing: this._isPlaylistPlaying(playlist.id)
      });
    }
    
    return {
      slots, playlistItems,
      hasActiveSound: !!activeSound,
      activeSoundName: activeSound?.name || "",
      isPlaying: activePlayer?.isPlaying || false,
      isLooping: activePlayer?.loop || false,
      volume: activePlayer?.volume ?? 0.5,
      currentPlaylist: this.currentPlaylist,
      selectSlotLabel: i18n.t("selectSlot"),
      playlistsLabel: i18n.t("playlists"),
      anyPlaying
    };
  }

  _onRender(context, options) {
    const el = this.element;

    document.addEventListener("click", () => this._closeContextMenu());

    // Playlist sidebar
    el.querySelectorAll(".mp-playlist-item").forEach(item => {
      const playlistId = item.dataset.playlistId;
      
      item.addEventListener("click", () => this._onPlaylistSelect(playlistId));
      
      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._showPlaylistContextMenu(e, playlistId);
      });
    });

    el.querySelector(".mp-btn-new-playlist")?.addEventListener("click", () => this._onCreatePlaylist());

    // Slots
    el.querySelectorAll(".mp-slot").forEach(slot => {
      const index = parseInt(slot.dataset.slot);
      
      if (slot.classList.contains("mp-slot-add")) {
        slot.addEventListener("click", () => this._addSlot());
        return;
      }

      slot.addEventListener("click", (e) => {
        if (e.button !== 0) return;
        if (!this.slots[index]) {
          this._openSoundPicker(index);
        } else {
          this.activeSlot = index;
          this._updateUIOnly();
        }
      });

      slot.addEventListener("dblclick", () => this._openSoundPicker(index));

      slot.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.slots[index]) this._showSlotContextMenu(e, index);
      });

      // Drag & drop
      slot.setAttribute("draggable", "true");
      
      slot.addEventListener("dragstart", (e) => {
        if (!this.slots[index]) { e.preventDefault(); return; }
        this._draggedSlot = index;
        slot.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
      });
      
      slot.addEventListener("dragend", () => {
        slot.classList.remove("dragging");
        this._draggedSlot = null;
        el.querySelectorAll(".mp-slot").forEach(s => s.classList.remove("drag-over"));
      });
      
      slot.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (this._draggedSlot !== null && this._draggedSlot !== index) slot.classList.add("drag-over");
      });
      
      slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
      
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        slot.classList.remove("drag-over");
        if (this._draggedSlot !== null && this._draggedSlot !== index) {
          this._reorderSlots(this._draggedSlot, index);
          return;
        }
        this._onExternalDrop(e, index);
      });
    });

    // Controls
    el.querySelector(".mp-btn-play")?.addEventListener("click", () => this._onPlayPause());
    el.querySelector(".mp-btn-stop")?.addEventListener("click", () => this._onStop());
    el.querySelector(".mp-btn-loop")?.addEventListener("click", () => this._onToggleLoop());
    el.querySelector(".mp-btn-backward")?.addEventListener("click", () => this._onPrevTrack());
    el.querySelector(".mp-btn-forward")?.addEventListener("click", () => this._onNextTrack());

    // Timeline
    const timeline = el.querySelector(".mp-timeline");
    if (timeline) {
      let dragging = false;
      const handleSeek = (e) => {
        const rect = timeline.getBoundingClientRect();
        this._seekToPercent(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
      };
      timeline.addEventListener("mousedown", (e) => { dragging = true; handleSeek(e); });
      document.addEventListener("mousemove", (e) => { if (dragging) handleSeek(e); });
      document.addEventListener("mouseup", () => { dragging = false; });
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
    const editItem = document.createElement("div");
    editItem.className = "mp-context-menu-item";
    editItem.innerHTML = `<i class="fas fa-edit"></i> ${i18n.t("editPlaylist")}`;
    editItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this._closeContextMenu();
      this._editPlaylist(playlistId);
    });
    menu.appendChild(editItem);
    
    // Import folder
    const importItem = document.createElement("div");
    importItem.className = "mp-context-menu-item";
    importItem.innerHTML = `<i class="fas fa-folder-open"></i> ${i18n.t("importFolder")}`;
    importItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this._closeContextMenu();
      this._importFolderToPlaylist(playlistId);
    });
    menu.appendChild(importItem);
    
    // Separator
    const sep = document.createElement("div");
    sep.style.cssText = "height:1px;background:#444;margin:4px 0";
    menu.appendChild(sep);
    
    // Delete
    const deleteItem = document.createElement("div");
    deleteItem.className = "mp-context-menu-item danger";
    deleteItem.innerHTML = `<i class="fas fa-trash"></i> ${i18n.t("deletePlaylist")}`;
    deleteItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this._closeContextMenu();
      this._deletePlaylist(playlistId);
    });
    menu.appendChild(deleteItem);
    
    document.body.appendChild(menu);
    this._contextMenu = menu;
    this._adjustContextMenuPosition(menu);
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
          name: f.split("/").pop().replace(/\.[^/.]+$/, ""),
          path: f,
          volume: 0.5
        }));
        
        await playlist.createEmbeddedDocuments("PlaylistSound", soundsData);
        ui.notifications.info(`${audioFiles.length} ${i18n.t("importedSounds")}`);
        
        // Reload if this is current playlist
        if (this.currentPlaylist === playlistId) {
          this._loadPlaylist(playlistId);
        }
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
    
    // Stop and clear state
    const state = this.playlistStates[playlistId];
    if (state) {
      state.players.forEach(p => p?.stop());
      delete this.playlistStates[playlistId];
    }
    delete this._allPlaylistImages[playlistId];
    this._saveAllPlaylistImages();
    
    await playlist.delete();
    
    if (this.currentPlaylist === playlistId) {
      this.currentPlaylist = "";
    }
    
    this.render();
    ui.notifications.info(`${i18n.t("playlistDeleted")}: ${playlist.name}`);
  }

  // =============================================
  // SLOT CONTEXT MENU
  // =============================================
  _showSlotContextMenu(event, slotIndex) {
    this._closeContextMenu();
    
    const menu = document.createElement("div");
    menu.className = "mp-context-menu";
    menu.style.left = event.clientX + "px";
    menu.style.top = event.clientY + "px";
    
    // Change image
    const changeImageItem = document.createElement("div");
    changeImageItem.className = "mp-context-menu-item";
    changeImageItem.innerHTML = `<i class="fas fa-image"></i> ${i18n.t("changeImage")}`;
    changeImageItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this._closeContextMenu();
      this._pickSlotImage(slotIndex);
    });
    menu.appendChild(changeImageItem);
    
    if (this.slotImages[slotIndex]) {
      const removeImageItem = document.createElement("div");
      removeImageItem.className = "mp-context-menu-item";
      removeImageItem.innerHTML = `<i class="fas fa-times"></i> ${i18n.t("removeImage")}`;
      removeImageItem.addEventListener("click", (e) => {
        e.stopPropagation();
        this._closeContextMenu();
        this._removeSlotImage(slotIndex);
        this.render();
      });
      menu.appendChild(removeImageItem);
    }
    
    const sep = document.createElement("div");
    sep.style.cssText = "height:1px;background:#444;margin:4px 0";
    menu.appendChild(sep);
    
    const removeItem = document.createElement("div");
    removeItem.className = "mp-context-menu-item danger";
    removeItem.innerHTML = `<i class="fas fa-trash"></i> ${i18n.t("removeSound")}`;
    removeItem.addEventListener("click", (e) => {
      e.stopPropagation();
      this._closeContextMenu();
      this._removeSlot(slotIndex);
    });
    menu.appendChild(removeItem);
    
    document.body.appendChild(menu);
    this._contextMenu = menu;
    this._adjustContextMenuPosition(menu);
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
  
  _pickSlotImage(slotIndex) {
    new FilePicker({
      type: "image",
      current: this.slotImages[slotIndex] || "",
      callback: (path) => { this._setSlotImage(slotIndex, path); this.render(); }
    }).browse();
  }

  // =============================================
  // PLAYLIST MANAGEMENT
  // =============================================
  _onPlaylistSelect(playlistId) {
    if (this.currentPlaylist === playlistId) return;
    this.currentPlaylist = playlistId;
    this._loadPlaylist(playlistId);
    this.render();
  }

  _loadPlaylist(playlistId) {
    const playlist = game.playlists.get(playlistId);
    if (!playlist) return;
    
    const state = this._getPlaylistState(playlistId);
    
    // Only reload if empty (preserve playing state)
    if (state.slots.length === 0) {
      state.slots = [];
      state.players = [];
      
      for (const sound of playlist.sounds) {
        const player = new CustomAudioPlayer();
        const idx = state.slots.length;
        player.onEnded = () => this._onTrackEnded(idx);
        state.players.push(player);
        
        state.slots.push({
          id: sound.id, name: sound.name, path: sound.path,
          playlistId: playlist.id, playlistName: playlist.name, playlistSound: sound
        });
        
        player.load(sound.path).catch(e => console.error(e));
      }
      
      state.activeSlot = null;
    }
  }

  async _onCreatePlaylist() {
    const name = await PlaylistNameDialog.prompt(i18n.t("newPlaylist"));
    if (!name) return;
    
    const playlist = await Playlist.create({
      name, sounds: [], mode: CONST.PLAYLIST_MODES.SEQUENTIAL
    });
    
    this.currentPlaylist = playlist.id;
    this._getPlaylistState(playlist.id); // Init empty state
    
    this.render();
    ui.notifications.info(`${i18n.t("playlistCreated")}: ${name}`);
  }

  // =============================================
  // AUTO-SAVE
  // =============================================
  async _autoSavePlaylist() {
    if (!this.currentPlaylist || this._saving) return;
    
    const playlist = game.playlists.get(this.currentPlaylist);
    if (!playlist) return;
    
    this._saving = true;
    
    try {
      const currentSoundIds = playlist.sounds.map(s => s.id);
      const newSoundsData = this.slots.filter(s => s && s.path).map(s => ({ name: s.name, path: s.path, volume: 0.5 }));
      
      if (currentSoundIds.length > 0) {
        await playlist.deleteEmbeddedDocuments("PlaylistSound", currentSoundIds);
      }
      
      if (newSoundsData.length > 0) {
        const created = await playlist.createEmbeddedDocuments("PlaylistSound", newSoundsData);
        created.forEach((sound, i) => {
          if (this.slots[i]) {
            this.slots[i].id = sound.id;
            this.slots[i].playlistSound = sound;
          }
        });
      }
    } catch (e) {
      console.error("Sounds Player | Auto-save error:", e);
    }
    
    this._saving = false;
  }

  // =============================================
  // SLOT OPERATIONS
  // =============================================
  async _reorderSlots(fromIndex, toIndex) {
    const [movedSlot] = this.slots.splice(fromIndex, 1);
    this.slots.splice(toIndex, 0, movedSlot);
    
    const [movedPlayer] = this.players.splice(fromIndex, 1);
    this.players.splice(toIndex, 0, movedPlayer);
    
    this.players.forEach((p, i) => { if (p) p.onEnded = () => this._onTrackEnded(i); });
    
    // Reindex images
    const oldImages = { ...this.slotImages };
    const newImages = {};
    this.slots.forEach((_, newIdx) => {
      let oldIdx;
      if (newIdx === toIndex) oldIdx = fromIndex;
      else if (fromIndex < toIndex) oldIdx = (newIdx >= fromIndex && newIdx < toIndex) ? newIdx + 1 : newIdx;
      else oldIdx = (newIdx > toIndex && newIdx <= fromIndex) ? newIdx - 1 : newIdx;
      if (oldImages[oldIdx]) newImages[newIdx] = oldImages[oldIdx];
    });
    this.slotImages = newImages;
    
    if (this.activeSlot === fromIndex) this.activeSlot = toIndex;
    else if (fromIndex < toIndex && this.activeSlot > fromIndex && this.activeSlot <= toIndex) this.activeSlot--;
    else if (fromIndex > toIndex && this.activeSlot >= toIndex && this.activeSlot < fromIndex) this.activeSlot++;
    
    await this._autoSavePlaylist();
    this.render();
  }

  async _removeSlot(index) {
    this.players[index]?.stop();
    this.slots.splice(index, 1);
    this.players.splice(index, 1);
    
    this.players.forEach((p, i) => { if (p) p.onEnded = () => this._onTrackEnded(i); });
    
    const oldImages = { ...this.slotImages };
    const newImages = {};
    Object.keys(oldImages).forEach(key => {
      const i = parseInt(key);
      if (i < index) newImages[i] = oldImages[i];
      else if (i > index) newImages[i - 1] = oldImages[i];
    });
    this.slotImages = newImages;
    
    if (this.activeSlot === index) this.activeSlot = null;
    else if (this.activeSlot > index) this.activeSlot--;
    
    await this._autoSavePlaylist();
    this.render();
  }

  _addSlot() {
    if (!this.currentPlaylist) {
      ui.notifications.warn("Select a playlist first");
      return;
    }
    
    const newPlayer = new CustomAudioPlayer();
    const newIndex = this.slots.length;
    newPlayer.onEnded = () => this._onTrackEnded(newIndex);
    
    this.slots.push(null);
    this.players.push(newPlayer);
    this._openSoundPicker(newIndex);
  }

  _openSoundPicker(slotIndex) {
    new SoundPickerApp(async (soundData) => {
      // Handle batch import
      if (soundData.batchFiles) {
        for (const filePath of soundData.batchFiles) {
          const name = filePath.split("/").pop().replace(/\.[^/.]+$/, "");
          const player = new CustomAudioPlayer();
          const idx = this.slots.length;
          player.onEnded = () => this._onTrackEnded(idx);
          this.players.push(player);
          this.slots.push({ id: null, name, path: filePath, playlistId: null, playlistName: "Local", playlistSound: null });
          player.load(filePath).catch(e => console.error(e));
        }
        ui.notifications.info(`${soundData.batchFiles.length} ${i18n.t("importedSounds")}`);
        await this._autoSavePlaylist();
        this.render();
        return;
      }
      
      // Single file
      while (this.slots.length <= slotIndex) {
        this.slots.push(null);
        const p = new CustomAudioPlayer();
        p.onEnded = () => this._onTrackEnded(this.players.length);
        this.players.push(p);
      }
      
      this.slots[slotIndex] = soundData;
      this.activeSlot = slotIndex;
      
      const player = this.players[slotIndex];
      if (player && soundData.path) player.load(soundData.path).catch(e => console.error(e));
      
      await this._autoSavePlaylist();
      this.render();
    }).render(true);
  }

  async _onExternalDrop(event, slotIndex) {
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
      
      const playlist = game.playlists.get(playlistId);
      const sound = playlist?.sounds.get(soundId);
      if (!sound) return;
      
      while (this.slots.length <= slotIndex) {
        this.slots.push(null);
        const p = new CustomAudioPlayer();
        p.onEnded = () => this._onTrackEnded(this.players.length);
        this.players.push(p);
      }
      
      this.slots[slotIndex] = {
        id: sound.id, name: sound.name, path: sound.path,
        playlistId: playlist.id, playlistName: playlist.name, playlistSound: sound
      };
      this.activeSlot = slotIndex;
      
      const player = this.players[slotIndex];
      if (player && sound.path) player.load(sound.path).catch(e => console.error(e));
      
      await this._autoSavePlaylist();
      this.render();
    } catch (e) { }
  }

  // =============================================
  // PLAYBACK
  // =============================================
  _onTrackEnded(slotIndex) {
    if (this.activeSlot !== slotIndex) return;
    const player = this.players[slotIndex];
    if (player?.loop) return;
    
    let nextSlot = slotIndex + 1;
    while (nextSlot < this.slots.length && !this.slots[nextSlot]) nextSlot++;
    
    if (nextSlot < this.slots.length && this.slots[nextSlot]) {
      this.activeSlot = nextSlot;
      const nextPlayer = this.players[nextSlot];
      const nextSound = this.slots[nextSlot];
      if (nextPlayer && nextSound?.path) {
        nextPlayer.load(nextSound.path).then(() => nextPlayer.play()).catch(e => console.error(e));
      }
      this._updateUIOnly();
    }
  }

  _getActivePlayer() {
    if (this.activeSlot === null) return null;
    return this.players[this.activeSlot];
  }

  _getActiveSound() {
    if (this.activeSlot === null || !this.slots[this.activeSlot]) return null;
    return this.slots[this.activeSlot];
  }

  _seekToPercent(percent) {
    const player = this._getActivePlayer();
    if (player) player.seekPercent(percent);
  }

  async _onPlayPause() {
    const player = this._getActivePlayer();
    const soundData = this._getActiveSound();
    if (!player || !soundData) return;

    if (player.isPlaying) {
      player.pause();
    } else {
      if (!player.currentPath && soundData.path) await player.load(soundData.path);
      await player.play();
    }
  }

  _onStop() {
    const player = this._getActivePlayer();
    if (player) player.stop();
  }

  _onToggleLoop() {
    const player = this._getActivePlayer();
    if (player) player.setLoop(!player.loop);
  }

  _onPrevTrack() {
    if (this.activeSlot === null) return;
    let prevSlot = this.activeSlot - 1;
    while (prevSlot >= 0 && !this.slots[prevSlot]) prevSlot--;
    if (prevSlot >= 0 && this.slots[prevSlot]) {
      this.activeSlot = prevSlot;
      this._updateUIOnly();
    }
  }

  _onNextTrack() {
    if (this.activeSlot === null) return;
    let nextSlot = this.activeSlot + 1;
    while (nextSlot < this.slots.length && !this.slots[nextSlot]) nextSlot++;
    if (nextSlot < this.slots.length && this.slots[nextSlot]) {
      this.activeSlot = nextSlot;
      this._updateUIOnly();
    }
  }

  _onVolumeChange(event) {
    const player = this._getActivePlayer();
    if (player) player.setVolume(parseFloat(event.target.value));
  }

  // =============================================
  // UI UPDATE
  // =============================================
  _startUpdateLoop() {
    if (this._updateInterval) clearInterval(this._updateInterval);
    this._updateInterval = setInterval(() => {
      if (!this.element) { clearInterval(this._updateInterval); return; }
      this._updateUIOnly();
    }, 100);
  }

  _updateUIOnly() {
    const el = this.element;
    if (!el) return;

    const anyPlaying = this.players.some(p => p?.isPlaying);

    const headerBars = el.querySelector(".mp-header-bars");
    if (headerBars) headerBars.classList.toggle("playing", anyPlaying);

    // Update playlist items playing state
    el.querySelectorAll(".mp-playlist-item").forEach(item => {
      const playlistId = item.dataset.playlistId;
      item.classList.toggle("playing", this._isPlaylistPlaying(playlistId));
    });

    this.slots.forEach((soundData, i) => {
      const slotEl = el.querySelector(`.mp-slot[data-slot="${i}"]`);
      if (!slotEl || slotEl.classList.contains("mp-slot-add")) return;

      const player = this.players[i];
      slotEl.classList.toggle("playing", player?.isPlaying || false);
      slotEl.classList.toggle("has-sound", !!soundData);
      slotEl.classList.toggle("active", this.activeSlot === i);
      
      const nameEl = slotEl.querySelector(".mp-slot-name");
      if (nameEl) nameEl.textContent = soundData?.name || i18n.t("empty");
      
      const iconEl = slotEl.querySelector(".mp-slot-icon");
      const imgEl = slotEl.querySelector(".mp-slot-image");
      const image = this.slotImages[i];
      
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

    const soundData = this._getActiveSound();
    const player = this._getActivePlayer();
    const btnPlay = el.querySelector(".mp-btn-play");
    const btnLoop = el.querySelector(".mp-btn-loop");
    
    if (btnPlay) {
      const isPlaying = player?.isPlaying || false;
      btnPlay.classList.toggle("playing", isPlaying);
      const icon = btnPlay.querySelector("i");
      if (icon) icon.className = isPlaying ? "fas fa-pause" : "fas fa-play";
    }
    
    if (btnLoop) btnLoop.classList.toggle("active", player?.loop || false);

    const current = player?.currentTime || 0;
    const duration = player?.duration || 0;
    const percent = duration > 0 ? (current / duration) * 100 : 0;

    const progress = el.querySelector(".mp-timeline-progress");
    if (progress) progress.style.width = percent + "%";

    const timeCurrent = el.querySelector(".mp-time-current");
    if (timeCurrent) timeCurrent.textContent = this._formatTime(current);

    const timeTotal = el.querySelector(".mp-time-total");
    if (timeTotal) timeTotal.textContent = this._formatTime(duration);

    const volumeSlider = el.querySelector(".mp-volume-slider");
    if (volumeSlider && document.activeElement !== volumeSlider && player) {
      volumeSlider.value = player.volume;
    }

    const title = el.querySelector(".mp-player-title");
    if (title) {
      if (soundData) {
        title.textContent = soundData.name;
        title.title = `${soundData.playlistName} / ${soundData.name}`;
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
    // Don't stop players on close - they keep playing
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
