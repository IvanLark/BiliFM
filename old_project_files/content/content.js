// 内容脚本
console.log("内容脚本加载成功");

// 检测是否为B站视频页面
const isBilibiliVideoPage = () => {
  return /^https?:\/\/(www\.|m\.)?bilibili\.com\/video\/BV/.test(
    window.location.href
  );
};

// 创建样式标签
const style = document.createElement("style");
style.textContent = `
  .collect-card {
    z-index: 9999;
    pointer-events: auto;
    position: relative;
    margin: 10px 0;
    margin-top: 0;
    padding: 20px;
    background-color: #f7f8fa;
    box-shadow: none;
    border-radius: 0;
    width: 320px;
    font-family: 'Segoe UI', Arial, sans-serif;
    border: 1px solid #e4e6eb;
    transition: background 0.2s;
    background: #fff;
  }

  .collect-card:hover {
    background: #f0f2f5;
    box-shadow: none;
    transform: none;
  }

  .collect-card h3 {
    margin: 0 0 15px;
    font-size: 18px;
    color: #1c1e21;
    text-align: center;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .playlist-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    margin: 10px 0;
  }

  .collect-song-button {
    width: 100%;
    display: block;
    box-sizing: border-box;
    margin-bottom: 18px;
    padding: 12px 0;
    background-color: #1877f2;
    color: #fff;
    border: 1px solid #1877f2;
    border-radius: 0;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: background 0.2s, color 0.2s, border 0.2s;
    box-shadow: none;
  }

  .collect-song-button:hover {
    background-color: #145db2;
    border-color: #145db2;
    color: #fff;
    transform: none;
  }

  .collect-song-button:disabled {
    background-color: #e4e6eb;
    color: #b0b3b8;
    border-color: #e4e6eb;
    cursor: not-allowed;
    opacity: 1;
    transform: none;
  }

  .add-to-playlist-button {
    padding: 10px 18px;
    background-color: #f0f2f5;
    color: #1877f2;
    border: 1px solid #1877f2;
    border-radius: 0;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    transition: background 0.2s, color 0.2s, border 0.2s;
    box-shadow: none;
  }

  .add-to-playlist-button:hover {
    background-color: #e4e6eb;
    color: #145db2;
    border-color: #145db2;
    transform: none;
  }

  .collect-card select {
    padding: 10px;
    border: 1px solid #e4e6eb;
    border-radius: 0;
    font-size: 15px;
    flex: 1;
    background-color: #f7f8fa;
    color: #1c1e21;
    box-shadow: none;
    outline: none;
    transition: border 0.2s;
  }
  .collect-card select:focus {
    border-color: #1877f2;
  }
  .playlist-container label {
    color: #606770;
    font-size: 15px;
    font-weight: 500;
  }

  .playlist-row {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: 100%;
    margin: 0;
  }
  .playlist-row label {
    display: flex;
    align-items: center;
    background: #f7f8fa;
    color: #606770;
    font-size: 15px;
    font-weight: 500;
    padding: 0 10px;
    border: 1px solid #e4e6eb;
    border-radius: 0;
    height: 44px;
    margin: 0;
    box-sizing: border-box;
    position: relative;
    z-index: 3;
  }
  .playlist-row select {
    padding: 0 14px;
    border: 1px solid #e4e6eb;
    border-radius: 0;
    font-size: 15px;
    background-color: #fff;
    color: #1c1e21;
    box-shadow: none;
    outline: none;
    transition: border 0.2s;
    height: 44px;
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    margin-left: -1px;
    margin-right: -1px;
    position: relative;
    z-index: 2;
  }
  .playlist-row select:focus {
    border: 1px solid #1877f2;
    z-index: 4;
  }
  .playlist-row .add-to-playlist-button {
    padding: 0 18px;
    background-color: #f0f2f5;
    color: #1877f2;
    border: 1px solid #1877f2;
    border-radius: 0;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    transition: background 0.2s, color 0.2s, border 0.2s;
    box-shadow: none;
    height: 44px;
    display: flex;
    align-items: center;
    white-space: nowrap;
    margin-left: 1px;
    position: relative;
    z-index: 1;
  }
  .playlist-row .add-to-playlist-button:hover {
    background-color: #e4e6eb;
    color: #145db2;
    border-color: #145db2;
  }
`;
document.head.appendChild(style);

// 创建收藏卡片
const createCollectCard = () => {
  const collectCard = document.createElement("div");
  collectCard.className = "collect-card";

  // 卡片标题
  const title = document.createElement("h3");
  title.innerText = "收藏音频";
  collectCard.appendChild(title);

  // 收藏歌曲按钮
  const collectSongButton = document.createElement("button");
  collectSongButton.className = "collect-song-button";
  if (tabData.song.isExist) {
    collectSongButton.disabled = true;
    collectSongButton.innerText = "已收藏";
  } else {
    collectSongButton.innerText = "收藏歌曲";
    collectSongButton.addEventListener("click", () => {
      // 收藏逻辑
      chrome.runtime.sendMessage(
        { action: "collect_song", data: tabData.song },
        (response) => {
          if (response.success) {
            tabData.song.id = response.id;
            tabData.song.isExist = true;
            collectSongButton.disabled = true;
            collectSongButton.innerText = "已收藏";
            alert("歌曲已收藏！");
          } else {
            alert("收藏失败！");
          }
        }
      );
    });
  }
  collectCard.appendChild(collectSongButton);

  // 歌单选择和按钮容器
  const playlistRow = document.createElement("div");
  playlistRow.className = "playlist-row";

  const playlistLabel = document.createElement("label");
  playlistLabel.innerText = "歌单";
  playlistLabel.htmlFor = "playlist-select";
  playlistRow.appendChild(playlistLabel);

  const playlistSelect = document.createElement("select");
  playlistSelect.id = "playlist-select";
  if (tabData.playlists && tabData.playlists.length > 0) {
    tabData.playlists.forEach((playlist) => {
      const option = document.createElement("option");
      option.value = playlist.id;
      option.innerText = playlist.name;
      playlistSelect.appendChild(option);
    });
  } else {
    const option = document.createElement("option");
    option.value = null;
    option.innerText = "暂无歌单";
    option.disabled = true;
    option.selected = true;
    playlistSelect.appendChild(option);
  }
  playlistRow.appendChild(playlistSelect);

  const addToPlaylistButton = document.createElement("button");
  addToPlaylistButton.className = "add-to-playlist-button";
  addToPlaylistButton.innerText = "收集进指定歌单";
  addToPlaylistButton.addEventListener("click", () => {
    const selectedPlaylistId = playlistSelect.value;
    if (!tabData.song.id) {
      alert("请先收藏歌曲");
      return;
    }
    if (!selectedPlaylistId) {
      alert("请选择一个歌单");
      return;
    }
    chrome.runtime.sendMessage(
      {
        action: "add_song_to_playlist",
        songId: tabData.song.id,
        playlistId: selectedPlaylistId,
      },
      (response) => {
        if (response.success) {
          alert(
            `歌曲已添加到 ${
              tabData.playlists.find((p) => p.id == selectedPlaylistId).name
            }！`
          );
        } else {
          alert("操作失败，请重试！");
        }
      }
    );
  });
  playlistRow.appendChild(addToPlaylistButton);

  collectCard.appendChild(playlistRow);
  return collectCard;
};

// 插入收藏卡片
const insertCollectCard = () => {
  const parentElement = document.querySelector("div.up-panel-container");
  if (parentElement) {
    console.log("目标父元素定位成功");
    const collectCard = createCollectCard();
    parentElement.appendChild(collectCard);
  } else {
    console.error("目标父元素未找到，无法插入收藏卡片");
  }
};

let tabData = null;

const getPlayInfo = () => {
  const scripts = document.querySelectorAll("script");
  for (const script of scripts) {
    if (script.innerText.includes("window.__playinfo__")) {
      return JSON.parse(script.innerText.replace("window.__playinfo__=", ""));
    }
  }
  return null;
};

// 获取当前b站视频信息
const getSong = async () => {
  let playinfo = null;
  let tryCount = 0;
  const maxTries = 20;
  while (!playinfo) {
    playinfo = getPlayInfo();
    if (!playinfo) {
      tryCount++;
      if (tryCount >= maxTries) {
        console.error("获取播放信息失败，已超过最大尝试次数");
        throw new Error("获取播放信息失败，已超过最大尝试次数");
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  // 音频和视频的URL
  const audioUrl = playinfo.data.dash.audio[0].baseUrl;
  // 音频时长
  //const duration = playinfo.data.timelength; // 单位：毫秒
  // 视频分p
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get("p") || 1;
  // BV号
  const bvidRegex = /bilibili\.com\/video\/(BV[0-9a-zA-Z]{10})/;
  const bvidMatch = window.location.href.match(bvidRegex);
  const bvid = bvidMatch ? bvidMatch[1] : null;

  const response = await fetch(
    "https://api.bilibili.com/x/web-interface/view?bvid=" + bvid
  );
  const data = (await response.json()).data;
  console.log(data);
  const cid = data.cid;
  const aid = data.aid;
  const description = data.desc;
  //const title = data.title;
  const author = {
    name: data.owner.name,
    mid: data.owner.mid,
    avatar: data.owner.face,
  };
  const cover = data.pic;
  const pageData = data.pages.find((pageData) => pageData.page === page);
  const title = pageData.part;
  const duration = pageData.duration; // 秒

  tabData = {
    song: {
      bvid,
      cid,
      aid,
      page,
      audioUrl,
      title,
      description,
      author,
      cover,
      duration,
    },
  };
};

const tabInit = (callback) => {
  chrome.runtime.sendMessage(
    {
      action: "tab_init",
      data: tabData.song,
    },
    (response) => {
      tabData.song.isExist = response.isExist;
      tabData.playlists = response.playlists;
      if (response.isExist) {
        tabData.song.id = response.id;
      }
      callback();
    }
  );
};

// 封装执行主逻辑的函数
const runCollectCardFlow = async () => {
  if (isBilibiliVideoPage()) {
    console.log("当前页面为B站视频页面，准备插入收藏卡片");
    // 获取歌曲数据
    await getSong();
    // 初始化
    tabInit(async () => {
      console.log("初始化完成，准备插入收藏卡片");
      let checkCount = 0;
      const maxChecks = 30; // 最多检查30次
      while (checkCount < maxChecks) {
        let collectCard = document.querySelector("div.collect-card");
        if (!collectCard) {
          console.log("未找到收藏卡片，准备插入");
          insertCollectCard();
        }
        checkCount++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    });
  }
};

// 首次执行
setTimeout(runCollectCardFlow, 250);

// 监听页面跳转（包括 SPA 路由变化）
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // 页面发生跳转，重新执行主逻辑
    console.log("页面发生跳转，重新执行主逻辑");
    // 先删除之前创建的 div.collect-card
    const oldCollectCard = document.querySelector("div.collect-card");
    if (oldCollectCard) {
      oldCollectCard.remove();
    }
    tabData = null;
    // 重新执行主逻辑
    setTimeout(runCollectCardFlow, 250);
  }
}, 500);
