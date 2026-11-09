CREATE TABLE `requests_annas_book` (
	`md5` char(32) NOT NULL,
	`title` varchar(1000) NOT NULL,
	`author` varchar(500),
	`language` varchar(8) NOT NULL,
	`extension` varchar(8) NOT NULL,
	`size_bytes` double,
	`year` int,
	`cover_url` varchar(1000),
	`torrent_group` varchar(64) NOT NULL,
	`torrent` varchar(300) NOT NULL,
	`file_in_torrent` varchar(500) NOT NULL,
	`search_key` varchar(1500) NOT NULL,
	CONSTRAINT `requests_annas_book_md5` PRIMARY KEY(`md5`)
);
