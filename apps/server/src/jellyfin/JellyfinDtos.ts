type JellyfinItemKind = 'Movie' | 'Series' | 'Season' | 'Episode' | 'CollectionFolder';

type JellyfinUserData = {
  PlaybackPositionTicks: number;
  PlayCount: number;
  IsFavorite: boolean;
  Played: boolean;
  Key: string;
  ItemId: string;
  PlayedPercentage?: number;
  UnplayedItemCount?: number;
  LastPlayedDate?: string;
};

type JellyfinPerson = {
  Name: string;
  Id: string;
  Role: string;
  Type: 'Actor';
};

type JellyfinMediaStream = {
  Codec: string;
  Language?: string;
  Title?: string;
  DisplayTitle: string;
  IsDefault: boolean;
  IsForced: boolean;
  IsExternal: boolean;
  Type: 'Video' | 'Audio' | 'Subtitle';
  Index: number;
  IsTextSubtitleStream?: boolean;
  SupportsExternalStream?: boolean;
  Height?: number;
  Width?: number;
  BitRate?: number;
  BitDepth?: number;
  Channels?: number;
  SampleRate?: number;
  Profile?: string;
  VideoRange?: string;
  VideoRangeType?: string;
  AverageFrameRate?: number;
  RealFrameRate?: number;
  IsInterlaced?: boolean;
  Level?: number;
  ChannelLayout?: string;
};

type JellyfinMediaSource = {
  Protocol: 'File';
  Id: string;
  Type: 'Default';
  Container: string;
  Size?: number;
  Name: string;
  IsRemote: boolean;
  ETag: string;
  RunTimeTicks: number;
  ReadAtNativeFramerate: boolean;
  IgnoreDts: boolean;
  IgnoreIndex: boolean;
  GenPtsInput: boolean;
  SupportsTranscoding: boolean;
  SupportsDirectStream: boolean;
  SupportsDirectPlay: boolean;
  IsInfiniteStream: boolean;
  RequiresOpening: boolean;
  RequiresClosing: boolean;
  RequiresLooping: boolean;
  SupportsProbing: boolean;
  MediaStreams: JellyfinMediaStream[];
  MediaAttachments: [];
  Formats: [];
  Bitrate: number;
  DefaultAudioStreamIndex?: number;
  DefaultSubtitleStreamIndex?: number;
  TranscodingUrl?: string;
  TranscodingSubProtocol?: 'hls' | 'http';
  TranscodingContainer?: string;
  DirectStreamUrl?: string;
  HasSegments?: boolean;
};

type JellyfinItem = {
  Name: string;
  ServerId: string;
  Id: string;
  Etag?: string;
  DateCreated?: string;
  CanDelete: boolean;
  CanDownload: boolean;
  SortName?: string;
  PremiereDate?: string;
  OfficialRating?: string;
  Overview?: string;
  Taglines?: string[];
  Genres?: string[];
  CommunityRating?: number;
  RunTimeTicks?: number;
  ProductionYear?: number;
  IndexNumber?: number;
  IndexNumberEnd?: number;
  ParentIndexNumber?: number;
  IsFolder: boolean;
  Type: JellyfinItemKind;
  CollectionType?: 'movies' | 'tvshows';
  ParentId?: string;
  SeriesName?: string;
  SeriesId?: string;
  SeasonId?: string;
  SeasonName?: string;
  SeriesPrimaryImageTag?: string;
  ParentBackdropItemId?: string;
  ParentBackdropImageTags?: string[];
  ParentLogoItemId?: string;
  ParentLogoImageTag?: string;
  ChildCount?: number;
  RecursiveItemCount?: number;
  People?: JellyfinPerson[];
  Studios?: [];
  GenreItems?: { Name: string; Id: string }[];
  ProviderIds?: Record<string, string>;
  LocationType: 'FileSystem' | 'Virtual';
  MediaType: 'Video' | 'Unknown';
  VideoType?: 'VideoFile';
  Container?: string;
  Width?: number;
  Height?: number;
  HasSubtitles?: boolean;
  MediaSources?: JellyfinMediaSource[];
  MediaStreams?: JellyfinMediaStream[];
  ImageTags: Record<string, string>;
  BackdropImageTags: string[];
  PrimaryImageAspectRatio?: number;
  UserData?: JellyfinUserData;
  Chapters?: [];
  LocalTrailerCount?: number;
  SpecialFeatureCount?: number;
  Status?: string;
};

type JellyfinQueryResult = {
  Items: JellyfinItem[];
  TotalRecordCount: number;
  StartIndex: number;
};

type JellyfinUser = {
  Name: string;
  ServerId: string;
  Id: string;
  PrimaryImageTag?: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  HasConfiguredEasyPassword: boolean;
  EnableAutoLogin: boolean;
  LastLoginDate?: string;
  LastActivityDate?: string;
  Configuration: {
    PlayDefaultAudioTrack: boolean;
    SubtitleLanguagePreference: string;
    DisplayMissingEpisodes: boolean;
    GroupedFolders: string[];
    SubtitleMode: 'Default';
    DisplayCollectionsView: boolean;
    EnableLocalPassword: boolean;
    OrderedViews: string[];
    LatestItemsExcludes: string[];
    MyMediaExcludes: string[];
    HidePlayedInLatest: boolean;
    RememberAudioSelections: boolean;
    RememberSubtitleSelections: boolean;
    EnableNextEpisodeAutoPlay: boolean;
  };
  Policy: {
    IsAdministrator: boolean;
    IsHidden: boolean;
    IsDisabled: boolean;
    EnableUserPreferenceAccess: boolean;
    EnableRemoteControlOfOtherUsers: boolean;
    EnableSharedDeviceControl: boolean;
    EnableRemoteAccess: boolean;
    EnableLiveTvManagement: boolean;
    EnableLiveTvAccess: boolean;
    EnableMediaPlayback: boolean;
    EnableAudioPlaybackTranscoding: boolean;
    EnableVideoPlaybackTranscoding: boolean;
    EnablePlaybackRemuxing: boolean;
    EnableContentDeletion: boolean;
    EnableContentDownloading: boolean;
    EnableSyncTranscoding: boolean;
    EnableMediaConversion: boolean;
    EnableAllDevices: boolean;
    EnableAllChannels: boolean;
    EnableAllFolders: boolean;
    EnablePublicSharing: boolean;
    AuthenticationProviderId: string;
    PasswordResetProviderId: string;
    SyncPlayAccess: 'None';
  };
};

type JellyfinSession = {
  Id: string;
  UserId: string;
  UserName: string;
  Client: string;
  DeviceId: string;
  DeviceName: string;
  ApplicationVersion: string;
  IsActive: boolean;
  LastActivityDate: string;
  ServerId: string;
  SupportsMediaControl: boolean;
  SupportsRemoteControl: boolean;
  PlayableMediaTypes: string[];
  AdditionalUsers: [];
  Capabilities: { PlayableMediaTypes: string[]; SupportedCommands: string[] };
};

type JellyfinPublicInfo = {
  LocalAddress: string;
  ServerName: string;
  Version: string;
  ProductName: string;
  OperatingSystem: string;
  Id: string;
  StartupWizardCompleted: boolean;
};

export type {
  JellyfinItem,
  JellyfinItemKind,
  JellyfinMediaSource,
  JellyfinMediaStream,
  JellyfinPerson,
  JellyfinPublicInfo,
  JellyfinQueryResult,
  JellyfinSession,
  JellyfinUser,
  JellyfinUserData,
};
