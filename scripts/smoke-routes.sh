#!/usr/bin/env bash
set -e
HOST="${1:-http://localhost:3000}"
fail=0
ok=0

check() {
  local method=$1
  local path=$2
  local body=${3:-'{}'}
  local code
  if [ "$method" = "GET" ]; then
    code=$(curl -s -o /dev/null -w '%{http_code}' "$HOST$path")
  else
    code=$(curl -s -o /dev/null -w '%{http_code}' -X "$method" "$HOST$path" -H 'Content-Type: application/json' -d "$body")
  fi
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "✅ $method $path -> $code"
    ok=$((ok+1))
  else
    echo "❌ $method $path -> $code"
    fail=$((fail+1))
  fi
}

check GET  /api/health
check POST /api/backboard/thread
check POST /api/teacher/parse-document '{"uploadId":"u1","fileName":"test.pdf"}'
check POST /api/teacher/generate-course-outline '{"documentId":"d1","topic":"photosynthesis","gradeLevel":3,"curriculumStandard":"BC G3 Sci 2.1"}'
check POST /api/teacher/audit-content '{"targetGrade":3}'
check POST /api/teacher/adjust-eal '{"content":"Plants are awesome","targetEalLevel":"Emerging"}'
check POST /api/teacher/search-curriculum '{"query":"plants"}'
check POST /api/teacher/map-curriculum '{"contentId":"c1","jurisdictions":["BC"]}'
check POST /api/teacher/classroom '{"action":"list"}'
check POST /api/teacher/bulk-update-eal '{"updates":[]}'
check POST /api/teacher/search-resources '{"query":"plants"}'
check POST /api/teacher/generate-quiz '{"contentId":"c1","questionCount":3,"targetEalLevel":"Emerging"}'
check POST /api/teacher/preview-student '{"studentId":"maya","lessonId":"photosynthesis-1","activityType":"text"}'
check POST /api/teacher/generate-report '{"scope":"student","targetId":"maya"}'
check POST /api/teacher/simplify-text '{"text":"Photosynthesis is the conversion of light into chemical energy.","targetReadingLevel":"grade3"}'
check POST /api/teacher/create-student '{"name":"Sam","grade":4,"ealLevel":"Developing","interests":["soccer"]}'
check POST /api/teacher/student-analytics '{"studentId":"maya"}'
check POST /api/student/generate-text-lesson '{"studentId":"maya","lessonId":"photosynthesis-1","topic":"photosynthesis","learningObjectives":["lo-1"]}'
check POST /api/student/generate-video-questions '{"studentId":"maya","lessonId":"photosynthesis-1","youtubeId":"UPBMG5EYydo","learningObjectives":["lo-1"]}'
check POST /api/student/search-youtube '{"topic":"photosynthesis","gradeLevel":3}'
check POST /api/student/generate-story-node '{"studentId":"maya","lessonId":"photosynthesis-1","isFirstNode":true}'
check POST /api/student/generate-story-image '{"studentId":"maya","sceneDescription":"butterfly garden","theme":"butterflies"}'
check POST /api/student/submit-quiz-answer '{"studentId":"maya","lessonId":"l1","questionId":"q1","questionType":"multiple-choice","answer":0,"correctAnswerIndex":0}'
check POST /api/student/progress '{"studentId":"maya"}'
check POST /api/student/placement-quiz '{"studentName":"Sam","grade":3,"action":"next"}'
check POST /api/student/voice-session '{"studentId":"maya","lessonId":"photosynthesis-1","activitySubtype":"explain-back"}'
check POST /api/student/dashboard '{"studentId":"maya"}'
check POST /api/youtube/search '{"topic":"photosynthesis","gradeLevel":3}'
check POST /api/youtube/transcript '{"youtubeId":"UPBMG5EYydo"}'

echo ""
echo "==== ${ok} ok / ${fail} failed ===="
exit $fail
