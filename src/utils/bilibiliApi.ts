export const getPlayUrl = async (bvid: string, cid: string) => {
  const url = new URL("https://api.bilibili.com/x/player/playurl");
  url.searchParams.set("bvid", bvid);
  url.searchParams.set("cid", cid);
  url.searchParams.set("qn", "64");
  url.searchParams.set("fnval", "16");
  const data = (await (await fetch(url.toString(), { method: "GET" })).json()).data as {
    dash: { audio: { baseUrl: string }[], video: { baseUrl: string }[] };
  };
  const audioUrl = data.dash.audio[0].baseUrl;
  const videoUrl = data.dash.video[0].baseUrl;
  return { audioUrl, videoUrl };
};

export const getVideoInfo = async (bvid: string, page: number) => {
  const response = await fetch(
    "https://api.bilibili.com/x/web-interface/view?bvid=" + bvid
  );
  const data: {
    title: string;
    cid: number;
    aid: number;
    desc: string;
    owner: {
      name: string;
      mid: number;
      face: string;
    };
    pic: string;
    pages: Array<{
      cid: number;
      page: number;
      part: string;
      duration: number; // 秒
      ctime: number;
    }>,
  } = (await response.json()).data;
  
  let cid = data.cid;
  const aid = data.aid;
  const description = data.desc;
  const author = {
    name: data.owner.name,
    mid: data.owner.mid,
    avatar: data.owner.face,
  };
  const cover = data.pic;
  const pageData = data.pages.find((pageData) => pageData.page === page) || data.pages[0];
  const title = data.pages.length > 1 ? pageData.part : data.title;
  const duration = pageData.duration; // 秒
  cid = pageData.cid; // 使用当前页面的cid
  const ctime = pageData.ctime;

  return {
    bvid,
    cid,
    aid,
    title,
    description,
    author,
    cover,
    duration,
    ctime,
  };
}
