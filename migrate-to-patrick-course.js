/**
 * 기존 직원용 강의를 "패트릭" 과목으로 마이그레이션
 *
 * 사용방법:
 * 1. https://guidedog-system.vercel.app 에 접속
 * 2. F12를 눌러 개발자 도구 열기
 * 3. Console 탭으로 이동
 * 4. 이 파일의 내용을 복사해서 붙여넣고 Enter
 */

(function() {
  const COURSES_KEY = 'guidedog_staff_courses';
  const LECTURES_KEY = 'guidedog_staff_lectures';

  // 1. 기존 데이터 가져오기
  const existingLectures = JSON.parse(localStorage.getItem(LECTURES_KEY) || '[]');
  const existingCourses = JSON.parse(localStorage.getItem(COURSES_KEY) || '[]');

  console.log(`기존 강의 수: ${existingLectures.length}개`);
  console.log(`기존 과목 수: ${existingCourses.length}개`);

  // 2. "패트릭" 과목이 이미 있는지 확인
  let patrickCourse = existingCourses.find(c => c.name === '패트릭');

  if (!patrickCourse) {
    // 3. "패트릭" 과목 생성
    patrickCourse = {
      id: 'course_patrick_' + Date.now(),
      name: '패트릭',
      description: '기존 강의 모음',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    existingCourses.unshift(patrickCourse);
    console.log('✅ "패트릭" 과목 생성됨');
  } else {
    console.log('ℹ️ "패트릭" 과목이 이미 존재합니다');
  }

  // 4. courseId가 없는 모든 강의를 "패트릭" 과목으로 이동
  let migratedCount = 0;
  const updatedLectures = existingLectures.map(lecture => {
    if (!lecture.courseId) {
      migratedCount++;
      return {
        ...lecture,
        courseId: patrickCourse.id,
        updatedAt: new Date().toISOString()
      };
    }
    return lecture;
  });

  // 5. localStorage에 저장
  localStorage.setItem(COURSES_KEY, JSON.stringify(existingCourses));
  localStorage.setItem(LECTURES_KEY, JSON.stringify(updatedLectures));

  console.log(`✅ ${migratedCount}개의 강의가 "패트릭" 과목으로 이동되었습니다`);
  console.log('🎉 마이그레이션 완료!');
  console.log('페이지를 새로고침하세요 (F5)');

  // 결과 요약
  console.log('\n=== 마이그레이션 결과 ===');
  console.log(`전체 과목 수: ${existingCourses.length}개`);
  console.log(`전체 강의 수: ${updatedLectures.length}개`);
  console.log(`"패트릭" 과목의 강의 수: ${updatedLectures.filter(l => l.courseId === patrickCourse.id).length}개`);
})();
