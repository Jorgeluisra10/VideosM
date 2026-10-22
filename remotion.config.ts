import { Config } from "@remotion/cli/config";

// Salida pensada para Reels / TikTok / Shorts: H.264 + AAC, 1080x1920 a 60 fps.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setCrf(17);
Config.setOverwriteOutput(true);
