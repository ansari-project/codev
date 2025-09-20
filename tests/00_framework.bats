#!/usr/bin/env bats
# Test to verify bats framework is properly installed

@test "bats framework is working" {
  [ 1 -eq 1 ]
}

@test "can access project root" {
  PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  [ -d "$PROJECT_ROOT/codev-skeleton" ]
}

@test "can load bats-support" {
  load 'lib/bats-support/load'
  # If this loads without error, test passes
}

@test "can load bats-assert" {
  load 'lib/bats-support/load'
  load 'lib/bats-assert/load'
  # If this loads without error, test passes
}

@test "can load bats-file" {
  load 'lib/bats-support/load'
  load 'lib/bats-file/load'
  # If this loads without error, test passes
}