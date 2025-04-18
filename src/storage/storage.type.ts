export interface Author {
  name: string;
  mid: number;
  avatar: string;
}

export interface Song {
  id?: number; // 主键
  bvid: string; // BV号
  cid: number; // 视频ID
  aid: number; // 音频ID
  page: number; // 分页
  title: string; // 标题
  description: string; // 描述
  author: Author; // 作者
  cover: string; // 封面URL
  duration: number; // 时长（秒）
  ctime: number; // 创建时间戳
  isExist?: boolean; // 是否存在
}

export interface Playlist {
  id: number; // 主键
  name: string; // 名称
  description: string; // 描述
  cover: string | null; // 图片二进制数据，如果用户没上传则为 null
  ctime: number; // 创建时间戳
  songs: number[]; // 歌曲ID列表
}

