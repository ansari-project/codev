#!/usr/bin/env bash

set -e

BATS_ROOT="${0%/*}"
PREFIX="${1%/}"
LIBDIR="${2:-lib}"

if [[ -z "$PREFIX" ]]; then
  printf '%s\n' \
    "usage: $0 <prefix> [base_libdir]" \
    "  e.g. $0 /usr/local" \
    "       $0 /usr/local lib64" >&2
  exit 1
fi

BATS_LIBDIR=$PREFIX/$LIBDIR/bats/bats-file

install -d -m 755 "$BATS_LIBDIR/src"
install -m 755 "$BATS_ROOT/load.bash" "$BATS_LIBDIR"
install -m 755 "$BATS_ROOT/src/"* "$BATS_LIBDIR/src"

echo "Installed Bats File to $BATS_LIBDIR"
