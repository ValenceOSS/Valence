-- A profile photograph used to be recorded by its whole path, which baked the directory it happened
-- to sit in that day into every row. Moving the mount then orphaned every face even though the
-- files were still there. What is kept now is the filename, joined to wherever photographs live.
UPDATE "viewer_profile"
SET "photoPath" = regexp_replace("photoPath", '^.*/', '')
WHERE "photoPath" IS NOT NULL;
