/**
 * localStorage 데이터를 Firestore로 마이그레이션
 *
 * 사용방법:
 * 1. https://guidedog-system.vercel.app 에 관리자로 로그인
 * 2. F12를 눌러 개발자 도구 열기
 * 3. Console 탭으로 이동
 * 4. 아래 코드를 복사해서 붙여넣고 Enter
 */

(async function() {
  console.log('🚀 Firestore 마이그레이션 시작...\n');

  // Firebase Firestore 함수를 동적으로 import
  const { getFirestore, collection, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');

  // Firebase 설정
  const firebaseConfig = {
    apiKey: "AIzaSyDFpZyTGYzi2N8SrK8JmWJi-iSRSZZ0NHk",
    authDomain: "guidedogsystem.firebaseapp.com",
    projectId: "guidedogsystem",
    storageBucket: "guidedogsystem.firebasestorage.app",
    messagingSenderId: "757099883206",
    appId: "1:757099883206:web:dfd3a2e290594e1106c5c7"
  };

  // Firebase 초기화
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let totalMigrated = 0;

  // 1. 일반 강의실 강의 마이그레이션
  console.log('📚 일반 강의실 강의 마이그레이션 중...');
  const lectures = JSON.parse(localStorage.getItem('guidedog_lectures') || '[]');
  for (const lecture of lectures) {
    try {
      await setDoc(doc(db, 'lectures', lecture.id), lecture);
      totalMigrated++;
      console.log(`  ✓ 강의: ${lecture.title}`);
    } catch (error) {
      console.error(`  ✗ 실패: ${lecture.title}`, error);
    }
  }
  console.log(`✅ 일반 강의실: ${lectures.length}개 완료\n`);

  // 2. 직원용 강의실 - 과목 마이그레이션
  console.log('📂 직원용 과목 마이그레이션 중...');
  const courses = JSON.parse(localStorage.getItem('guidedog_staff_courses') || '[]');
  for (const course of courses) {
    try {
      await setDoc(doc(db, 'staff_courses', course.id), course);
      totalMigrated++;
      console.log(`  ✓ 과목: ${course.name}`);
    } catch (error) {
      console.error(`  ✗ 실패: ${course.name}`, error);
    }
  }
  console.log(`✅ 직원용 과목: ${courses.length}개 완료\n`);

  // 3. 직원용 강의실 - 강의 마이그레이션
  console.log('📖 직원용 강의 마이그레이션 중...');
  const staffLectures = JSON.parse(localStorage.getItem('guidedog_staff_lectures') || '[]');
  for (const lecture of staffLectures) {
    try {
      await setDoc(doc(db, 'staff_lectures', lecture.id), lecture);
      totalMigrated++;
      console.log(`  ✓ 강의: ${lecture.title}`);
    } catch (error) {
      console.error(`  ✗ 실패: ${lecture.title}`, error);
    }
  }
  console.log(`✅ 직원용 강의: ${staffLectures.length}개 완료\n`);

  // 4. 안내견학교 행사 영상 마이그레이션
  console.log('🎬 안내견학교 행사 영상 마이그레이션 중...');
  const videos = JSON.parse(localStorage.getItem('guidedog_school_videos') || '[]');
  for (const video of videos) {
    try {
      await setDoc(doc(db, 'school_videos', video.id), video);
      totalMigrated++;
      console.log(`  ✓ 영상: ${video.title}`);
    } catch (error) {
      console.error(`  ✗ 실패: ${video.title}`, error);
    }
  }
  console.log(`✅ 안내견학교 영상: ${videos.length}개 완료\n`);

  // 완료 메시지
  console.log('═══════════════════════════════════════');
  console.log('🎉 마이그레이션 완료!');
  console.log(`총 ${totalMigrated}개 항목이 Firestore로 이동되었습니다.`);
  console.log('═══════════════════════════════════════');
  console.log('\n📱 이제 모든 PC에서 같은 데이터를 볼 수 있습니다!');
  console.log('💡 페이지를 새로고침하세요 (F5)');
})();
