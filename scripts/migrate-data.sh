#!/usr/bin/env bash
# Migración de datos: portal_db (origen) -> portal_db (destino con estructura.sql).
#
# Estrategia: como la estructura es idéntica, usamos pg_dump --data-only
# --disable-triggers para volcar SOLO los datos respetando orden de FK,
# y cargarlos en la base destino.
#
# Uso:
#   ./scripts/migrate-data.sh                        # usa valores por defecto
#   SRC_URL=... DEST_URL=... ./scripts/migrate-data.sh
#
# Defaults:
#   SRC_URL  = postgresql://portal:portal_secret@localhost:5434/portal_db
#   DEST_URL = postgresql://portal:portal_secret@localhost:5434/portal_db_new
#
# Requiere: pg_dump y psql (16+) disponibles en el host, o usa el contenedor
# portal_db via docker exec (modo --docker).

set -euo pipefail

SRC_URL="${SRC_URL:-postgresql://portal:portal_secret@localhost:5434/portal_db}"
DEST_URL="${DEST_URL:-postgresql://portal:portal_secret@localhost:5434/portal_db_new}"
SCHEMA_FILE="${SCHEMA_FILE:-$(dirname "$0")/../estructura.sql}"
MODE="${1:-local}"   # local | docker

echo "==> Modo: $MODE"
echo "==> Origen:  $SRC_URL"
echo "==> Destino: $DEST_URL"
echo "==> Esquema: $SCHEMA_FILE"

pg_dump_cmd() { pg_dump "$@"; }
psql_cmd()    { psql    "$@"; }

if [[ "$MODE" == "docker" ]]; then
  pg_dump_cmd() { docker exec -i portal_db pg_dump "$@"; }
  psql_cmd()    { docker exec -i portal_db psql    "$@"; }
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
DATA_DUMP="$TMP_DIR/data.sql"

echo "==> [1/4] Creando base destino si no existe..."
DEST_DB="$(basename "$DEST_URL")"
DEST_ADMIN="${DEST_URL%/*}/postgres"
psql_cmd "$DEST_ADMIN" -tc "SELECT 1 FROM pg_database WHERE datname = '$DEST_DB'" \
  | grep -q 1 || psql_cmd "$DEST_ADMIN" -c "CREATE DATABASE \"$DEST_DB\" OWNER portal;"

echo "==> [2/4] Aplicando estructura.sql en destino..."
psql_cmd "$DEST_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE" > /dev/null

echo "==> [3/4] Volcando datos del origen..."
pg_dump_cmd "$SRC_URL" \
  --data-only \
  --disable-triggers \
  --no-owner \
  --no-privileges \
  --column-inserts \
  > "$DATA_DUMP"

ROWS=$(grep -c '^INSERT INTO' "$DATA_DUMP" || true)
echo "    -> $ROWS sentencias INSERT generadas"

echo "==> [4/4] Cargando datos en destino (transacción)..."
psql_cmd "$DEST_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$DATA_DUMP" > /dev/null

echo "==> Verificando conteos..."
for t in users companies vacancies applications; do
  SRC_N=$(psql_cmd "$SRC_URL"  -tAc "SELECT COUNT(*) FROM public.$t" 2>/dev/null || echo "?")
  DST_N=$(psql_cmd "$DEST_URL" -tAc "SELECT COUNT(*) FROM public.$t" 2>/dev/null || echo "?")
  printf "    %-15s origen=%-6s destino=%-6s\n" "$t" "$SRC_N" "$DST_N"
done

echo "==> Migración completada."
