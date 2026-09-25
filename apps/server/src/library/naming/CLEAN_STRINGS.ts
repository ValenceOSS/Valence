const CLEAN_STRINGS: readonly RegExp[] = [
  /^\s*(?<cleaned>.+?)[ _,.()[\]-](3d|sbs|tab|hsbs|htab|mvc|HDR|HDC|UHD|UltraHD|4k|ac3|dts|custom|dc|divx|divx5|dsr|dsrip|dutch|dvd|dvdrip|dvdscr|dvdscreener|screener|dvdivx|cam|fragment|fs|hdtv|hdrip|hdtvrip|internal|limited|multi|subs|ntsc|ogg|ogm|pal|pdtv|proper|repack|rerip|retail|cd[1-9]|r5|bd5|bd|se|svcd|swedish|german|read.nfo|nfofix|unrated|ws|web-dl|telesync|ts|telecine|tc|brrip|bdrip|480p|480i|576p|576i|720p|720i|1080p|1080i|2160p|hrhd|hrhdtv|hddvd|bluray|blu-ray|x264|x265|h264|h265|xvid|xvidvd|xxx|www.www|AAC|DTS)(?=[ _,.()[\]-]|$)/iu,
  /^\s*(?<cleaned>.+?)((\s*\[[^\]]+\]\s*)+)(\.[^\s]+)?$/iu,
  /^\s*(?<cleaned>.+?)[^\p{L}\p{M}\p{Nd}\p{Pc}]E[0-9]+(-|~)E?[0-9]+([^\p{L}\p{M}\p{Nd}\p{Pc}]|$)/iu,
  /^\s*\[[^\]]+\](?!\.[\p{L}\p{M}\p{Nd}\p{Pc}]+$)\s*(?<cleaned>.+)/iu,
  /^\s*(?<cleaned>.+?)\s+-\s+[0-9]+\s*$/iu,
  /^\s*(?<cleaned>.+?)(([-._ ](trailer|sample))|-(scene|clip|behindthescenes|deleted|deletedscene|featurette|short|interview|other|extra))$/iu,
];

export { CLEAN_STRINGS };
