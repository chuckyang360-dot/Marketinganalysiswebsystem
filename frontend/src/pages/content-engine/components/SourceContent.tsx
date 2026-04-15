import { useState } from "react";
import type { ContentType } from "../../../mocks/contentEngine";

interface SourceContentData {
  platform: string;
  author: string;
  fans: string;
  likes: string;
  comments: string;
  shares: string;
  publishTime: string;
  duration: string;
  title: string;
  thumbnail: string;
  thumbnailGallery: string[];
  imageCaption?: string;
  articleBody?: string;
  articleImages?: string[];
}

interface SourceContentProps {
  data: SourceContentData;
  contentType?: ContentType;
}

const PLATFORM_CFG: Record<string, { icon: string; label: string; color: string }> = {
  tiktok: { icon: "ri-tiktok-line", label: "TikTok", color: "#010101" },
  xiaohongshu: { icon: "ri-heart-line", label: "小红书", color: "#FF2442" },
  youtube: { icon: "ri-youtube-line", label: "YouTube", color: "#FF0000" },
  x: { icon: "ri-twitter-x-line", label: "X", color: "#111111" },
  zhihu: { icon: "ri-question-answer-line", label: "知乎", color: "#0084FF" },
  wechat: { icon: "ri-wechat-line", label: "公众号", color: "#07C160" },
  weibo: { icon: "ri-weibo-line", label: "微博", color: "#E6162D" },
};

export default function SourceContent({ data, contentType = "video" }: SourceContentProps) {
  const platform = PLATFORM_CFG[data.platform] ?? { icon: "ri-article-line", label: "文章", color: "#7B61FF" };

  return (
    <section className="w-full px-6 lg:px-10 py-10">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Section title */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="w-1 h-5 rounded-full"
            style={{ background: "linear-gradient(180deg, #7B61FF, #5B8CFF)" }}
          />
          <h3 className="text-[16px] font-bold" style={{ color: "#111111" }}>原内容预览</h3>
          <span
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ml-1"
            style={{ background: `${platform.color}12`, color: platform.color, border: `1px solid ${platform.color}22` }}
          >
            <i className={`${platform.icon} text-[10px]`} />
            {platform.label}
          </span>
          {contentType === "image" && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ml-1"
              style={{ background: "rgba(255,36,66,0.08)", color: "#FF2442", border: "1px solid rgba(255,36,66,0.15)" }}>
              <i className="ri-image-2-line text-[10px]" />
              {data.thumbnailGallery.length} 张图
            </span>
          )}
          {contentType === "article" && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ml-1"
              style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.15)" }}>
              <i className="ri-file-text-line text-[10px]" />
              长文
            </span>
          )}
        </div>

        {contentType === "article" ? (
          <ArticleSourceLayout data={data} platform={platform} />
        ) : contentType === "image" ? (
          <ImageSourceLayout data={data} platform={platform} />
        ) : (
          <VideoSourceLayout data={data} platform={platform} />
        )}
      </div>
    </section>
  );
}

function ArticleSourceLayout({
  data,
  platform,
}: {
  data: SourceContentData;
  platform: { icon: string; label: string; color: string };
}) {
  const stats = [
    { icon: "ri-heart-3-line", value: data.likes, label: "点赞", color: "#ef4444" },
    { icon: "ri-chat-3-line", value: data.comments, label: "评论", color: "#3b82f6" },
    { icon: "ri-share-forward-line", value: data.shares, label: "分享", color: "#10b981" },
    { icon: "ri-user-follow-line", value: data.fans, label: "关注者", color: "#7B61FF" },
  ];

  const articleBody = data.articleBody ??
    `在过去这几年，降噪耳机市场经历了一场"价格革命"——曾经要花两三千才能买到的主动降噪技术，如今两三百块就能体验到。但问题是：便宜的降噪耳机真的好用吗？\n\n我花了整整30天，测试了市面上10款不同价位的降噪耳机，从199元的入门款到1899元的旗舰级，想找出那个"性价比甜点"。\n\n## 什么是真正的降噪效果？\n\n很多人买耳机时只看品牌，或者被"主动降噪"这四个字吸引，但从来不知道该怎么量化。其实有一个核心指标：降噪深度（dB）。\n\n这个数字代表耳机能把外界噪音压低多少分贝：\n\n- **35dB以上**：旗舰级，飞机发动机声能基本消除\n- **25-35dB**：日常通勤完全够用，咖啡厅键盘声基本听不到\n- **15-25dB**：属于"听个响"，降噪感受一般\n- **15dB以下**：几乎感受不到降噪，买它干嘛\n\n## 10款耳机测评结果\n\n经过标准化测试环境下的数据采集，结合实际使用场景（地铁、咖啡厅、办公室），给出以下排名：\n\n**199-399元段（平价之王）**\n\n第1名：SOUNDPEATS Air4 Pro — 降噪33dB，续航9h，重量46g\n为什么推荐：同价位里降噪最深，延迟低于15ms，游戏和视频都合适。\n\n第2名：QCY AilyPods Pro — 降噪28dB，续航8h，重量52g\n这款适合对通话质量有需求的用户，麦克风拾音在同价位排第一。\n\n**400-800元段（最值钱的选择）**\n\n第1名：索尼WF-C700N — 降噪33dB，续航7.5h，重量47g\n这款是我整体最推荐的，品牌调音 + 可信赖的降噪深度，放在900元以下无敌。\n\n**旗舰级800元以上**\n\n AirPods Pro 2 — 降噪45dB，续航6h\nSony WH-1000XM5 — 降噪42dB，续航30h\n这个价位的优势主要是"生态"和"颜值"，降噪本身跟400-800段已经没有质的差距。\n\n## 最终结论\n\n如果你的预算在300元以内，买SOUNDPEATS Air4 Pro，完全够用。\n如果你预算在500-700元，索尼WF-C700N是我目前见过同价位的最优解。\n旗舰值不值得买？只有当你对生态（Apple/Sony）有明确需求时才有意义。\n\n---\n\n这篇测评花了我将近一个月时间，如果帮到你了，点个赞是对我最大的支持。下期我会测评真无线耳机在运动场景下的表现，感兴趣的可以先关注。`;
  const articleImages = data.articleImages ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: "1px solid #F7F8FA" }}>
            <i className="ri-file-text-line text-[13px]" style={{ color: "#7B61FF" }} />
            <span className="text-[12px] font-semibold" style={{ color: "#111111" }}>原文内容</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-1"
              style={{ background: "#F7F8FA", color: "#888888" }}>
              长文
            </span>
            <span className="ml-auto text-[10px]" style={{ color: "#BBBBBB" }}>↕ 向下滑动查看全文</span>
          </div>
          <div
            className="overflow-y-auto px-5 py-4"
            style={{ height: "400px", scrollbarWidth: "thin", scrollbarColor: "#EAEAEA transparent" }}
          >
            {articleBody.split("\n").map((line, idx) => {
              if (line.startsWith("## ")) {
                return (
                  <h2 key={idx} className="text-[15px] font-bold mt-5 mb-2" style={{ color: "#111111" }}>
                    {line.replace("## ", "")}
                  </h2>
                );
              }
              if (line.startsWith("---")) {
                return <hr key={idx} className="my-4" style={{ border: "none", borderTop: "1px solid #EAEAEA" }} />;
              }
              if (line === "") {
                return <div key={idx} className="h-3" />;
              }
              const parts = line.split(/(\*\*[^*]+\*\*)/g);
              return (
                <p key={idx} className="text-[13px] leading-relaxed" style={{ color: "#444444" }}>
                  {parts.map((part, i) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={i} style={{ color: "#111111" }}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                </p>
              );
            })}
          </div>
        </div>

        {articleImages.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid #F7F8FA" }}>
              <i className="ri-image-2-line text-[12px]" style={{ color: "#fb923c" }} />
              <span className="text-[12px] font-semibold" style={{ color: "#111111" }}>文章配图</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-1"
                style={{ background: "#F7F8FA", color: "#888888" }}>
                共 {articleImages.length} 张
              </span>
            </div>
            <div className="p-4" style={{ background: "#F7F8FA" }}>
              <div className={`grid gap-2 ${articleImages.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {articleImages.map((src, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden" style={{ height: "100px" }}>
                    <img src={src} alt={`配图${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <p className="text-[14px] font-semibold leading-snug mb-3" style={{ color: "#111111" }}>
            {data.title}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0"
              style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
              <div className="w-full h-full flex items-center justify-center">
                <i className="ri-user-line text-[14px]" style={{ color: "#AAAAAA" }} />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#111111" }}>{data.author}</p>
              <p className="text-[11px]" style={{ color: "#888888" }}>{data.fans} 关注者</p>
            </div>
          </div>
          <div className="mt-3 pt-3 flex items-center gap-1 text-[11px]"
            style={{ borderTop: "1px solid #F7F8FA", color: "#AAAAAA" }}>
            <i className="ri-time-line text-[11px]" />
            发布于 {data.publishTime}
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#AAAAAA" }}>
            互动数据
          </p>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 p-3 rounded-xl" style={{ background: "#F7F8FA" }}>
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className={`${stat.icon} text-[14px]`} style={{ color: stat.color }} />
                </div>
                <p className="text-[16px] font-bold" style={{ color: "#111111" }}>{stat.value}</p>
                <p className="text-[11px]" style={{ color: "#888888" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, rgba(123,97,255,0.04), rgba(59,130,246,0.04))", border: "1px solid rgba(123,97,255,0.1)" }}>
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-search-line text-[13px]" style={{ color: "#7B61FF" }} />
            <p className="text-[12px] font-semibold" style={{ color: "#111111" }}>SEO 信号检测</p>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>
            分享量高于平台均值 <strong>4.8x</strong>，说明内容具备极强的决策辅助价值，搜索流量持续回流
          </p>
          <div className="mt-2.5 flex items-center flex-wrap gap-1">
            {["高分享量", "搜索流量", "长尾关键词"].map((tag) => (
              <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageSourceLayout({
  data,
  platform,
}: {
  data: SourceContentData;
  platform: { icon: string; label: string; color: string };
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const stats = [
    { icon: "ri-heart-3-line", value: data.likes, label: "点赞" },
    { icon: "ri-bookmark-line", value: "5.6K", label: "收藏" },
    { icon: "ri-chat-3-line", value: data.comments, label: "评论" },
    { icon: "ri-share-forward-line", value: data.shares, label: "分享" },
  ];

  const caption = data.imageCaption ??
    "大家好！今天来分享我花了3周整理的降噪耳机选购指南 🎧\n\n市面上耳机太多了真的选不过来，我帮大家踩了坑总结成9张图，从基础知识到实测推荐，按预算帮你选最适合的那款。\n\n✅ 200元档 / 500元档 / 旗舰档分别推荐\n✅ 降噪数据实测对比\n✅ 哪些功能是伪需求一次说清\n\n记得收藏备用！有问题评论区问我 👇\n\n#耳机推荐 #降噪耳机 #数码好物 #小红书购物";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid #EAEAEA" }}
        >
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #F7F8FA", background: "#ffffff" }}>
            <i className="ri-image-2-line text-[13px]" style={{ color: "#FF2442" }} />
            <span className="text-[12px] font-semibold" style={{ color: "#111111" }}>原图预览</span>
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full ml-1"
              style={{ background: "#F7F8FA", color: "#888888" }}>
              共 {data.thumbnailGallery.length} 张
            </span>
          </div>
          <div className="p-4" style={{ background: "#F7F8FA" }}>
            {data.thumbnailGallery.length === 1 ? (
              <div className="rounded-xl overflow-hidden cursor-zoom-in" style={{ width: "100%", height: "280px" }}
                onClick={() => setLightbox(0)}>
                <img src={data.thumbnailGallery[0]} alt="图文封面" className="w-full h-full object-cover" />
              </div>
            ) : data.thumbnailGallery.length <= 2 ? (
              <div className="grid grid-cols-2 gap-2">
                {data.thumbnailGallery.map((src, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden cursor-zoom-in" style={{ height: "180px" }}
                    onClick={() => setLightbox(idx)}>
                    <img src={src} alt={`图${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {data.thumbnailGallery.map((src, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden cursor-zoom-in relative group"
                    style={{ height: "140px" }}
                    onClick={() => setLightbox(idx)}>
                    <img src={src} alt={`图${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ background: "rgba(0,0,0,0.35)" }}>
                      <i className="ri-zoom-in-line text-white text-[18px]" />
                    </div>
                    <div className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: "rgba(0,0,0,0.55)" }}>{idx + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <div className="flex items-center gap-2 mb-3">
            <i className="ri-article-line text-[13px]" style={{ color: "#FF2442" }} />
            <span className="text-[12px] font-semibold" style={{ color: "#111111" }}>正文文案</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#F7F8FA", color: "#888888" }}>
              原始内容
            </span>
          </div>
          <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: "#333333" }}>
            {caption}
          </p>
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <p className="text-[14px] font-semibold leading-snug mb-3" style={{ color: "#111111" }}>
            {data.title}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0"
              style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
              <div className="w-full h-full flex items-center justify-center">
                <i className="ri-user-line text-[14px]" style={{ color: "#AAAAAA" }} />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#111111" }}>{data.author}</p>
              <p className="text-[11px]" style={{ color: "#888888" }}>{data.fans} 粉丝</p>
            </div>
          </div>
          <div className="mt-3 pt-3 flex items-center gap-1 text-[11px]"
            style={{ borderTop: "1px solid #F7F8FA", color: "#AAAAAA" }}>
            <i className="ri-time-line text-[11px]" />
            发布于 {data.publishTime}
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#AAAAAA" }}>
            互动数据
          </p>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 p-3 rounded-xl" style={{ background: "#F7F8FA" }}>
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className={`${stat.icon} text-[14px]`} style={{ color: "#FF2442" }} />
                </div>
                <p className="text-[16px] font-bold" style={{ color: "#111111" }}>{stat.value}</p>
                <p className="text-[11px]" style={{ color: "#888888" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, rgba(255,36,66,0.04), rgba(251,146,60,0.04))", border: "1px solid rgba(255,36,66,0.1)" }}>
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-bookmark-fill text-[13px]" style={{ color: "#FF2442" }} />
            <p className="text-[12px] font-semibold" style={{ color: "#111111" }}>收藏率信号</p>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>
            收藏率高于平台均值 <strong>4.1x</strong>，说明内容实用性极强，具备持续被搜索发现的长尾价值
          </p>
          <div className="mt-2.5 flex items-center flex-wrap gap-1">
            {["高收藏率", "长尾搜索流量", "强复购意愿"].map((tag) => (
              <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,36,66,0.08)", color: "#FF2442" }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={data.thumbnailGallery[lightbox]}
              alt={`图${lightbox + 1}`}
              className="w-full rounded-2xl"
              style={{ maxHeight: "80vh", objectFit: "contain" }}
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <span className="text-[12px] font-medium px-2.5 py-1 rounded-full text-white"
                style={{ background: "rgba(0,0,0,0.55)" }}>
                {lightbox + 1} / {data.thumbnailGallery.length}
              </span>
              <button className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
                style={{ background: "rgba(255,255,255,0.15)" }}
                onClick={() => setLightbox(null)}>
                <i className="ri-close-line text-white text-[16px]" />
              </button>
            </div>
            {lightbox > 0 && (
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full cursor-pointer"
                style={{ background: "rgba(255,255,255,0.15)" }}
                onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
              >
                <i className="ri-arrow-left-s-line text-white text-[20px]" />
              </button>
            )}
            {lightbox < data.thumbnailGallery.length - 1 && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full cursor-pointer"
                style={{ background: "rgba(255,255,255,0.15)" }}
                onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
              >
                <i className="ri-arrow-right-s-line text-white text-[20px]" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VideoSourceLayout({
  data,
  platform,
}: {
  data: SourceContentData;
  platform: { icon: string; label: string; color: string };
}) {
  const [activeThumb, setActiveThumb] = useState(0);
  const [playing, setPlaying] = useState(false);

  const stats = [
    { icon: "ri-heart-3-line", value: data.likes, label: "点赞" },
    { icon: "ri-chat-3-line", value: data.comments, label: "评论" },
    { icon: "ri-share-forward-line", value: data.shares, label: "分享" },
    { icon: "ri-user-follow-line", value: data.fans, label: "粉丝" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 flex flex-col gap-3">
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer"
          style={{ aspectRatio: "16/9", background: "#111111" }}
          onClick={() => setPlaying(!playing)}
        >
          <img
            src={data.thumbnailGallery[activeThumb] || data.thumbnail}
            alt={data.title}
            className="w-full h-full object-cover"
            style={{ opacity: 0.9 }}
          />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />
          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-14 h-14 flex items-center justify-center rounded-full transition-transform duration-150"
                style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                <i className="ri-play-fill text-[22px]" style={{ color: "#7B61FF", marginLeft: "2px" }} />
              </div>
            </div>
          )}
          <div
            className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-white"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            {data.duration}
          </div>
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-white"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          >
            <i className={`${platform.icon} text-[11px]`} />
            {platform.label}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {data.thumbnailGallery.map((src, idx) => (
            <div
              key={idx}
              className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-150"
              style={{
                width: "120px",
                height: "68px",
                border: `2px solid ${activeThumb === idx ? "#7B61FF" : "transparent"}`,
                opacity: activeThumb === idx ? 1 : 0.65,
              }}
              onClick={() => setActiveThumb(idx)}
            >
              <img src={src} alt={`frame-${idx}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <p className="text-[14px] font-semibold leading-snug mb-3" style={{ color: "#111111" }}>
            {data.title}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0"
              style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
              <div className="w-full h-full flex items-center justify-center">
                <i className="ri-user-line text-[14px]" style={{ color: "#AAAAAA" }} />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#111111" }}>{data.author}</p>
              <p className="text-[11px]" style={{ color: "#888888" }}>{data.fans} 粉丝</p>
            </div>
          </div>
          <div className="mt-3 pt-3 flex items-center gap-1 text-[11px]"
            style={{ borderTop: "1px solid #F7F8FA", color: "#AAAAAA" }}>
            <i className="ri-time-line text-[11px]" />
            发布于 {data.publishTime}
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#AAAAAA" }}>
            互动数据
          </p>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 p-3 rounded-xl" style={{ background: "#F7F8FA" }}>
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className={`${stat.icon} text-[14px]`} style={{ color: "#7B61FF" }} />
                </div>
                <p className="text-[16px] font-bold" style={{ color: "#111111" }}>{stat.value}</p>
                <p className="text-[11px]" style={{ color: "#888888" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, rgba(123,97,255,0.04), rgba(91,140,255,0.04))", border: "1px solid rgba(123,97,255,0.12)" }}>
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-fire-line text-[13px]" style={{ color: "#fb923c" }} />
            <p className="text-[12px] font-semibold" style={{ color: "#111111" }}>爆款信号检测</p>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>
            该内容点赞率和分享率均高于平台均值 <strong>3.2x</strong>，具备强复制价值
          </p>
          <div className="mt-2.5 flex items-center gap-1">
            {["高点赞率", "强分享意愿", "高完播预期"].map((tag) => (
              <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
