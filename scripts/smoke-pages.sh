#!/usr/bin/env bash
HOST="${1:-http://localhost:3000}"
PATHS=(
  /
  /teacher
  /teacher/courses
  /teacher/courses/photosynthesis-101
  /teacher/analytics
  /teacher/classroom
  /teacher/resources
  /student/maya
  /student/liam
  /student/maya/onboarding
  /student/maya/lesson/photosynthesis-1/text
  /student/maya/lesson/photosynthesis-1/video
  /student/maya/lesson/photosynthesis-1/voice
  /student/maya/lesson/photosynthesis-1/story
  /student/liam/lesson/photosynthesis-1/text
  /student/liam/lesson/photosynthesis-1/story
)
ok=0
fail=0
for path in "${PATHS[@]}"; do
  code=$(/usr/bin/curl -s -o /dev/null -w '%{http_code}' "${HOST}${path}")
  if [ "$code" = "200" ]; then
    echo "✅ $code $path"
    ok=$((ok+1))
  else
    echo "❌ $code $path"
    fail=$((fail+1))
  fi
done
echo "==== ${ok} ok / ${fail} failed ===="
exit $fail
