// 播放器逻辑（jQuery 版）
console.log("Player script loaded");

// 全局状态
let allSongs = [];
let allPlaylists = [];
let currentPlaylist = null;
let currentSongList = [];
let currentSongIndex = -1;
let audio = null;
let isPlaying = false;

// DOM 元素 (Update modal selector)
const playlistList = document.getElementById("playlist-list");
const songList = document.getElementById("song-list");
const audioPlayerBar = document.getElementById("audio-player-bar");
// Player Bar specific elements (will be updated in renderAudioPlayer)
// const audioPlayerControls = document.getElementById("audio-player-controls");
// const audioPlayerInfo = document.getElementById("audio-player-info");
audio = document.getElementById("audio-element");
const playlistModal = document.getElementById("playlist-modal"); // Use the dialog element

// 初始化
$(function () {
  audio = $("#audio-element")[0];
  fetchAllData();
});

// 获取所有歌单和歌曲
function fetchAllData() {
  chrome.runtime.sendMessage({ action: "get_all_playlists" }, (res) => {
    if (res && res.success) {
      allPlaylists = res.playlists || [];
      renderPlaylists();
    }
  });
  chrome.runtime.sendMessage({ action: "get_all_songs" }, (res) => {
    if (res && res.success) {
      allSongs = res.songs || [];
      currentPlaylist = null;
      currentSongList = allSongs;
      renderSongs();
      renderAudioPlayer();
    }
  });
}

// 渲染歌单列表 (Apply tab-like styling)
function renderPlaylists() {
  let html = "";
  // Update "All Songs" active state
  $("#playlist-all").toggleClass("active", currentPlaylist === null);

  if (!allPlaylists.length) {
    // 添加空歌单占位符
    html = '<li class="playlist-empty">暂无歌单，点击上方"+"按钮创建</li>';
  } else {
    allPlaylists.forEach((pl) => {
      // 使用正确的Font Awesome图标
      html += `<li><a class="playlist-item ${
        currentPlaylist && currentPlaylist.id === pl.id ? "active" : ""
      }" data-id="${pl.id}">
        <i class="fas fa-music"></i>${escapeHtml(pl.name)}
      </a></li>`;
    });
  }

  $("#playlist-list").html(html);
  // 事件绑定 (Target <a> inside <li>)
  $("#playlist-list li a.playlist-item")
    .off("click")
    .on("click", function () {
      const id = $(this).data("id");
      const pl = allPlaylists.find((p) => String(p.id) === String(id));
      if (pl) {
        currentPlaylist = pl;
        currentSongList = (pl.songs || [])
          .map((sid) => allSongs.find((s) => String(s.id) === String(sid)))
          .filter(Boolean);
        renderPlaylists(); // Re-render to update active state
        renderSongs();
      }
    });
}

// 渲染歌曲列表 (Improved styling)
function renderSongs() {
  renderPlaylistDetailInfo(); // Render playlist info first
  let html = "";
  if (!currentSongList.length) {
    html += '<li class="p-4 text-center text-base-content/50">暂无歌曲</li>';
  } else {
    currentSongList.forEach((song, idx) => {
      const isActive = currentSongIndex === idx;
      html += `<li class="song-item flex items-center p-3 rounded-lg cursor-pointer transition-all duration-150 select-none hover:bg-base-100 ${
        isActive ? "bg-base-300 shadow-sm" : ""
      }" data-idx="${idx}" data-song-id="${song.id}">
        <div class="avatar mr-4">
          <div class="w-12 rounded">
            <img class="song-cover" src="${escapeHtml(
              song.cover || "assets/默认歌单封面.png" // Provide a default
            )}" alt="cover" onerror="this.src='assets/默认歌单封面.png'" />
          </div>
        </div>
        <div class="song-info flex-1 flex flex-col min-w-0 mr-4">
          <div class="flex items-baseline gap-2">
            <div class="song-title text-base font-semibold truncate ${
              isActive ? "text-primary" : "text-base-content"
            }">${escapeHtml(song.title)}</div>
            <span class="text-xs text-base-content/50 tabular-nums">${formatTime(
              song.duration
            )}</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <div class="avatar">
              <div class="w-5 rounded-full">
                 <img src="${escapeHtml(
                   song.author?.avatar || "assets/默认作者头像.png" // Provide a default
                 )}" alt="author" onerror="this.src='assets/默认作者头像.png'" />
              </div>
            </div>
            <span class="song-author text-sm text-base-content/70 truncate">${escapeHtml(
              song.author?.name || "未知艺术家"
            )}</span>
          </div>
        </div>
        <div class="song-actions flex flex-col sm:flex-row gap-2 ml-auto">
          ${
            currentPlaylist == null
              ? `<button class="btn btn-xs btn-outline btn-info add-to-playlist-btn" data-song-id="${song.id}">添加到歌单</button>
                 <button class="btn btn-xs btn-outline btn-error delete-song-btn" data-song-id="${song.id}">删除</button>`
              : `<button class="btn btn-xs btn-outline btn-warning remove-from-playlist-btn" data-song-id="${song.id}">移出歌单</button>`
          }
        </div>
      </li>`;
    });
  }
  $("#song-list").html(html);
  // 事件绑定 (Ensure buttons are targeted correctly)
  $("#song-list .song-item")
    .off("click")
    .on("click", function (e) {
      // Check if the click target or its parent is a button within song-actions
      if ($(e.target).closest(".song-actions").length > 0) {
        return;
      }
      const idx = Number($(this).data("idx"));
      playSong(idx);
    });
  // 添加到歌单按钮
  $(".add-to-playlist-btn")
    .off("click")
    .on("click", function (e) {
      e.stopPropagation();
      const songId = $(this).data("song-id");
      showAddToPlaylistModal(songId);
    });
  // 删除歌曲按钮
  $(".delete-song-btn")
    .off("click")
    .on("click", function (e) {
      e.stopPropagation();
      const songId = $(this).data("song-id");
      // Use a confirmation modal later if desired
      if (confirm("确定要删除这首歌曲吗？（此操作不可恢复）")) {
        chrome.runtime.sendMessage({ action: "delete_song", songId }, (res) => {
          if (res && res.success) {
            // Optimistic UI update or refetch
            fetchAllData(); // Refetch for simplicity
          } else {
            alert("删除失败: " + (res?.error || "未知错误"));
          }
        });
      }
    });
  // 移出歌单按钮
  $(".remove-from-playlist-btn")
    .off("click")
    .on("click", function (e) {
      e.stopPropagation();
      const songId = $(this).data("song-id");
      if (!currentPlaylist) return;
      // Use a confirmation modal later if desired
      if (confirm("确定要将这首歌移出当前歌单吗？")) {
        chrome.runtime.sendMessage(
          {
            action: "remove_song_from_playlist",
            playlistId: currentPlaylist.id,
            songId,
          },
          (res) => {
            if (res && res.success) {
              // Optimistic UI update or refetch
              const songIndexInPlaylist = currentPlaylist.songs.findIndex(
                (id) => String(id) === String(songId)
              );
              if (songIndexInPlaylist > -1) {
                currentPlaylist.songs.splice(songIndexInPlaylist, 1);
              }
              // Find the index in the currently displayed list
              const songIndexInView = currentSongList.findIndex(
                (s) => String(s.id) === String(songId)
              );
              if (songIndexInView > -1) {
                currentSongList.splice(songIndexInView, 1);
                // Adjust currentSongIndex if needed
                if (currentSongIndex === songIndexInView) {
                  // If removing the currently playing song, stop or play next? Stop for now.
                  currentSongIndex = -1;
                  isPlaying = false;
                  audio.pause();
                  audio.src = ""; // Clear src
                  renderAudioPlayer(); // Update player UI
                } else if (currentSongIndex > songIndexInView) {
                  currentSongIndex--; // Adjust index if removing song before current one
                }
                renderSongs(); // Re-render song list
              } else {
                fetchAllData(); // Fallback to refetch if something is inconsistent
              }
            } else {
              alert("移除失败: " + (res?.error || "未知错误"));
            }
          }
        );
      }
    });
}

// 渲染底部播放器 (Update song details layout)
function renderAudioPlayer() {
  let song = currentSongList[currentSongIndex] || {};

  // --- Left Section ---
  const coverHtml = `
    <div class="avatar flex-shrink-0"> <!-- Ensure cover doesn't shrink -->
      <div class="w-14 rounded">
        <img src="${escapeHtml(
          song.cover || "assets/默认歌单封面.png"
        )}" alt="cover" onerror="this.src='assets/默认歌单封面.png'" />
      </div>
    </div>`;
  $("#player-cover-container").html(coverHtml);

  // Update song details for vertical layout
  const songDetailsHtml = song.title
    ? `<span class="font-semibold text-sm truncate text-base-content block" title="${escapeHtml(
        song.title
      )}">${escapeHtml(song.title)}</span>
       <span class="text-xs text-base-content/60 truncate block mt-1" title="${escapeHtml(
         song.author?.name || "未知艺术家"
       )}">${escapeHtml(song.author?.name || "未知艺术家")}</span>`
    : `<span class="font-semibold text-sm truncate text-base-content block">未选择歌曲</span>
       <span class="text-xs text-base-content/60 truncate block mt-1">未知艺术家</span>`;
  $("#player-song-details").html(songDetailsHtml);

  // --- Center Section ---
  // Controls (Update Bilibili icon, check if already done)
  const controlsHtml = `
    <button class="btn btn-ghost btn-sm btn-circle text-pink-500" title="跳转到原视频"><i class="fa-brands fa-bilibili fa-lg"></i></button>
    <button class="btn btn-ghost btn-circle audio-btn" id="prev-btn" title="上一首">
      <i class="fas fa-backward-step fa-lg"></i>
    </button>
    <button class="btn btn-primary btn-circle audio-btn w-12 h-12 shadow-md" id="play-btn" title="${
      isPlaying ? "暂停" : "播放"
    }">
      <i class="fas ${isPlaying ? "fa-pause" : "fa-play"} fa-xl"></i>
    </button>
    <button class="btn btn-ghost btn-circle audio-btn" id="next-btn" title="下一首">
      <i class="fas fa-forward-step fa-lg"></i>
    </button>
    <button class="btn btn-ghost btn-sm btn-circle" title="播放模式（暂不可用）"><i class="fas fa-random text-lg"></i></button>
  `;
  $("#audio-player-controls").html(controlsHtml);

  // --- Event Binding ---
  $("#prev-btn").off("click").on("click", playPrev);
  $("#play-btn").off("click").on("click", togglePlay);
  $("#next-btn").off("click").on("click", playNext);

  // --- Audio Element Logic ---
  const newSrc = song.audioUrl || "";
  if (audio.src !== newSrc) {
    const currentBaseSrc = audio.src
      ? new URL(audio.src, window.location.href).pathname
      : "";
    const newBaseSrc = newSrc
      ? new URL(newSrc, window.location.href).pathname
      : "";
    if (currentBaseSrc !== newBaseSrc) {
      audio.src = newSrc;
      if (isPlaying && newSrc) {
        audio.load();
        audio.play().catch((e) => console.error("Autoplay failed:", e));
      } else {
        audio.pause();
      }
    }
  } else {
    if (isPlaying && audio.paused && audio.readyState >= 2) {
      audio.play().catch((e) => console.error("Play failed:", e));
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }
  audio.onended = playNext;

  // --- UI Updates ---
  updateProgressUI(); // Initial update

  // 确保进度条更新
  $(audio)
    .off("loadedmetadata timeupdate")
    .on("loadedmetadata timeupdate", function () {
      // 强制更新进度条，解决可能的更新问题
      window.requestAnimationFrame(updateProgressUI);
    });

  // 增强进度条交互
  const $progressContainer = $(".player-progress-bar-container");

  // 直接点击进度条跳转
  $progressContainer.off("click").on("click", function (e) {
    if (!audio.duration || isNaN(audio.duration)) return;

    const rect = this.getBoundingClientRect();
    const clickPos = (e.clientX - rect.left) / rect.width;
    const seekTime = clickPos * audio.duration;

    audio.currentTime = seekTime;
    updateProgressUI();
  });

  // 拖动进度条
  $("#audio-progress-range")
    .off("input")
    .on("input", function () {
      if (!audio.duration || isNaN(audio.duration)) return;

      const percent = Number($(this).val());
      audio.currentTime = (percent / 100) * audio.duration;

      // 立即更新进度条视觉效果
      $("#audio-progress-visual").val(percent);
    })
    .off("mousedown touchstart")
    .on("mousedown touchstart", function () {
      $progressContainer.addClass("dragging");
    });

  // 鼠标/触摸抬起时移除拖动状态
  $(document)
    .off("mouseup touchend.progress")
    .on("mouseup touchend.progress", function () {
      $progressContainer.removeClass("dragging");
    });

  // 显示时间提示
  $progressContainer.off("mousemove").on("mousemove", function (e) {
    if (!audio.duration || isNaN(audio.duration)) return;

    const rect = this.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * audio.duration;

    // 更新时间提示
    $(this).attr("title", formatTime(time));
  });
}

// Update progress UI for both range and progress elements
function updateProgressUI() {
  const current = audio.currentTime || 0;
  const duration = audio.duration || 0;
  const displayDuration = isNaN(duration) ? 0 : duration;
  const displayCurrent = isNaN(current) ? 0 : current;

  // 确保进度百分比计算正确
  const percent = displayDuration
    ? (displayCurrent / displayDuration) * 100
    : 0;
  const progressValue = Math.min(100, Math.max(0, percent)); // Clamp value

  // 更新时间显示
  $("#audio-current-time").text(formatTime(displayCurrent));
  $("#audio-duration").text(formatTime(displayDuration));

  // 更新进度条（确保两个元素都被更新）
  $("#audio-progress-range").val(progressValue);
  $("#audio-progress-visual").val(progressValue);

  // 根据播放状态更新视觉效果
  if (isPlaying) {
    $("#audio-progress-visual").addClass("progress-playing");
  } else {
    $("#audio-progress-visual").removeClass("progress-playing");
  }
}

function formatTime(sec) {
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// 播放指定歌曲
function playSong(idx) {
  if (idx < 0 || idx >= currentSongList.length) {
    console.warn("Invalid song index:", idx);
    // Optionally stop playback or handle error
    // isPlaying = false;
    // audio.pause();
    // renderAudioPlayer();
    return;
  }
  // Check if the song actually changed
  if (currentSongIndex !== idx) {
    currentSongIndex = idx;
    isPlaying = true; // Assume we want to play when selecting a new song
    renderSongs(); // Update song list UI (highlight)
    renderAudioPlayer(); // Update player UI and load/play the new song
  } else {
    // If clicking the same song, toggle play/pause
    togglePlay();
  }
}

// 播放/暂停 (Update button icon and title for the new button)
function togglePlay() {
  if (!audio || !currentSongList[currentSongIndex]) return;

  const playBtn = $("#play-btn"); // Target the specific play button

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    playBtn.attr("title", "播放").html('<i class="fas fa-play fa-xl"></i>');
  } else {
    if (audio.src && audio.readyState >= 1) {
      audio
        .play()
        .then(() => {
          isPlaying = true;
          playBtn
            .attr("title", "暂停")
            .html('<i class="fas fa-pause fa-xl"></i>');
        })
        .catch((e) => {
          console.error("Playback failed:", e);
          isPlaying = false;
          playBtn
            .attr("title", "播放")
            .html('<i class="fas fa-play fa-xl"></i>');
        });
    } else if (!audio.src && currentSongIndex !== -1) {
      console.warn("No audio source, attempting to load current song.");
      renderAudioPlayer(); // Try to set src and play
    } else {
      console.warn("Audio not ready or no source. State:", audio.readyState);
    }
  }
}

// 上一首
function playPrev() {
  if (currentSongList.length === 0) return;
  let idx =
    currentSongIndex > 0 ? currentSongIndex - 1 : currentSongList.length - 1;
  playSong(idx);
}

// 下一首
function playNext() {
  if (currentSongList.length === 0) return;
  let idx = (currentSongIndex + 1) % currentSongList.length;
  playSong(idx);
}

// HTML 转义
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c];
  });
}

// 全局键盘快捷键：空格键控制播放/暂停
$(window).on("keydown", function (e) {
  // 避免在输入框等控件中误触
  if ($(e.target).is("input, textarea, [contenteditable]")) return;
  if (e.code === "Space" || e.key === " " || e.keyCode === 32) {
    e.preventDefault();
    togglePlay();
  }
});

// 绑定"全部歌曲"点击事件 (Target the new <a> tag)
$("#playlist-section").on("click", "#playlist-all", function (e) {
  e.preventDefault(); // Prevent default anchor behavior
  if (currentPlaylist !== null) {
    // Only update if not already on "All Songs"
    currentPlaylist = null;
    currentSongList = allSongs;
    renderPlaylists(); // Update active state
    renderSongs();
  }
});

// 创建歌单按钮弹出模态框 (Use dialog.showModal())
$("#playlist-section").on("click", "#create-playlist-btn", function () {
  // Reset form content (already handled in HTML script, but good to ensure)
  $("#playlist-form")[0].reset();
  $("#playlist-cover-preview").attr("src", "assets/默认歌单封面.png");
  $("#playlist-cover-filename").text("未选择文件");
  playlistModal.showModal(); // Show the dialog modal
  // $("#audio-player-bar").addClass("hidden"); // Optional: Hide player
});

// 封面上传预览 (Logic remains the same, ensure selectors are correct)
$("#playlist-modal").on("change", "#playlist-cover", function (e) {
  // Listen on the dialog
  const file = e.target.files[0];
  if (file) {
    // Add size validation
    if (file.size > 1 * 1024 * 1024) {
      // 1MB limit
      alert("图片文件过大，请选择小于 1MB 的图片。");
      // Reset file input and preview
      $(this).val(""); // Clear the file input
      $("#playlist-cover-preview").attr("src", "assets/默认歌单封面.png");
      $("#playlist-cover-filename").text("未选择文件");
      return;
    }
    const reader = new FileReader();
    reader.onload = function (evt) {
      $("#playlist-cover-preview").attr("src", evt.target.result);
    };
    reader.readAsDataURL(file);
    $("#playlist-cover-filename").text(file.name);
  } else {
    $("#playlist-cover-preview").attr("src", "assets/默认歌单封面.png");
    $("#playlist-cover-filename").text("未选择文件");
  }
});

// 创建歌单表单提交 (Listen on the dialog, close modal on success)
$("#playlist-modal").on("submit", "#playlist-form", function (e) {
  // Listen on the dialog
  e.preventDefault();
  const name = $("#playlist-name").val().trim();
  const description = $("#playlist-desc").val().trim();
  // Get base64 data only if a file was selected and preview updated
  let coverBase64 = null;
  const fileSelected = $("#playlist-cover")[0].files.length > 0;
  const previewSrc = $("#playlist-cover-preview").attr("src");
  if (fileSelected && previewSrc && previewSrc !== "assets/默认歌单封面.png") {
    coverBase64 = previewSrc; // Already base64 from FileReader
  }

  const playlist = {
    name,
    description,
    cover: coverBase64, // Send base64 data or null
    songs: [],
  };
  chrome.runtime.sendMessage({ action: "add_playlist", playlist }, (res) => {
    if (res && res.success) {
      playlistModal.close(); // Close the dialog modal
      // $("#audio-player-bar").removeClass("hidden"); // Optional: Show player
      fetchAllData(); // Refresh lists
    } else {
      alert("创建歌单失败: " + (res?.error || "未知错误"));
    }
  });
});

function renderPlaylistDetailInfo() {
  const container = $("#playlist-detail-info");
  if (!currentPlaylist) {
    container.html(""); // Clear if no playlist selected
    return;
  }
  const cover = escapeHtml(currentPlaylist.cover || "assets/默认歌单封面.png");
  const name = escapeHtml(currentPlaylist.name || "未命名歌单");
  const desc = escapeHtml(currentPlaylist.description || "暂无描述");
  const count = (currentPlaylist.songs || []).length;

  container.html(`
    <div class="card card-side bg-base-100 shadow-md mb-6 flex-col sm:flex-row">
      <figure class="p-4 sm:p-0 sm:pl-5 flex-shrink-0">
        <img src="${cover}" class="w-32 h-32 object-cover rounded-lg shadow-sm" alt="歌单封面" onerror="this.src='assets/默认歌单封面.png'" />
      </figure>
      <div class="card-body flex-1 min-w-0">
        <h2 class="card-title text-2xl font-bold mb-1">${name}</h2>
        <p class="text-sm text-base-content/70 mb-3">${desc}</p>
        <div class="card-actions items-center justify-start gap-4 mt-auto">
          <button id="playlist-playall" class="btn btn-primary gap-1" ${
            count === 0 ? "disabled" : ""
          }>
             <i class="fas fa-play mr-1"></i> 播放全部
          </button>
          <button id="delete-playlist-btn" class="btn btn-error btn-outline gap-1">
             <i class="fas fa-trash mr-1"></i> 删除歌单
          </button>
          <span class="text-xs text-base-content/50 ml-auto hidden sm:inline">共 ${count} 首歌</span>
        </div>
         <span class="text-xs text-base-content/50 mt-2 sm:hidden">共 ${count} 首歌</span>
      </div>
    </div>
  `);

  // 删除歌单按钮事件
  $("#delete-playlist-btn")
    .off("click")
    .on("click", function () {
      if (confirm(`确定要删除歌单 "${name}" 吗？此操作不可恢复！`)) {
        chrome.runtime.sendMessage(
          { action: "delete_playlist", playlistId: currentPlaylist.id },
          (res) => {
            if (res && res.success) {
              currentPlaylist = null; // Clear current selection
              currentSongList = allSongs; // Go back to all songs view
              fetchAllData(); // Refresh data and UI
            } else {
              alert("删除歌单失败: " + (res?.error || "未知错误"));
            }
          }
        );
      }
    });

  // 播放全部按钮事件
  $("#playlist-playall")
    .off("click")
    .on("click", function () {
      if (currentSongList.length > 0) {
        playSong(0); // Play the first song in the current list
      }
    });
}

// 添加到歌单模态框 (Using <dialog> and daisyUI components)
function showAddToPlaylistModal(songId) {
  // Remove existing modal first to avoid duplicates
  $("#add-to-playlist-modal").remove();

  // Create modal HTML using <dialog>
  const modalHtml = `
      <dialog id="add-to-playlist-modal" class="modal">
        <div class="modal-box w-11/12 max-w-xs">
           <form method="dialog">
             <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
           </form>
           <h3 class="font-bold text-lg mb-4">添加到歌单</h3>
           <div id="add-to-playlist-list" class="mb-4">
             <!-- Select dropdown will be rendered here -->
           </div>
           <div class="modal-action mt-2">
             <form method="dialog" class="w-full flex justify-end gap-2">
               <button type="button" class="btn btn-ghost" id="add-to-playlist-cancel">取消</button>
               <button type="button" class="btn btn-primary" id="add-to-playlist-confirm">确定</button>
             </form>
           </div>
        </div>
        <form method="dialog" class="modal-backdrop">
           <button>close</button>
        </form>
      </dialog>
    `;
  $("body").append(modalHtml);

  const modalElement = document.getElementById("add-to-playlist-modal");

  // Render playlist select dropdown
  let selectHtml = "";
  if (!allPlaylists.length) {
    selectHtml =
      '<p class="text-base-content/50 text-sm">暂无歌单，请先创建。</p>';
    // Disable confirm button if no playlists
    $("#add-to-playlist-confirm").prop("disabled", true);
  } else {
    selectHtml =
      '<select id="playlist-select" class="select select-bordered w-full">';
    allPlaylists.forEach((pl) => {
      // Check if the song is already in this playlist
      const alreadyInPlaylist = (pl.songs || []).some(
        (id) => String(id) === String(songId)
      );
      selectHtml += `<option value="${pl.id}" ${
        alreadyInPlaylist ? "disabled" : ""
      }>
                       ${escapeHtml(pl.name)} ${
        alreadyInPlaylist ? "(已在歌单中)" : ""
      }
                     </option>`;
    });
    selectHtml += "</select>";
    // Ensure confirm button is enabled if there are valid options
    const hasValidOptions = allPlaylists.some(
      (pl) => !(pl.songs || []).some((id) => String(id) === String(songId))
    );
    $("#add-to-playlist-confirm").prop("disabled", !hasValidOptions);
    if (!hasValidOptions) {
      selectHtml +=
        '<p class="text-xs text-warning mt-1">所有歌单均已包含此歌曲。</p>';
    }
  }
  $("#add-to-playlist-list").html(selectHtml);

  // Show the modal
  modalElement.showModal();

  // Event listeners (scoped to the new modal)
  $("#add-to-playlist-cancel")
    .off("click")
    .on("click", function () {
      modalElement.close();
    });

  $("#add-to-playlist-confirm")
    .off("click")
    .on("click", function () {
      const playlistId = $("#playlist-select").val();
      if (!playlistId) {
        // This case might not happen if button is disabled correctly
        alert("请选择一个歌单");
        return;
      }
      chrome.runtime.sendMessage(
        { action: "add_song_to_playlist", playlistId, songId },
        (res) => {
          if (res && res.success) {
            // alert("添加成功"); // Maybe use a less intrusive notification later
            modalElement.close();
            // Optionally update the specific playlist data locally for faster UI update
            const playlist = allPlaylists.find(
              (p) => String(p.id) === String(playlistId)
            );
            if (playlist && !playlist.songs.includes(songId)) {
              playlist.songs.push(songId);
              // If currently viewing that playlist, refresh song list
              if (
                currentPlaylist &&
                String(currentPlaylist.id) === String(playlistId)
              ) {
                currentSongList = playlist.songs
                  .map((sid) =>
                    allSongs.find((s) => String(s.id) === String(sid))
                  )
                  .filter(Boolean);
                renderSongs();
              }
            } else {
              fetchAllData(); // Fallback to full refresh if needed
            }
          } else {
            alert(
              "添加失败: " + (res?.error || "歌曲已在歌单中或发生未知错误")
            );
          }
        }
      );
    });

  // Remove the modal from DOM when closed to prevent ID conflicts
  modalElement.addEventListener("close", () => {
    $(modalElement).remove();
  });
}
