// Navigation configuration type

export type NavMenuItem = {
  id: string;
  name: string;
  url: string;
  icon?: string;
  pageKey?: string;
  external?: boolean;
  children?: NavMenuItem[];
  enabled?: boolean;
};

export type NavMenuConfig = {
  links: NavMenuItem[];
  searchMethod?: 0;
};

// Default menu items matching LinkPresets
export const defaultNavItems: NavMenuItem[] = [
  { id: "home", name: "主页", url: "/", icon: "material-symbols:home" },
  {
    id: "articles",
    name: "文章",
    url: "#",
    icon: "material-symbols:article",
    children: [
      { id: "archive", name: "归档", url: "/archive/", icon: "material-symbols:archive" },
      { id: "categories", name: "分类", url: "/categories/", icon: "material-symbols:folder-open-rounded" },
      { id: "tags", name: "标签", url: "/tags/", icon: "material-symbols:tag-rounded" },
    ],
  },
  { id: "changelog", name: "更新日志", url: "/changelog/", icon: "material-symbols:history-edu-rounded" },
  { id: "friends", name: "友链", url: "/friends/", icon: "material-symbols:group", pageKey: "friends" },
  { id: "moments", name: "朋友圈", url: "/moments/", icon: "material-symbols:rss-feed-rounded" },
  { id: "guestbook", name: "留言", url: "/guestbook/", icon: "material-symbols:chat", pageKey: "guestbook" },
  {
    id: "mine",
    name: "我的",
    url: "#",
    icon: "material-symbols:person",
    children: [
      { id: "gallery", name: "相册", url: "/gallery/", icon: "material-symbols:photo-library", pageKey: "gallery" },
      { id: "anime", name: "追番", url: "/anime/", icon: "material-symbols:live-tv", pageKey: "anime" },
      { id: "bangumi", name: "番组计划", url: "/bangumi/", icon: "material-symbols:movie", pageKey: "bangumi" },
      { id: "tools", name: "工具", url: "/tools/", icon: "material-symbols:construction-rounded" },
    ],
  },
  {
    id: "about",
    name: "关于",
    url: "#",
    icon: "material-symbols:info",
    children: [
      { id: "sponsor", name: "打赏", url: "/sponsor/", icon: "material-symbols:favorite", pageKey: "sponsor" },
      { id: "about-page", name: "关于我", url: "/about/", icon: "material-symbols:person" },
    ],
  },
];
