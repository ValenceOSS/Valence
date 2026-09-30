CREATE TABLE `account` (
	`id` varchar(64) NOT NULL,
	`accountId` mediumtext NOT NULL,
	`providerId` mediumtext NOT NULL,
	`issuer` mediumtext,
	`userId` varchar(64) NOT NULL,
	`accessToken` mediumtext,
	`refreshToken` mediumtext,
	`idToken` mediumtext,
	`accessTokenExpiresAt` datetime(3),
	`refreshTokenExpiresAt` datetime(3),
	`scope` mediumtext,
	`password` mediumtext,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `account_activity` (
	`userId` varchar(64) NOT NULL,
	`lastSignInAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`signInCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `account_activity_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `age_ceiling` (
	`userId` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`maximumAge` int NOT NULL,
	`allowsUnrated` boolean NOT NULL DEFAULT false,
	`setAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `age_ceiling_userId_libraryId_pk` PRIMARY KEY(`userId`,`libraryId`),
	CONSTRAINT `age_ceiling_range` CHECK(`age_ceiling`.`maximumAge` between 0 and 21)
);
--> statement-breakpoint
CREATE TABLE `age_exception` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`mediaItemId` varchar(64),
	`seriesId` varchar(64),
	`effect` mediumtext NOT NULL,
	`grantedBy` varchar(64),
	`grantedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `age_exception_id` PRIMARY KEY(`id`),
	CONSTRAINT `age_exception_item_idx` UNIQUE(`userId`,`mediaItemId`),
	CONSTRAINT `age_exception_series_idx` UNIQUE(`userId`,`seriesId`),
	CONSTRAINT `age_exception_effect` CHECK(`age_exception`.`effect` in ('allow', 'deny'))
);
--> statement-breakpoint
CREATE TABLE `apikey` (
	`id` varchar(64) NOT NULL,
	`configId` mediumtext NOT NULL,
	`name` mediumtext,
	`start` mediumtext,
	`referenceId` varchar(64) NOT NULL,
	`prefix` mediumtext,
	`key` mediumtext NOT NULL,
	`refillInterval` int,
	`refillAmount` int,
	`lastRefillAt` datetime(3),
	`enabled` boolean DEFAULT true,
	`rateLimitEnabled` boolean DEFAULT true,
	`rateLimitTimeWindow` int,
	`rateLimitMax` int,
	`requestCount` int DEFAULT 0,
	`remaining` int,
	`lastRequest` datetime(3),
	`expiresAt` datetime(3),
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	`permissions` mediumtext,
	`metadata` mediumtext,
	CONSTRAINT `apikey_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `book` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`title` varchar(768) NOT NULL,
	`layout` mediumtext NOT NULL,
	`direction` mediumtext NOT NULL,
	`year` int,
	`overview` mediumtext,
	`genres` json,
	`authors` json,
	`rating` float,
	`posterUrl` mediumtext,
	`externalId` mediumtext,
	`seriesName` mediumtext,
	`seriesPosition` float,
	`isCorrected` boolean NOT NULL DEFAULT false,
	`addedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `book_id` PRIMARY KEY(`id`),
	CONSTRAINT `book_path_idx` UNIQUE(`libraryId`,`pathHash`),
	CONSTRAINT `book_layout_known` CHECK(`book`.`layout` in ('fixed', 'reflow', 'audio')),
	CONSTRAINT `book_direction_known` CHECK(`book`.`direction` in ('rightToLeft', 'leftToRight'))
);
--> statement-breakpoint
CREATE TABLE `book_chapter` (
	`id` varchar(64) NOT NULL,
	`bookId` varchar(64) NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`number` float NOT NULL,
	`title` mediumtext NOT NULL,
	`format` mediumtext NOT NULL,
	`pageCount` int,
	`durationSeconds` float,
	`marks` json,
	`sizeBytes` bigint NOT NULL,
	`modifiedAtMs` bigint NOT NULL,
	`addedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `book_chapter_id` PRIMARY KEY(`id`),
	CONSTRAINT `book_chapter_path_idx` UNIQUE(`bookId`,`pathHash`),
	CONSTRAINT `book_chapter_format_known` CHECK(`book_chapter`.`format` in ('cbz', 'cbr', 'pdf', 'epub', 'm4b', 'm4a', 'mp3', 'aac', 'ogg', 'opus', 'flac'))
);
--> statement-breakpoint
CREATE TABLE `deviceCode` (
	`id` varchar(64) NOT NULL,
	`deviceCode` mediumtext NOT NULL,
	`userCode` mediumtext NOT NULL,
	`userId` varchar(64),
	`expiresAt` datetime(3) NOT NULL,
	`status` mediumtext NOT NULL,
	`lastPolledAt` datetime(3),
	`pollingInterval` int,
	`clientId` mediumtext,
	`scope` mediumtext,
	CONSTRAINT `deviceCode_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `download_holding` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`clientId` varchar(255) NOT NULL,
	`mediaItemId` varchar(64) NOT NULL,
	`quality` varchar(64) NOT NULL,
	`heldAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `download_holding_id` PRIMARY KEY(`id`),
	CONSTRAINT `download_holding_one_idx` UNIQUE(`profileId`,`clientId`,`mediaItemId`,`quality`)
);
--> statement-breakpoint
CREATE TABLE `favourite` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`mediaItemId` varchar(64),
	`bookId` varchar(64),
	`keptAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `favourite_id` PRIMARY KEY(`id`),
	CONSTRAINT `favourite_profile_idx` UNIQUE(`profileId`,`mediaItemId`),
	CONSTRAINT `favourite_profile_book_idx` UNIQUE(`profileId`,`bookId`)
);
--> statement-breakpoint
CREATE TABLE `favourite_artist` (
	`profileId` varchar(64) NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`keptAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `favourite_artist_profileId_artistId_pk` PRIMARY KEY(`profileId`,`artistId`)
);
--> statement-breakpoint
CREATE TABLE `hidden` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`mediaItemId` varchar(64),
	`seriesId` varchar(64),
	`libraryId` varchar(64),
	`hiddenAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `hidden_id` PRIMARY KEY(`id`),
	CONSTRAINT `hidden_profile_item_idx` UNIQUE(`profileId`,`mediaItemId`),
	CONSTRAINT `hidden_profile_series_idx` UNIQUE(`profileId`,`seriesId`),
	CONSTRAINT `hidden_profile_library_idx` UNIQUE(`profileId`,`libraryId`)
);
--> statement-breakpoint
CREATE TABLE `job_run` (
	`id` varchar(64) NOT NULL,
	`kind` varchar(255) NOT NULL,
	`status` varchar(32) NOT NULL,
	`subject` mediumtext,
	`startedAt` datetime(3),
	`finishedAt` datetime(3),
	`progress` json,
	`errorMessage` mediumtext,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `job_run_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_run_issue` (
	`id` varchar(64) NOT NULL,
	`jobRunId` varchar(64) NOT NULL,
	`path` mediumtext NOT NULL,
	`reason` mediumtext NOT NULL,
	`atMs` bigint NOT NULL,
	CONSTRAINT `job_run_issue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_schedule` (
	`queueName` varchar(255) NOT NULL,
	`key` varchar(255) NOT NULL,
	`cron` mediumtext NOT NULL,
	`timezone` mediumtext NOT NULL,
	`nextRunAt` datetime(3) NOT NULL,
	CONSTRAINT `job_schedule_queueName_key_pk` PRIMARY KEY(`queueName`,`key`)
);
--> statement-breakpoint
CREATE TABLE `job_trigger` (
	`id` varchar(64) NOT NULL,
	`kind` varchar(255) NOT NULL,
	`trigger` json NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `job_trigger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jwks` (
	`id` varchar(64) NOT NULL,
	`publicKey` mediumtext NOT NULL,
	`privateKey` mediumtext NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	`expiresAt` datetime(3),
	`alg` mediumtext,
	`crv` mediumtext,
	CONSTRAINT `jwks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `library` (
	`id` varchar(64) NOT NULL,
	`name` mediumtext NOT NULL,
	`kind` mediumtext NOT NULL,
	`flavour` mediumtext,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`lastScannedAt` datetime(3),
	`lastScanAdded` int,
	`lastScanUpdated` int,
	`lastScanRemoved` int,
	`lastScanFailed` int,
	`defaultAudioLanguage` mediumtext,
	`filesAtOnce` int,
	`generation` int NOT NULL DEFAULT 0,
	`takesRequests` boolean NOT NULL DEFAULT true,
	`requestProfileId` varchar(64),
	`requestPath` mediumtext,
	CONSTRAINT `library_id` PRIMARY KEY(`id`),
	CONSTRAINT `library_path_unique` UNIQUE(`pathHash`)
);
--> statement-breakpoint
CREATE TABLE `library_block` (
	`userId` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`blockedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `library_block_userId_libraryId_pk` PRIMARY KEY(`userId`,`libraryId`)
);
--> statement-breakpoint
CREATE TABLE `listening_progress` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`bookId` varchar(64) NOT NULL,
	`chapterId` varchar(64) NOT NULL,
	`positionSeconds` float NOT NULL,
	`isFinished` boolean NOT NULL DEFAULT false,
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `listening_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `listening_progress_book_idx` UNIQUE(`profileId`,`bookId`)
);
--> statement-breakpoint
CREATE TABLE `log_record` (
	`id` varchar(64) NOT NULL,
	`at` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`level` varchar(32) NOT NULL,
	`source` varchar(255) NOT NULL,
	`message` mediumtext NOT NULL,
	`detail` longtext,
	`count` int NOT NULL DEFAULT 1,
	`sameEventKey` mediumtext NOT NULL,
	`sameEventKeyHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`sameEventKey`, 256))) STORED,
	`jobId` varchar(255),
	`jobKind` varchar(255),
	`libraryId` varchar(255),
	`mediaId` varchar(255),
	`sessionId` varchar(255),
	`requestId` varchar(255),
	`forgetAfter` datetime(3) NOT NULL,
	CONSTRAINT `log_record_id` PRIMARY KEY(`id`),
	CONSTRAINT `log_record_count_positive` CHECK(`log_record`.`count` > 0)
);
--> statement-breakpoint
CREATE TABLE `media_artwork_choice` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`externalKind` varchar(32) NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`kind` varchar(64) NOT NULL,
	`url` mediumtext NOT NULL,
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedBy` mediumtext,
	CONSTRAINT `media_artwork_choice_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_artwork_choice_title_idx` UNIQUE(`libraryId`,`externalKind`,`externalId`,`kind`)
);
--> statement-breakpoint
CREATE TABLE `media_item` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`title` varchar(768) NOT NULL,
	`year` int,
	`sizeBytes` bigint NOT NULL,
	`modifiedAtMs` bigint NOT NULL,
	`container` mediumtext NOT NULL,
	`durationSeconds` float NOT NULL,
	`bitrateKbps` int,
	`videoCodec` mediumtext NOT NULL,
	`videoCodecTag` mediumtext,
	`videoRange` mediumtext NOT NULL,
	`videoRangeBase` mediumtext,
	`videoBitDepth` int,
	`canCopySegments` boolean,
	`probeVersion` int,
	`videoLevel` int,
	`videoFrameRate` float,
	`videoIsInterlaced` boolean,
	`videoRefFrames` int,
	`videoPixelAspect` mediumtext,
	`videoRotationDegrees` int,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`audioStreams` json NOT NULL,
	`subtitleStreams` json NOT NULL,
	`chapters` json,
	`parentId` varchar(64),
	`extraKind` mediumtext,
	`versionLabel` mediumtext,
	`trailerKey` mediumtext,
	`releaseDate` mediumtext,
	`budget` bigint,
	`revenue` bigint,
	`catalogueStatus` mediumtext,
	`imdbId` mediumtext,
	`rottenTomatoes` int,
	`seriesId` varchar(64),
	`seriesTitle` varchar(512),
	`certifications` json,
	`certificationAge` int,
	`seasonNumber` int,
	`episodeNumber` int,
	`episodeNumberEnd` int,
	`overview` mediumtext,
	`tagline` mediumtext,
	`genres` json,
	`castMembers` json,
	`rating` float,
	`posterUrl` mediumtext,
	`backdropUrl` mediumtext,
	`logoUrl` mediumtext,
	`externalId` mediumtext,
	`addedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `media_item_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_item_path_idx` UNIQUE(`libraryId`,`pathHash`)
);
--> statement-breakpoint
CREATE TABLE `media_item_job` (
	`mediaItemId` varchar(64) NOT NULL,
	`kind` varchar(255) NOT NULL,
	`completedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `media_item_job_mediaItemId_kind_pk` PRIMARY KEY(`mediaItemId`,`kind`)
);
--> statement-breakpoint
CREATE TABLE `media_override` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`externalId` mediumtext NOT NULL,
	`externalKind` mediumtext NOT NULL,
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedBy` mediumtext,
	CONSTRAINT `media_override_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_override_path_idx` UNIQUE(`libraryId`,`pathHash`)
);
--> statement-breakpoint
CREATE TABLE `media_preview_override` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`atSeconds` int NOT NULL,
	`durationSeconds` int,
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedBy` mediumtext,
	CONSTRAINT `media_preview_override_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_preview_override_path_idx` UNIQUE(`libraryId`,`pathHash`)
);
--> statement-breakpoint
CREATE TABLE `media_rendition` (
	`id` varchar(64) NOT NULL,
	`mediaItemId` varchar(64) NOT NULL,
	`kind` varchar(32) NOT NULL DEFAULT 'pinned',
	`path` varchar(4096) NOT NULL,
	`pathHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`path`, 256))) STORED,
	`label` mediumtext NOT NULL,
	`quality` mediumtext,
	`sizeBytes` bigint NOT NULL,
	`container` mediumtext NOT NULL,
	`durationSeconds` float NOT NULL,
	`bitrateKbps` int NOT NULL,
	`videoCodec` mediumtext NOT NULL,
	`videoCodecTag` mediumtext,
	`videoRange` mediumtext NOT NULL,
	`videoRangeBase` mediumtext,
	`videoBitDepth` int,
	`canCopySegments` boolean,
	`videoLevel` int,
	`videoFrameRate` float,
	`videoIsInterlaced` boolean,
	`videoRefFrames` int,
	`videoPixelAspect` mediumtext,
	`videoRotationDegrees` int,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`audioStreams` json NOT NULL,
	`subtitleStreams` json NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`createdBy` mediumtext,
	CONSTRAINT `media_rendition_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_rendition_path_idx` UNIQUE(`pathHash`),
	CONSTRAINT `media_rendition_kind` CHECK(`media_rendition`.`kind` in ('pinned'))
);
--> statement-breakpoint
CREATE TABLE `media_segment` (
	`id` varchar(64) NOT NULL,
	`mediaItemId` varchar(64) NOT NULL,
	`kind` varchar(64) NOT NULL,
	`startSeconds` float NOT NULL,
	`endSeconds` float NOT NULL,
	`source` mediumtext NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `media_segment_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_segment_kind_idx` UNIQUE(`mediaItemId`,`kind`)
);
--> statement-breakpoint
CREATE TABLE `music_album` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`title` mediumtext NOT NULL,
	`titleKey` varchar(512) NOT NULL,
	`year` int,
	`genres` json,
	`isCompilation` boolean NOT NULL DEFAULT false,
	`artworkPath` mediumtext,
	`musicbrainzId` mediumtext,
	`releaseGroupMusicbrainzId` varchar(255),
	`isCorrected` boolean NOT NULL DEFAULT false,
	`lookedUpAt` datetime(3),
	`addedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `music_album_id` PRIMARY KEY(`id`),
	CONSTRAINT `music_album_key_idx` UNIQUE(`libraryId`,`artistId`,`titleKey`)
);
--> statement-breakpoint
CREATE TABLE `music_artist` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`name` mediumtext NOT NULL,
	`nameKey` varchar(512) NOT NULL,
	`sortName` varchar(512) NOT NULL,
	`musicbrainzId` mediumtext,
	`imagePath` mediumtext,
	`lookedUpAt` datetime(3),
	`addedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `music_artist_id` PRIMARY KEY(`id`),
	CONSTRAINT `music_artist_key_idx` UNIQUE(`libraryId`,`nameKey`)
);
--> statement-breakpoint
CREATE TABLE `music_track` (
	`mediaItemId` varchar(64) NOT NULL,
	`albumId` varchar(64) NOT NULL,
	`discNumber` int,
	`trackNumber` int,
	`codec` mediumtext NOT NULL,
	`isLossless` boolean NOT NULL DEFAULT false,
	`isExplicit` boolean NOT NULL DEFAULT false,
	`bitDepth` int,
	`sampleRate` int,
	`lyrics` mediumtext,
	`lyricsAreSynced` boolean NOT NULL DEFAULT false,
	`lyricsModifiedAtMs` bigint,
	`lyricsLookedUpAt` datetime(3),
	`videoKey` mediumtext,
	CONSTRAINT `music_track_mediaItemId` PRIMARY KEY(`mediaItemId`)
);
--> statement-breakpoint
CREATE TABLE `music_track_artist` (
	`mediaItemId` varchar(64) NOT NULL,
	`artistId` varchar(64) NOT NULL,
	`position` int NOT NULL,
	CONSTRAINT `music_track_artist_mediaItemId_artistId_pk` PRIMARY KEY(`mediaItemId`,`artistId`)
);
--> statement-breakpoint
CREATE TABLE `notification` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`event` mediumtext NOT NULL,
	`title` mediumtext NOT NULL,
	`body` mediumtext NOT NULL,
	`link` mediumtext,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`readAt` datetime(3),
	CONSTRAINT `notification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preference` (
	`userId` varchar(64) NOT NULL,
	`event` varchar(255) NOT NULL,
	`inApp` boolean NOT NULL DEFAULT true,
	`push` boolean NOT NULL DEFAULT false,
	CONSTRAINT `notification_preference_userId_event_pk` PRIMARY KEY(`userId`,`event`)
);
--> statement-breakpoint
CREATE TABLE `passkey` (
	`id` varchar(64) NOT NULL,
	`name` mediumtext,
	`publicKey` mediumtext NOT NULL,
	`userId` varchar(64) NOT NULL,
	`credentialID` mediumtext NOT NULL,
	`counter` int NOT NULL,
	`deviceType` mediumtext NOT NULL,
	`backedUp` boolean NOT NULL,
	`transports` mediumtext,
	`createdAt` datetime(3),
	`aaguid` mediumtext,
	CONSTRAINT `passkey_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playlist` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64),
	`name` mediumtext NOT NULL,
	`description` mediumtext,
	`isShared` boolean NOT NULL DEFAULT false,
	`isOrdered` boolean NOT NULL DEFAULT false,
	`artworkPath` mediumtext,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `playlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playlist_entry` (
	`id` varchar(64) NOT NULL,
	`playlistId` varchar(64) NOT NULL,
	`mediaItemId` varchar(64),
	`position` double NOT NULL,
	`addedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `playlist_entry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plugin_connection` (
	`pluginId` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`accessToken` mediumtext NOT NULL,
	`refreshToken` mediumtext,
	`expiresAt` datetime(3),
	`account` mediumtext,
	`connectedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `plugin_connection_pluginId_profileId_provider_pk` PRIMARY KEY(`pluginId`,`profileId`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `plugin_hook` (
	`pluginId` varchar(64) NOT NULL,
	`hookId` varchar(255) NOT NULL,
	`secret` mediumtext NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `plugin_hook_pluginId_hookId_pk` PRIMARY KEY(`pluginId`,`hookId`)
);
--> statement-breakpoint
CREATE TABLE `plugin_installation` (
	`id` varchar(64) NOT NULL,
	`version` mediumtext NOT NULL,
	`trust` mediumtext NOT NULL,
	`manifest` json NOT NULL,
	`package` longtext NOT NULL,
	`sha256` mediumtext NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`settings` json NOT NULL,
	`installedBy` varchar(64),
	`installedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`problem` mediumtext,
	CONSTRAINT `plugin_installation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plugin_previous` (
	`pluginId` varchar(64) NOT NULL,
	`version` mediumtext NOT NULL,
	`trust` mediumtext NOT NULL,
	`manifest` json NOT NULL,
	`package` longtext NOT NULL,
	`sha256` mediumtext NOT NULL,
	`storage` json NOT NULL,
	`keptAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `plugin_previous_pluginId` PRIMARY KEY(`pluginId`)
);
--> statement-breakpoint
CREATE TABLE `plugin_profile` (
	`pluginId` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`firstUsedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `plugin_profile_pluginId_profileId_pk` PRIMARY KEY(`pluginId`,`profileId`)
);
--> statement-breakpoint
CREATE TABLE `plugin_storage` (
	`pluginId` varchar(64) NOT NULL,
	`key` varchar(512) NOT NULL,
	`value` json NOT NULL,
	`bytes` int NOT NULL,
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `plugin_storage_pluginId_key_pk` PRIMARY KEY(`pluginId`,`key`)
);
--> statement-breakpoint
CREATE TABLE `prepared_download` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`mediaItemId` varchar(64) NOT NULL,
	`quality` varchar(64) NOT NULL,
	`audioLanguages` json NOT NULL,
	`renditionId` varchar(64) NOT NULL,
	`state` varchar(32) NOT NULL DEFAULT 'preparing',
	`progress` int NOT NULL DEFAULT 0,
	`bytesPerSecond` bigint,
	`secondsLeft` int,
	`sizeBytes` bigint,
	`failure` mediumtext,
	`askedFromClientId` mediumtext,
	`askedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`readyAt` datetime(3),
	CONSTRAINT `prepared_download_id` PRIMARY KEY(`id`),
	CONSTRAINT `prepared_download_asked_idx` UNIQUE(`profileId`,`mediaItemId`,`quality`)
);
--> statement-breakpoint
CREATE TABLE `push_subscription` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`endpoint` varchar(768) NOT NULL,
	`p256dh` mediumtext NOT NULL,
	`auth` mediumtext NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `push_subscription_id` PRIMARY KEY(`id`),
	CONSTRAINT `push_subscription_endpoint_idx` UNIQUE(`endpoint`)
);
--> statement-breakpoint
CREATE TABLE `queued_job` (
	`id` varchar(64) NOT NULL,
	`kind` varchar(255) NOT NULL,
	`payload` json NOT NULL,
	`subject` varchar(512),
	`state` varchar(32) NOT NULL,
	`waitingKey` varchar(255),
	`attempts` int NOT NULL DEFAULT 0,
	`retryLimit` int NOT NULL,
	`lastError` mediumtext,
	`runAfter` datetime(3) NOT NULL,
	`finishedAt` datetime(3),
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `queued_job_id` PRIMARY KEY(`id`),
	CONSTRAINT `queued_job_waiting_key_idx` UNIQUE(`kind`,`waitingKey`)
);
--> statement-breakpoint
CREATE TABLE `rating` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`mediaItemId` varchar(64),
	`seriesId` varchar(64),
	`bookId` varchar(64),
	`stars` int NOT NULL,
	`ratedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `rating_id` PRIMARY KEY(`id`),
	CONSTRAINT `rating_profile_item_idx` UNIQUE(`profileId`,`mediaItemId`),
	CONSTRAINT `rating_profile_series_idx` UNIQUE(`profileId`,`seriesId`),
	CONSTRAINT `rating_profile_book_idx` UNIQUE(`profileId`,`bookId`),
	CONSTRAINT `rating_stars_range` CHECK(`rating`.`stars` between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE `reading_progress` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`bookId` varchar(64) NOT NULL,
	`chapterId` varchar(64) NOT NULL,
	`pageNumber` int,
	`fraction` float,
	`isFinished` boolean NOT NULL DEFAULT false,
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `reading_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `reading_progress_profile_idx` UNIQUE(`profileId`,`chapterId`),
	CONSTRAINT `reading_progress_somewhere` CHECK(`reading_progress`.`pageNumber` is not null or `reading_progress`.`fraction` is not null)
);
--> statement-breakpoint
CREATE TABLE `reencode_request` (
	`id` varchar(64) NOT NULL,
	`mediaItemId` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`mode` mediumtext NOT NULL,
	`state` varchar(32) NOT NULL DEFAULT 'queued',
	`quality` mediumtext,
	`videoCodec` mediumtext,
	`audio` mediumtext NOT NULL,
	`originalPath` mediumtext NOT NULL,
	`originalSizeBytes` bigint NOT NULL,
	`originalProbe` json NOT NULL,
	`workingPath` mediumtext NOT NULL,
	`asidePath` mediumtext,
	`renditionId` varchar(64),
	`samplePath` mediumtext,
	`estimatedBytes` bigint,
	`producedBytes` bigint,
	`progress` int NOT NULL DEFAULT 0,
	`bytesPerSecond` bigint,
	`failure` mediumtext,
	`askedBy` mediumtext,
	`askedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`startedAt` datetime(3),
	`encodedAt` datetime(3),
	`reviewedAt` datetime(3),
	CONSTRAINT `reencode_request_id` PRIMARY KEY(`id`),
	CONSTRAINT `reencode_request_mode` CHECK(`reencode_request`.`mode` in ('replace', 'keep', 'audioOnly')),
	CONSTRAINT `reencode_request_state` CHECK(`reencode_request`.`state` in ('queued', 'encoding', 'verifying', 'awaitingReview', 'finished', 'rejected', 'failed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE `resource_sample` (
	`id` varchar(64) NOT NULL,
	`atMs` bigint NOT NULL,
	`systemCpuPercent` float NOT NULL,
	`loadAverage` float NOT NULL,
	`systemMemoryUsedBytes` bigint NOT NULL,
	`systemMemoryTotalBytes` bigint NOT NULL,
	`cpuCount` int NOT NULL,
	CONSTRAINT `resource_sample_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` mediumtext NOT NULL DEFAULT (''),
	`position` int NOT NULL DEFAULT 0,
	`color` mediumtext,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `role_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_name_idx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `role_permission` (
	`roleId` varchar(64) NOT NULL,
	`permission` varchar(255) NOT NULL,
	CONSTRAINT `role_permission_roleId_permission_pk` PRIMARY KEY(`roleId`,`permission`)
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`key` varchar(4096) NOT NULL,
	`keyHash` binary(32) GENERATED ALWAYS AS (unhex(sha2(`key`, 256))) STORED,
	`title` mediumtext NOT NULL,
	`externalId` mediumtext,
	`addedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `series_id` PRIMARY KEY(`id`),
	CONSTRAINT `series_key_idx` UNIQUE(`libraryId`,`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `server_setting` (
	`key` varchar(255) NOT NULL,
	`value` json NOT NULL,
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `server_setting_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(64) NOT NULL,
	`expiresAt` datetime(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL,
	`ipAddress` mediumtext,
	`userAgent` mediumtext,
	`userId` varchar(64) NOT NULL,
	`impersonatedBy` mediumtext,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `share` (
	`id` varchar(64) NOT NULL,
	`tokenHash` varchar(255) NOT NULL,
	`kind` mediumtext NOT NULL,
	`mediaItemId` varchar(64),
	`seriesId` varchar(64),
	`bookId` varchar(64),
	`createdBy` varchar(64) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`expiresAt` datetime(3),
	`viewCap` int,
	`revokedAt` datetime(3),
	CONSTRAINT `share_id` PRIMARY KEY(`id`),
	CONSTRAINT `share_token_idx` UNIQUE(`tokenHash`),
	CONSTRAINT `share_kind` CHECK(`share`.`kind` in ('item', 'series', 'book')),
	CONSTRAINT `share_view_cap` CHECK(`share`.`viewCap` is null or `share`.`viewCap` > 0)
);
--> statement-breakpoint
CREATE TABLE `share_visit` (
	`id` varchar(64) NOT NULL,
	`shareId` varchar(64) NOT NULL,
	`joiner` varchar(255) NOT NULL,
	`firstSeenAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`lastSeenAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `share_visit_id` PRIMARY KEY(`id`),
	CONSTRAINT `share_visit_joiner_idx` UNIQUE(`shareId`,`joiner`)
);
--> statement-breakpoint
CREATE TABLE `twoFactor` (
	`id` varchar(64) NOT NULL,
	`secret` mediumtext NOT NULL,
	`backupCodes` mediumtext NOT NULL,
	`userId` varchar(64) NOT NULL,
	`verified` boolean DEFAULT false,
	`failedVerificationCount` int DEFAULT 0,
	`lockedUntil` datetime(3),
	CONSTRAINT `twoFactor_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upload_session` (
	`id` varchar(64) NOT NULL,
	`libraryId` varchar(64) NOT NULL,
	`path` mediumtext NOT NULL,
	`destination` mediumtext NOT NULL,
	`staging` mediumtext NOT NULL,
	`bytes` bigint NOT NULL,
	`pieceBytes` int NOT NULL,
	`pieces` int NOT NULL,
	`received` json NOT NULL,
	`touchedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `upload_session_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(64) NOT NULL,
	`name` mediumtext NOT NULL,
	`email` varchar(320) NOT NULL,
	`emailVerified` boolean NOT NULL DEFAULT false,
	`image` mediumtext,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`twoFactorEnabled` boolean DEFAULT false,
	`role` mediumtext,
	`banned` boolean DEFAULT false,
	`banReason` mediumtext,
	`banExpires` datetime(3),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `user_permission_override` (
	`userId` varchar(64) NOT NULL,
	`permission` varchar(255) NOT NULL,
	`effect` mediumtext NOT NULL,
	`grantedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `user_permission_override_userId_permission_pk` PRIMARY KEY(`userId`,`permission`)
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`userId` varchar(64) NOT NULL,
	`displayName` mediumtext,
	`colour` mediumtext,
	`avatarStyle` mediumtext,
	`avatarSeed` mediumtext,
	`photoPath` mediumtext,
	`onboardedAt` datetime(3),
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `user_profile_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_role` (
	`userId` varchar(64) NOT NULL,
	`roleId` varchar(64) NOT NULL,
	`grantedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `user_role_userId_roleId_pk` PRIMARY KEY(`userId`,`roleId`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(64) NOT NULL,
	`identifier` mediumtext NOT NULL,
	`value` mediumtext NOT NULL,
	`expiresAt` datetime(3) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewer_profile` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`name` mediumtext NOT NULL,
	`colour` mediumtext NOT NULL,
	`avatarStyle` mediumtext,
	`avatarSeed` mediumtext,
	`photoPath` mediumtext,
	`avatarLook` json,
	`askStillWatchingAfter` int NOT NULL DEFAULT 4,
	`showsWhatIamWatching` boolean NOT NULL DEFAULT false,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `viewer_profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watch_history` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`mediaItemId` varchar(64) NOT NULL,
	`startedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`lastWatchedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`secondsWatched` float NOT NULL DEFAULT 0,
	`isFinished` boolean NOT NULL DEFAULT false,
	CONSTRAINT `watch_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watch_progress` (
	`id` varchar(64) NOT NULL,
	`profileId` varchar(64) NOT NULL,
	`mediaItemId` varchar(64) NOT NULL,
	`positionSeconds` float NOT NULL,
	`durationSeconds` float NOT NULL,
	`isFinished` boolean NOT NULL DEFAULT false,
	`updatedAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	CONSTRAINT `watch_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `watch_progress_profile_idx` UNIQUE(`profileId`,`mediaItemId`)
);
--> statement-breakpoint
CREATE TABLE `webhook_delivery` (
	`id` varchar(64) NOT NULL,
	`subscriptionId` varchar(64) NOT NULL,
	`eventId` varchar(255) NOT NULL,
	`event` mediumtext NOT NULL,
	`body` longtext NOT NULL,
	`attempts` int NOT NULL DEFAULT 1,
	`firstAttemptAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`lastAttemptAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`ok` boolean NOT NULL DEFAULT false,
	`status` int,
	`error` mediumtext,
	CONSTRAINT `webhook_delivery_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_delivery_occurrence_idx` UNIQUE(`subscriptionId`,`eventId`)
);
--> statement-breakpoint
CREATE TABLE `webhook_subscription` (
	`id` varchar(64) NOT NULL,
	`name` mediumtext NOT NULL,
	`url` mediumtext NOT NULL,
	`secret` mediumtext NOT NULL,
	`preset` varchar(64) NOT NULL DEFAULT 'generic',
	`events` json NOT NULL,
	`filters` json NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` datetime(3) NOT NULL DEFAULT (current_timestamp(3)),
	`lastAttemptAt` datetime(3),
	`lastStatus` int,
	`lastError` mediumtext,
	CONSTRAINT `webhook_subscription_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `account_activity` ADD CONSTRAINT `account_activity_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `age_ceiling` ADD CONSTRAINT `age_ceiling_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `age_ceiling` ADD CONSTRAINT `age_ceiling_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `age_exception` ADD CONSTRAINT `age_exception_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `age_exception` ADD CONSTRAINT `age_exception_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `age_exception` ADD CONSTRAINT `age_exception_seriesId_series_id_fk` FOREIGN KEY (`seriesId`) REFERENCES `series`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `age_exception` ADD CONSTRAINT `age_exception_grantedBy_user_id_fk` FOREIGN KEY (`grantedBy`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apikey` ADD CONSTRAINT `apikey_referenceId_user_id_fk` FOREIGN KEY (`referenceId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `book` ADD CONSTRAINT `book_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `book_chapter` ADD CONSTRAINT `book_chapter_bookId_book_id_fk` FOREIGN KEY (`bookId`) REFERENCES `book`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deviceCode` ADD CONSTRAINT `deviceCode_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `download_holding` ADD CONSTRAINT `download_holding_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `download_holding` ADD CONSTRAINT `download_holding_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favourite` ADD CONSTRAINT `favourite_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favourite` ADD CONSTRAINT `favourite_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favourite` ADD CONSTRAINT `favourite_bookId_book_id_fk` FOREIGN KEY (`bookId`) REFERENCES `book`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favourite_artist` ADD CONSTRAINT `favourite_artist_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favourite_artist` ADD CONSTRAINT `favourite_artist_artistId_music_artist_id_fk` FOREIGN KEY (`artistId`) REFERENCES `music_artist`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hidden` ADD CONSTRAINT `hidden_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hidden` ADD CONSTRAINT `hidden_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hidden` ADD CONSTRAINT `hidden_seriesId_series_id_fk` FOREIGN KEY (`seriesId`) REFERENCES `series`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hidden` ADD CONSTRAINT `hidden_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_run_issue` ADD CONSTRAINT `job_run_issue_jobRunId_job_run_id_fk` FOREIGN KEY (`jobRunId`) REFERENCES `job_run`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `library_block` ADD CONSTRAINT `library_block_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `library_block` ADD CONSTRAINT `library_block_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listening_progress` ADD CONSTRAINT `listening_progress_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listening_progress` ADD CONSTRAINT `listening_progress_bookId_book_id_fk` FOREIGN KEY (`bookId`) REFERENCES `book`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listening_progress` ADD CONSTRAINT `listening_progress_chapterId_book_chapter_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `book_chapter`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_artwork_choice` ADD CONSTRAINT `media_artwork_choice_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_item` ADD CONSTRAINT `media_item_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_item` ADD CONSTRAINT `media_item_parentId_media_item_id_fk` FOREIGN KEY (`parentId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_item` ADD CONSTRAINT `media_item_seriesId_series_id_fk` FOREIGN KEY (`seriesId`) REFERENCES `series`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_item_job` ADD CONSTRAINT `media_item_job_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_override` ADD CONSTRAINT `media_override_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_preview_override` ADD CONSTRAINT `media_preview_override_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_rendition` ADD CONSTRAINT `media_rendition_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_segment` ADD CONSTRAINT `media_segment_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `music_album` ADD CONSTRAINT `music_album_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `music_album` ADD CONSTRAINT `music_album_artistId_music_artist_id_fk` FOREIGN KEY (`artistId`) REFERENCES `music_artist`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `music_artist` ADD CONSTRAINT `music_artist_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `music_track` ADD CONSTRAINT `music_track_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `music_track` ADD CONSTRAINT `music_track_albumId_music_album_id_fk` FOREIGN KEY (`albumId`) REFERENCES `music_album`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `music_track_artist` ADD CONSTRAINT `music_track_artist_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `music_track_artist` ADD CONSTRAINT `music_track_artist_artistId_music_artist_id_fk` FOREIGN KEY (`artistId`) REFERENCES `music_artist`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification` ADD CONSTRAINT `notification_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_preference` ADD CONSTRAINT `notification_preference_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `passkey` ADD CONSTRAINT `passkey_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlist` ADD CONSTRAINT `playlist_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlist_entry` ADD CONSTRAINT `playlist_entry_playlistId_playlist_id_fk` FOREIGN KEY (`playlistId`) REFERENCES `playlist`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlist_entry` ADD CONSTRAINT `playlist_entry_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_connection` ADD CONSTRAINT `plugin_connection_pluginId_plugin_installation_id_fk` FOREIGN KEY (`pluginId`) REFERENCES `plugin_installation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_connection` ADD CONSTRAINT `plugin_connection_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_hook` ADD CONSTRAINT `plugin_hook_pluginId_plugin_installation_id_fk` FOREIGN KEY (`pluginId`) REFERENCES `plugin_installation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_installation` ADD CONSTRAINT `plugin_installation_installedBy_user_id_fk` FOREIGN KEY (`installedBy`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_previous` ADD CONSTRAINT `plugin_previous_pluginId_plugin_installation_id_fk` FOREIGN KEY (`pluginId`) REFERENCES `plugin_installation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_profile` ADD CONSTRAINT `plugin_profile_pluginId_plugin_installation_id_fk` FOREIGN KEY (`pluginId`) REFERENCES `plugin_installation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_profile` ADD CONSTRAINT `plugin_profile_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plugin_storage` ADD CONSTRAINT `plugin_storage_pluginId_plugin_installation_id_fk` FOREIGN KEY (`pluginId`) REFERENCES `plugin_installation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prepared_download` ADD CONSTRAINT `prepared_download_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prepared_download` ADD CONSTRAINT `prepared_download_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `push_subscription` ADD CONSTRAINT `push_subscription_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rating` ADD CONSTRAINT `rating_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rating` ADD CONSTRAINT `rating_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rating` ADD CONSTRAINT `rating_seriesId_series_id_fk` FOREIGN KEY (`seriesId`) REFERENCES `series`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rating` ADD CONSTRAINT `rating_bookId_book_id_fk` FOREIGN KEY (`bookId`) REFERENCES `book`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_progress` ADD CONSTRAINT `reading_progress_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_progress` ADD CONSTRAINT `reading_progress_bookId_book_id_fk` FOREIGN KEY (`bookId`) REFERENCES `book`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_progress` ADD CONSTRAINT `reading_progress_chapterId_book_chapter_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `book_chapter`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reencode_request` ADD CONSTRAINT `reencode_request_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reencode_request` ADD CONSTRAINT `reencode_request_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permission` ADD CONSTRAINT `role_permission_roleId_role_id_fk` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `series` ADD CONSTRAINT `series_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `share` ADD CONSTRAINT `share_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `share` ADD CONSTRAINT `share_seriesId_series_id_fk` FOREIGN KEY (`seriesId`) REFERENCES `series`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `share` ADD CONSTRAINT `share_bookId_book_id_fk` FOREIGN KEY (`bookId`) REFERENCES `book`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `share` ADD CONSTRAINT `share_createdBy_user_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `share_visit` ADD CONSTRAINT `share_visit_shareId_share_id_fk` FOREIGN KEY (`shareId`) REFERENCES `share`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `twoFactor` ADD CONSTRAINT `twoFactor_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `upload_session` ADD CONSTRAINT `upload_session_libraryId_library_id_fk` FOREIGN KEY (`libraryId`) REFERENCES `library`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permission_override` ADD CONSTRAINT `user_permission_override_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profile` ADD CONSTRAINT `user_profile_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_role` ADD CONSTRAINT `user_role_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_role` ADD CONSTRAINT `user_role_roleId_role_id_fk` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `viewer_profile` ADD CONSTRAINT `viewer_profile_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watch_history` ADD CONSTRAINT `watch_history_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watch_history` ADD CONSTRAINT `watch_history_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watch_progress` ADD CONSTRAINT `watch_progress_profileId_viewer_profile_id_fk` FOREIGN KEY (`profileId`) REFERENCES `viewer_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watch_progress` ADD CONSTRAINT `watch_progress_mediaItemId_media_item_id_fk` FOREIGN KEY (`mediaItemId`) REFERENCES `media_item`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhook_delivery` ADD CONSTRAINT `webhook_delivery_subscriptionId_webhook_subscription_id_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `webhook_subscription`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `age_ceiling_library_idx` ON `age_ceiling` (`libraryId`);--> statement-breakpoint
CREATE INDEX `age_exception_subject_item_idx` ON `age_exception` (`mediaItemId`);--> statement-breakpoint
CREATE INDEX `age_exception_subject_series_idx` ON `age_exception` (`seriesId`);--> statement-breakpoint
CREATE INDEX `book_library_idx` ON `book` (`libraryId`);--> statement-breakpoint
CREATE INDEX `book_title_idx` ON `book` (`title`);--> statement-breakpoint
CREATE INDEX `book_chapter_order_idx` ON `book_chapter` (`bookId`,`number`);--> statement-breakpoint
CREATE INDEX `download_holding_profile_idx` ON `download_holding` (`profileId`,`heldAt`);--> statement-breakpoint
CREATE INDEX `favourite_recent_idx` ON `favourite` (`profileId`,`keptAt`);--> statement-breakpoint
CREATE INDEX `favourite_artist_recent_idx` ON `favourite_artist` (`profileId`,`keptAt`);--> statement-breakpoint
CREATE INDEX `hidden_item_idx` ON `hidden` (`mediaItemId`);--> statement-breakpoint
CREATE INDEX `hidden_series_idx` ON `hidden` (`seriesId`);--> statement-breakpoint
CREATE INDEX `hidden_library_idx` ON `hidden` (`libraryId`);--> statement-breakpoint
CREATE INDEX `job_run_kind_idx` ON `job_run` (`kind`,`createdAt`);--> statement-breakpoint
CREATE INDEX `job_run_status_idx` ON `job_run` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `job_run_issue_run_idx` ON `job_run_issue` (`jobRunId`);--> statement-breakpoint
CREATE INDEX `job_trigger_kind_idx` ON `job_trigger` (`kind`);--> statement-breakpoint
CREATE INDEX `library_block_library_idx` ON `library_block` (`libraryId`);--> statement-breakpoint
CREATE INDEX `listening_progress_recent_idx` ON `listening_progress` (`profileId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `log_record_at_idx` ON `log_record` (`at`);--> statement-breakpoint
CREATE INDEX `log_record_level_idx` ON `log_record` (`level`,`at`);--> statement-breakpoint
CREATE INDEX `log_record_source_idx` ON `log_record` (`source`,`at`);--> statement-breakpoint
CREATE INDEX `log_record_job_idx` ON `log_record` (`jobId`);--> statement-breakpoint
CREATE INDEX `log_record_job_kind_idx` ON `log_record` (`jobKind`,`at`);--> statement-breakpoint
CREATE INDEX `log_record_library_idx` ON `log_record` (`libraryId`,`at`);--> statement-breakpoint
CREATE INDEX `log_record_media_idx` ON `log_record` (`mediaId`,`at`);--> statement-breakpoint
CREATE INDEX `log_record_session_idx` ON `log_record` (`sessionId`,`at`);--> statement-breakpoint
CREATE INDEX `log_record_request_idx` ON `log_record` (`requestId`,`at`);--> statement-breakpoint
CREATE INDEX `log_record_forget_idx` ON `log_record` (`forgetAfter`);--> statement-breakpoint
CREATE INDEX `log_record_same_event_idx` ON `log_record` (`sameEventKeyHash`,`at`);--> statement-breakpoint
CREATE INDEX `media_item_library_idx` ON `media_item` (`libraryId`);--> statement-breakpoint
CREATE INDEX `media_item_title_idx` ON `media_item` (`title`);--> statement-breakpoint
CREATE INDEX `media_item_series_idx` ON `media_item` (`seriesTitle`,`seasonNumber`);--> statement-breakpoint
CREATE INDEX `media_item_series_id_idx` ON `media_item` (`seriesId`,`seasonNumber`);--> statement-breakpoint
CREATE INDEX `media_item_parent_idx` ON `media_item` (`parentId`);--> statement-breakpoint
CREATE INDEX `media_item_job_kind_idx` ON `media_item_job` (`kind`);--> statement-breakpoint
CREATE INDEX `media_override_library_idx` ON `media_override` (`libraryId`);--> statement-breakpoint
CREATE INDEX `media_preview_override_library_idx` ON `media_preview_override` (`libraryId`);--> statement-breakpoint
CREATE INDEX `media_rendition_item_idx` ON `media_rendition` (`mediaItemId`);--> statement-breakpoint
CREATE INDEX `media_segment_item_idx` ON `media_segment` (`mediaItemId`);--> statement-breakpoint
CREATE INDEX `music_album_release_group_idx` ON `music_album` (`libraryId`,`releaseGroupMusicbrainzId`);--> statement-breakpoint
CREATE INDEX `music_album_recent_idx` ON `music_album` (`libraryId`,`addedAt`);--> statement-breakpoint
CREATE INDEX `music_album_artist_idx` ON `music_album` (`artistId`);--> statement-breakpoint
CREATE INDEX `music_artist_sort_idx` ON `music_artist` (`libraryId`,`sortName`);--> statement-breakpoint
CREATE INDEX `music_track_album_idx` ON `music_track` (`albumId`,`discNumber`,`trackNumber`);--> statement-breakpoint
CREATE INDEX `music_track_artist_artist_idx` ON `music_track_artist` (`artistId`);--> statement-breakpoint
CREATE INDEX `notification_unread_idx` ON `notification` (`userId`,`readAt`);--> statement-breakpoint
CREATE INDEX `notification_recent_idx` ON `notification` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `playlist_owner_idx` ON `playlist` (`profileId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `playlist_shared_idx` ON `playlist` (`isShared`);--> statement-breakpoint
CREATE INDEX `playlist_entry_order_idx` ON `playlist_entry` (`playlistId`,`position`);--> statement-breakpoint
CREATE INDEX `prepared_download_rendition_idx` ON `prepared_download` (`renditionId`);--> statement-breakpoint
CREATE INDEX `prepared_download_recent_idx` ON `prepared_download` (`profileId`,`askedAt`);--> statement-breakpoint
CREATE INDEX `push_subscription_user_idx` ON `push_subscription` (`userId`);--> statement-breakpoint
CREATE INDEX `queued_job_next_idx` ON `queued_job` (`kind`,`state`,`runAfter`);--> statement-breakpoint
CREATE INDEX `queued_job_subject_idx` ON `queued_job` (`subject`,`state`);--> statement-breakpoint
CREATE INDEX `queued_job_finished_idx` ON `queued_job` (`state`,`finishedAt`);--> statement-breakpoint
CREATE INDEX `rating_item_idx` ON `rating` (`mediaItemId`);--> statement-breakpoint
CREATE INDEX `rating_series_idx` ON `rating` (`seriesId`);--> statement-breakpoint
CREATE INDEX `rating_book_idx` ON `rating` (`bookId`);--> statement-breakpoint
CREATE INDEX `reading_progress_recent_idx` ON `reading_progress` (`profileId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `reading_progress_book_idx` ON `reading_progress` (`profileId`,`bookId`);--> statement-breakpoint
CREATE INDEX `reencode_request_state_idx` ON `reencode_request` (`state`,`askedAt`);--> statement-breakpoint
CREATE INDEX `reencode_request_item_idx` ON `reencode_request` (`mediaItemId`);--> statement-breakpoint
CREATE INDEX `reencode_request_library_idx` ON `reencode_request` (`libraryId`);--> statement-breakpoint
CREATE INDEX `resource_sample_at_idx` ON `resource_sample` (`atMs`);--> statement-breakpoint
CREATE INDEX `series_library_idx` ON `series` (`libraryId`);--> statement-breakpoint
CREATE INDEX `share_creator_idx` ON `share` (`createdBy`);--> statement-breakpoint
CREATE INDEX `share_visit_share_idx` ON `share_visit` (`shareId`);--> statement-breakpoint
CREATE INDEX `upload_session_touched_idx` ON `upload_session` (`touchedAt`);--> statement-breakpoint
CREATE INDEX `user_role_role_idx` ON `user_role` (`roleId`);--> statement-breakpoint
CREATE INDEX `viewer_profile_user_idx` ON `viewer_profile` (`userId`);--> statement-breakpoint
CREATE INDEX `watch_history_recent_idx` ON `watch_history` (`profileId`,`lastWatchedAt`);--> statement-breakpoint
CREATE INDEX `watch_history_item_idx` ON `watch_history` (`mediaItemId`);--> statement-breakpoint
CREATE INDEX `watch_progress_recent_idx` ON `watch_progress` (`profileId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `webhook_delivery_recent_idx` ON `webhook_delivery` (`subscriptionId`,`lastAttemptAt`);--> statement-breakpoint
CREATE INDEX `webhook_delivery_pruning_idx` ON `webhook_delivery` (`lastAttemptAt`);--> statement-breakpoint
CREATE INDEX `webhook_subscription_enabled_idx` ON `webhook_subscription` (`enabled`);