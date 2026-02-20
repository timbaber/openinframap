Files in this directory define the schema for the OpenInfraMap DB.

**Local dev:** Init order is `dev-init.sql` (extensions) → `functions.sql` (functions, drop views) → imposm import → `views.sql` (views and materialized views). To do a clean re-import (e.g. different PBF), run the full `dev-setup.sh` from the project root; it tears down volumes and re-runs the whole pipeline. Re-running only `views.sql` will fail if the materialized views already exist (they are created in `views.sql`, not dropped there).

