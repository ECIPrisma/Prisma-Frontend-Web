#!/usr/bin/env bash
# Backup diario de PostgreSQL (HU-25 / SCRUM-37). Costo $0: disco local + copia opcional.
# Uso (cron en Server Sabio):  0 3 * * *  /opt/prisma/backup_pg.sh
# Variables: PGHOST PGPORT PGUSER PGDATABASE (y ~/.pgpass), BACKUP_DIR, KEEP_DAYS, RCLONE_REMOTE (opcional)
set -euo pipefail
BACKUP_DIR="${BACKUP_DIR:-/var/backups/prisma}"
KEEP_DAYS="${KEEP_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
f="$BACKUP_DIR/prisma_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump --no-owner "${PGDATABASE:-prisma}" | gzip > "$f"
gzip -t "$f"
find "$BACKUP_DIR" -name 'prisma_*.sql.gz' -mtime +"$KEEP_DAYS" -delete
[ -n "${RCLONE_REMOTE:-}" ] && rclone copy "$f" "$RCLONE_REMOTE" || true
echo "OK $f"
