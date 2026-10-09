ALTER TABLE `requests_media_request` ADD `book_formats` json;--> statement-breakpoint
ALTER TABLE `requests_request_item` ADD `format` varchar(16);--> statement-breakpoint
UPDATE `requests_media_request` SET `book_formats` = JSON_ARRAY('ebook') WHERE `kind` = 'book';--> statement-breakpoint
UPDATE `requests_request_item` SET `format` = 'ebook' WHERE `request_id` IN (SELECT `id` FROM `requests_media_request` WHERE `kind` = 'book');
