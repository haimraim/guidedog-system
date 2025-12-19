// 월간보고서 전체 삭제 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDFpZyTGYzi2N8SrK8JmWJi-iSRSZZ0NHk",
  authDomain: "guidedogsystem.firebaseapp.com",
  projectId: "guidedogsystem",
  storageBucket: "guidedogsystem.firebasestorage.app",
  messagingSenderId: "757099883206",
  appId: "1:757099883206:web:dfd3a2e290594e1106c5c7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAllMonthlyReports() {
  try {
    console.log('월간보고서 삭제 시작...\n');

    // 모든 월간보고서 가져오기
    const reportsSnapshot = await getDocs(collection(db, 'monthly_reports'));

    console.log(`총 ${reportsSnapshot.size}개의 월간보고서를 찾았습니다.\n`);

    if (reportsSnapshot.size === 0) {
      console.log('삭제할 월간보고서가 없습니다.');
      process.exit(0);
    }

    // 각 문서 삭제
    let deletedCount = 0;
    for (const reportDoc of reportsSnapshot.docs) {
      const data = reportDoc.data();
      console.log(`삭제 중: ${data.dogName}_${data.userName} (ID: ${reportDoc.id})`);

      await deleteDoc(doc(db, 'monthly_reports', reportDoc.id));
      deletedCount++;
      console.log(`✓ 삭제 완료 (${deletedCount}/${reportsSnapshot.size})\n`);
    }

    console.log(`\n모든 월간보고서 삭제 완료! (총 ${deletedCount}개)`);
    process.exit(0);
  } catch (error) {
    console.error('삭제 중 오류 발생:', error);
    process.exit(1);
  }
}

deleteAllMonthlyReports();
