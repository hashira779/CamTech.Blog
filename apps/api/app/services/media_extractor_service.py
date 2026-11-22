import re
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.common.ssrf import validate_url_safe

logger = logging.getLogger(__name__)

def _format_size(bytes_val: Optional[int]) -> str:
    if not bytes_val or bytes_val <= 0:
        return "Standard"
    mb = bytes_val / (1024 * 1024)
    if mb >= 1024:
        return f"{mb / 1024:.2f} GB"
    return f"{mb:.1f} MB"

class MediaExtractorService:
    @staticmethod
    def extract(url: str) -> Dict[str, Any]:
        """
        Next-Gen 2026-2028 Universal Media Extractor:
        Extracts high-resolution MP4 video and MP3 audio from TikTok, YouTube,
        Facebook, Instagram Reels, Twitter/X, Douyin, Pinterest, etc.
        """
        if not url or not isinstance(url, str):
            return {"error": "Please provide a valid media URL."}

        clean_url = url.strip()
        if not clean_url.startswith(("http://", "https://")):
            clean_url = "https://" + clean_url

        # 1. SSRF Security Gate: Prohibit internal IPs / loopback / cloud metadata
        is_safe, reason = validate_url_safe(clean_url)
        if not is_safe:
            logger.warning(f"SSRF violation blocked in MediaExtractorService: {clean_url} ({reason})")
            return {"error": f"Invalid or disallowed URL: {reason}"}

        lower_url = clean_url.lower()

        # 2. Specialized High-Speed TikTok & Douyin Extractor (Watermark-Free)
        if any(domain in lower_url for domain in ["tiktok.com", "douyin.com"]):
            tiktok_data = MediaExtractorService._extract_tiktok(clean_url)
            if tiktok_data and not tiktok_data.get("error"):
                return tiktok_data

        # 3. Universal Extractor via yt-dlp (YouTube, FB, IG, Twitter/X, etc.)
        return MediaExtractorService._extract_ytdlp(clean_url)

    @staticmethod
    def _extract_tiktok(url: str) -> Optional[Dict[str, Any]]:
        api_url = "https://www.tikwm.com/api/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "application/json",
        }
        try:
            target_url = url
            # If short link (e.g. vt.tiktok.com / vm.tiktok.com), follow redirects to final URL
            if "vt.tiktok.com" in url or "vm.tiktok.com" in url:
                try:
                    with httpx.Client(timeout=6.0, follow_redirects=True) as resolve_client:
                        res = resolve_client.head(url)
                        if res.status_code < 400:
                            target_url = str(res.url)
                except Exception:
                    pass

            with httpx.Client(timeout=12.0) as client:
                resp = client.post(api_url, data={"url": target_url, "hd": 1}, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("code") == 0:
                        d = data.get("data", {})
                        title = d.get("title") or "TikTok Video"
                        author_info = d.get("author", {})
                        author = author_info.get("nickname") or author_info.get("unique_id") or "TikTok Creator"
                        thumb = d.get("cover")
                        duration_sec = d.get("duration", 0)
                        dur_str = f"{duration_sec // 60:02d}:{duration_sec % 60:02d}" if duration_sec else "00:30"

                        v_formats = []
                        if d.get("hdplay"):
                            v_formats.append({
                                "label": "1080p Full HD (No Watermark)",
                                "resolution": "1080p",
                                "format": "MP4",
                                "size": _format_size(d.get("hd_size") or d.get("size")),
                                "url": d.get("hdplay"),
                                "has_audio": True,
                            })
                        if d.get("play"):
                            v_formats.append({
                                "label": "720p HD (Watermark-Free)",
                                "resolution": "720p",
                                "format": "MP4",
                                "size": _format_size(d.get("size")),
                                "url": d.get("play"),
                                "has_audio": True,
                            })
                        if d.get("wmplay"):
                            v_formats.append({
                                "label": "Original (With Watermark)",
                                "resolution": "SD",
                                "format": "MP4",
                                "size": _format_size(d.get("wm_size")),
                                "url": d.get("wmplay"),
                                "has_audio": True,
                            })

                        a_formats = []
                        if d.get("music"):
                            music_info = d.get("music_info", {})
                            music_title = music_info.get("title") or "Original Sound Track"
                            a_formats.append({
                                "label": f"{music_title} (MP3 Audio)",
                                "format": "MP3",
                                "size": "Original Bitrate",
                                "url": d.get("music"),
                            })

                        return {
                            "platform": "TikTok",
                            "title": title,
                            "uploader": author,
                            "thumbnail": thumb,
                            "duration": dur_str,
                            "preview_url": d.get("play") or d.get("hdplay"),
                            "video_formats": v_formats,
                            "audio_formats": a_formats,
                        }
        except Exception as e:
            logger.warning(f"TikTok fast extractor failed for {url}, falling back: {e}")
        return None

    @staticmethod
    def _extract_ytdlp(url: str) -> Dict[str, Any]:
        try:
            import yt_dlp
        except ImportError:
            return {"error": "Media extractor library not available on this server."}

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "noplaylist": True,
            "socket_timeout": 12,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info:
                    return {"error": "Could not extract video details from this link. Please check that the URL is public."}

                title = info.get("title") or "Media Video"
                uploader = info.get("uploader") or info.get("channel") or info.get("creator") or "Content Creator"
                thumb = info.get("thumbnail")
                dur = info.get("duration") or 0
                dur_str = f"{int(dur // 60):02d}:{int(dur % 60):02d}" if dur else ""
                platform = info.get("extractor_key") or "Universal"

                formats = info.get("formats", [])
                video_formats = []
                audio_formats = []
                seen_res = set()

                for f in reversed(formats):
                    ext = f.get("ext", "").lower()
                    vcodec = f.get("vcodec", "none")
                    acodec = f.get("acodec", "none")
                    height = f.get("height")
                    f_url = f.get("url")

                    if not f_url or not f_url.startswith("http"):
                        continue

                    # Audio format collection
                    if vcodec == "none" and acodec != "none":
                        abr = f.get("abr") or f.get("tbr") or 128
                        label = f"Audio {ext.upper()} (~{int(abr)} kbps)"
                        if label not in [a["label"] for a in audio_formats]:
                            audio_formats.append({
                                "label": label,
                                "format": "MP3" if "mp3" in ext or "m4a" in ext else ext.upper(),
                                "size": _format_size(f.get("filesize") or f.get("filesize_approx")),
                                "url": f_url,
                            })

                    # Video format collection
                    if vcodec != "none" and height and height >= 144:
                        res_key = f"{height}p"
                        if res_key not in seen_res and len(seen_res) < 6:
                            seen_res.add(res_key)
                            has_audio = acodec != "none"
                            audio_note = "" if has_audio else " (Video stream)"
                            video_formats.append({
                                "label": f"{res_key} {ext.upper()}{audio_note}",
                                "resolution": res_key,
                                "format": ext.upper(),
                                "size": _format_size(f.get("filesize") or f.get("filesize_approx")),
                                "url": f_url,
                                "has_audio": has_audio,
                            })

                if not video_formats and not audio_formats:
                    # Direct single format fallback
                    direct_url = info.get("url")
                    if direct_url:
                        video_formats.append({
                            "label": "Original Stream (MP4)",
                            "resolution": "HD",
                            "format": "MP4",
                            "size": "Standard",
                            "url": direct_url,
                            "has_audio": True,
                        })

                preview = None
                for v in video_formats:
                    if v.get("has_audio"):
                        preview = v["url"]
                        break
                if not preview and video_formats:
                    preview = video_formats[0]["url"]

                return {
                    "platform": platform,
                    "title": title,
                    "uploader": uploader,
                    "thumbnail": thumb,
                    "duration": dur_str,
                    "preview_url": preview,
                    "video_formats": video_formats,
                    "audio_formats": audio_formats[:4],
                }
        except Exception as e:
            err_msg = str(e)
            if "Private video" in err_msg:
                return {"error": "This video is private or requires authentication."}
            if "Video unavailable" in err_msg:
                return {"error": "This video is unavailable or has been removed."}
            logger.error(f"Error in MediaExtractorService._extract_ytdlp: {e}", exc_info=True)
            return {"error": f"Failed to extract media: {err_msg[:120]}"}
